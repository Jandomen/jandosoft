import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { WhatsAppAccount } from "@/lib/models/WhatsAppAccount";
import { getAuthFromHeaders } from "@/lib/auth";
import { verifyStoreOwnership } from "@/lib/whatsapp-middleware";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface HealthCheck {
  accountId: string;
  phoneNumber: string;
  verifiedName: string;
  status: string;
  qualityRating: string;
  messagesSentToday: number;
  dailyLimit: number;
  tokenValid: boolean;
  tokenError?: string;
  webhookConfigured: boolean;
  overallStatus: "healthy" | "warning" | "error" | "disconnected";
  issues: string[];
}

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthFromHeaders(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const url = new URL(req.url);
    const storeId = url.searchParams.get("storeId");
    if (!storeId) return NextResponse.json({ error: "storeId requerido" }, { status: 400 });

    const ownership = await verifyStoreOwnership(storeId, auth);
    if (!ownership.ok) return NextResponse.json({ error: ownership.error }, { status: 403 });

    await connectDB();

    const accounts = await WhatsAppAccount.find({ storeId }).lean();
    const activeAccounts = accounts.filter(a => a.status === "active");

    if (activeAccounts.length === 0) {
      return NextResponse.json({
        connected: false,
        overallStatus: "disconnected",
        accounts: [],
        issues: ["No hay cuentas de WhatsApp conectadas"],
      });
    }

    const { getPlanLimits } = await import("@/lib/plans");
    const { Store } = await import("@/lib/models/Store");
    const store = await Store.findById(storeId).lean().select("subscription").catch(() => null);
    const subscription = (store as any)?.subscription || "free";
    const limits = getPlanLimits(subscription);

    const healthChecks: HealthCheck[] = [];

    for (const account of activeAccounts) {
      const issues: string[] = [];

      let tokenValid = true;
      let tokenError = "";
      try {
        const testRes = await fetch(
          `https://graph.facebook.com/v22.0/${account.phoneNumberId}?fields=verified_name,display_phone_number&access_token=${account.accessToken}`
        );
        if (!testRes.ok) {
          const errData = await testRes.json().catch(() => ({}));
          tokenValid = false;
          tokenError = errData?.error?.message || `HTTP ${testRes.status}`;
          issues.push(`Token invalido: ${tokenError}`);
        }
      } catch (e: any) {
        tokenValid = false;
        tokenError = e?.message || "Error de red";
        issues.push(`No se pudo verificar token: ${tokenError}`);
      }

      if (account.qualityRating === "red") {
        issues.push("Calidad RED: Meta ha restringido el envio");
      } else if (account.qualityRating === "yellow") {
        issues.push("Calidad AMARILLA: Calificacion en riesgo");
      }

      if (account.messagesSentToday >= limits.maxWhatsAppMessagesPerDay) {
        issues.push(`Limite diario alcanzado: ${account.messagesSentToday}/${limits.maxWhatsAppMessagesPerDay}`);
      }

      if (account.status !== "active") {
        issues.push(`Estado: ${account.status}`);
      }

      let overallStatus: "healthy" | "warning" | "error" | "disconnected" = "healthy";
      if (account.status !== "active" || !tokenValid) {
        overallStatus = "error";
      } else if (account.qualityRating === "red" || account.qualityRating === "yellow" || account.messagesSentToday >= limits.maxWhatsAppMessagesPerDay) {
        overallStatus = "warning";
      }

      healthChecks.push({
        accountId: account._id.toString(),
        phoneNumber: account.phoneNumber,
        verifiedName: account.verifiedName,
        status: account.status,
        qualityRating: account.qualityRating,
        messagesSentToday: account.messagesSentToday,
        dailyLimit: limits.maxWhatsAppMessagesPerDay,
        tokenValid,
        tokenError: tokenError || undefined,
        webhookConfigured: true,
        overallStatus,
        issues,
      });
    }

    const worstStatus = healthChecks.some(h => h.overallStatus === "error") ? "error"
      : healthChecks.some(h => h.overallStatus === "warning") ? "warning"
      : healthChecks.every(h => h.overallStatus === "healthy") ? "healthy" : "disconnected";

    return NextResponse.json({
      connected: true,
      overallStatus: worstStatus,
      accounts: healthChecks,
      limits: {
        maxNumbers: limits.maxWhatsAppNumbers,
        numbersUsed: activeAccounts.length,
      },
      issues: healthChecks.flatMap(h => h.issues),
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Error al verificar estado", connected: false, overallStatus: "error" }, { status: 500 });
  }
}
