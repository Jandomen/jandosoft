import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Integration } from "@/lib/models/Integration";
import { Store } from "@/lib/models/Store";
import { getAuthFromCookies, getAuthFromHeaders } from "@/lib/auth";

async function getAuth(req: NextRequest) {
  return getAuthFromHeaders(req) || await getAuthFromCookies();
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ storeId: string; integrationId: string }> }) {
  try {
    const auth = await getAuth(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { storeId, integrationId } = await params;
    await connectDB();

    const store = await Store.findOne({ _id: storeId, organizationId: auth.organizationId }).lean();
    if (!store) return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });

    const integration = await Integration.findOne({ _id: integrationId, storeId });
    if (!integration) return NextResponse.json({ error: "Integración no encontrada" }, { status: 404 });

    let valid = false;
    let detail = "";

    try {
      switch (integration.platform) {
        case "openai": {
          const res = await fetch("https://api.openai.com/v1/models", {
            headers: { Authorization: `Bearer ${integration.apiKey}` },
          });
          valid = res.ok;
          detail = valid ? "API key válida" : `Error ${res.status}: ${(await res.json().catch(() => ({}))).error?.message || "inválda"}`;
          break;
        }
        case "coingecko": {
          const res = await fetch("https://api.coingecko.com/api/v3/ping");
          valid = res.ok;
          detail = "CoinGecko no requiere API key (plan gratis)";
          break;
        }
        case "etherscan": {
          const res = await fetch(`https://api.etherscan.io/api?module=stats&action=ethprice&apikey=${integration.apiKey}`);
          const data = await res.json();
          valid = data.status === "1";
          detail = valid ? "API key válida" : "API key inválida";
          break;
        }
        default: {
          valid = true;
          detail = "Verificación no disponible para esta plataforma";
        }
      }
    } catch {
      valid = false;
      detail = "Error de conexión al verificar";
    }

    integration.status = valid ? "verified" : "invalid";
    integration.lastVerified = new Date();
    await integration.save();

    return NextResponse.json({ status: integration.status, detail });
  } catch (error) {
    console.error("Verify integration error:", error);
    return NextResponse.json({ error: "Error al verificar integración" }, { status: 500 });
  }
}
