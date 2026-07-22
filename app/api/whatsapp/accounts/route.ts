import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { WhatsAppAccount } from "@/lib/models/WhatsAppAccount";
import { getAuth } from "@/lib/auth";
import { getPlanLimits } from "@/lib/plans";
import { Store } from "@/lib/models/Store";
import { verifyStoreOwnership } from "@/lib/whatsapp-middleware";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuth(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const url = new URL(req.url);
    const storeId = url.searchParams.get("storeId");
    if (!storeId) return NextResponse.json({ error: "storeId requerido" }, { status: 400 });

    const ownership = await verifyStoreOwnership(storeId, auth);
    if (!ownership.ok) return NextResponse.json({ error: ownership.error }, { status: 403 });

    await connectDB();
    const accounts = await WhatsAppAccount.find({ storeId })
      .sort({ createdAt: -1 })
      .lean();

    const safeAccounts = accounts.map(a => ({
      _id: a._id,
      wabaId: a.wabaId,
      phoneNumberId: a.phoneNumberId,
      phoneNumber: a.phoneNumber,
      displayName: a.displayName,
      verifiedName: a.verifiedName,
      status: a.status,
      qualityRating: a.qualityRating,
      messagingLimitTier: a.messagingLimitTier,
      messagesSentToday: a.messagesSentToday,
      connectedAt: a.connectedAt,
      createdAt: a.createdAt,
    }));

    const store = await Store.findById(storeId).lean().select("subscription").catch(() => null);
    const subscription = (store as any)?.subscription || "free";
    const limits = getPlanLimits(subscription);
    const accountsUsed = accounts.filter(a => a.status === "active" || a.status === "pending").length;

    return NextResponse.json({
      accounts: safeAccounts,
      limits: {
        maxNumbers: limits.maxWhatsAppNumbers,
        maxPerDay: limits.maxWhatsAppMessagesPerDay,
        maxTemplates: limits.maxWhatsAppTemplates,
        numbersUsed: accountsUsed,
        numbersRemaining: Math.max(0, limits.maxWhatsAppNumbers - accountsUsed),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Error al obtener cuentas" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuth(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await req.json();
    const { storeId, wabaId, phoneNumberId, accessToken, phoneNumber, displayName } = body;

    if (!storeId || !wabaId || !phoneNumberId || !accessToken) {
      return NextResponse.json({ error: "storeId, wabaId, phoneNumberId y accessToken son requeridos" }, { status: 400 });
    }

    const ownership = await verifyStoreOwnership(storeId, auth);
    if (!ownership.ok) return NextResponse.json({ error: ownership.error }, { status: 403 });

    await connectDB();

    const store = await Store.findById(storeId).lean().select("subscription").catch(() => null);
    const subscription = (store as any)?.subscription || "free";
    const limits = getPlanLimits(subscription);

    if (limits.maxWhatsAppNumbers <= 0) {
      return NextResponse.json({
        error: "Tu plan no incluye WhatsApp Business. Actualiza tu plan para usar WhatsApp.",
        code: "PLAN_NO_WHATSAPP",
      }, { status: 403 });
    }

    const accountsUsed = await WhatsAppAccount.countDocuments({ storeId, status: { $in: ["active", "pending"] } });
    if (accountsUsed >= limits.maxWhatsAppNumbers) {
      return NextResponse.json({
        error: `Has alcanzado el límite de ${limits.maxWhatsAppNumbers} número(s) de WhatsApp en tu plan.`,
        code: "LIMIT_WHATSAPP_NUMBERS",
      }, { status: 403 });
    }

    const existing = await WhatsAppAccount.findOne({ storeId, phoneNumberId });
    if (existing) {
      return NextResponse.json({ error: "Este número de teléfono ya está conectado" }, { status: 409 });
    }

    let verifiedName = "";
    try {
      const metaRes = await fetch(
        `https://graph.facebook.com/v22.0/${phoneNumberId}?fields=verified_name,display_phone_number&access_token=${accessToken}`
      );
      const metaData = await metaRes.json();
      if (metaRes.ok) {
        verifiedName = metaData.verified_name || "";
        if (!phoneNumber && metaData.display_phone_number) {
          body.phoneNumber = metaData.display_phone_number;
        }
      }
    } catch {}

    const account = await WhatsAppAccount.create({
      storeId,
      wabaId,
      phoneNumberId,
      accessToken,
      phoneNumber: phoneNumber || "",
      displayName: displayName || "",
      verifiedName,
      status: "active",
      qualityRating: "unknown",
      messagingLimitTier: 1,
      connectedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      account: {
        _id: account._id,
        phoneNumberId: account.phoneNumberId,
        phoneNumber: account.phoneNumber,
        verifiedName: account.verifiedName,
        status: account.status,
      },
    });
  } catch (error: any) {
    console.error("[WA Accounts] Error:", error?.message);
    return NextResponse.json({ error: "Error al conectar cuenta" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await getAuth(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const url = new URL(req.url);
    const accountId = url.searchParams.get("accountId");
    const storeId = url.searchParams.get("storeId");

    if (!accountId || !storeId) return NextResponse.json({ error: "accountId y storeId requeridos" }, { status: 400 });

    const ownership = await verifyStoreOwnership(storeId, auth);
    if (!ownership.ok) return NextResponse.json({ error: ownership.error }, { status: 403 });

    await connectDB();

    const account = await WhatsAppAccount.findOne({ _id: accountId, storeId });
    if (!account) return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });

    await WhatsAppAccount.findByIdAndUpdate(accountId, {
      status: "disconnected",
      disconnectedAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Error al desconectar" }, { status: 500 });
  }
}
