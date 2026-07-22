import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { WhatsAppTemplate } from "@/lib/models/WhatsAppTemplate";
import { WhatsAppAccount } from "@/lib/models/WhatsAppAccount";
import { getAuthFromHeaders } from "@/lib/auth";
import { getPlanLimits } from "@/lib/plans";
import { Store } from "@/lib/models/Store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthFromHeaders(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const url = new URL(req.url);
    const storeId = url.searchParams.get("storeId");
    const accountId = url.searchParams.get("accountId");
    if (!storeId) return NextResponse.json({ error: "storeId requerido" }, { status: 400 });

    await connectDB();
    const query: any = { storeId };
    if (accountId) query.accountId = accountId;

    const templates = await WhatsAppTemplate.find(query)
      .sort({ createdAt: -1 })
      .lean();

    const store = await Store.findById(storeId).lean().select("subscription").catch(() => null);
    const subscription = (store as any)?.subscription || "free";
    const limits = getPlanLimits(subscription);
    const remaining = Math.max(0, limits.maxWhatsAppTemplates - templates.length);

    return NextResponse.json({
      templates,
      limits: {
        maxTemplates: limits.maxWhatsAppTemplates,
        used: templates.length,
        remaining,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Error al obtener plantillas" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthFromHeaders(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await req.json();
    const { storeId, accountId } = body;

    if (!storeId || !accountId) {
      return NextResponse.json({ error: "storeId y accountId son requeridos" }, { status: 400 });
    }

    await connectDB();

    const account = await WhatsAppAccount.findOne({ _id: accountId, storeId, status: "active" });
    if (!account) return NextResponse.json({ error: "Cuenta no encontrada o inactiva" }, { status: 404 });

    const templatesRes = await fetch(
      `https://graph.facebook.com/v22.0/${account.wabaId}/message_templates?fields=name,status,category,language,components&access_token=${account.accessToken}`
    );
    const templatesData = await templatesRes.json();

    if (!templatesRes.ok) {
      return NextResponse.json({ error: templatesData.error?.message || "Error al sincronizar" }, { status: 500 });
    }

    const metaTemplates = templatesData.data || [];
    let created = 0;
    let updated = 0;

    for (const t of metaTemplates) {
      const result = await WhatsAppTemplate.findOneAndUpdate(
        { storeId, accountId, name: t.name, language: t.language?.code || "es" },
        {
          storeId,
          accountId,
          templateId: t.id || "",
          name: t.name,
          category: t.category || "marketing",
          status: t.status?.toLowerCase() || "pending",
          language: t.language?.code || "es",
          components: t.components || [],
          rejectedReason: t.status === "REJECTED" ? (t.rejected_reason || "") : "",
          lastSyncedAt: new Date(),
        },
        { upsert: true, new: true }
      );

      if (result.createdAt.getTime() === result.updatedAt.getTime()) {
        created++;
      } else {
        updated++;
      }
    }

    return NextResponse.json({
      success: true,
      synced: metaTemplates.length,
      created,
      updated,
      templates: metaTemplates.map((t: any) => ({
        name: t.name,
        status: t.status,
        category: t.category,
        language: t.language?.code,
      })),
    });
  } catch (error: any) {
    console.error("[WA Templates Sync] Error:", error?.message);
    return NextResponse.json({ error: "Error al sincronizar plantillas" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = getAuthFromHeaders(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const url = new URL(req.url);
    const templateId = url.searchParams.get("templateId");
    const storeId = url.searchParams.get("storeId");

    if (!templateId || !storeId) return NextResponse.json({ error: "templateId y storeId requeridos" }, { status: 400 });

    await connectDB();
    await WhatsAppTemplate.findOneAndDelete({ _id: templateId, storeId });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Error al eliminar plantilla" }, { status: 500 });
  }
}
