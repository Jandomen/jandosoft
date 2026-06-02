import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Integration } from "@/lib/models/Integration";
import { Store } from "@/lib/models/Store";
import { getAuthFromCookies, getAuthFromHeaders } from "@/lib/auth";

async function getAuth(req: NextRequest) {
  return getAuthFromHeaders(req) || await getAuthFromCookies();
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ storeId: string }> }) {
  try {
    const auth = await getAuth(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { storeId } = await params;
    await connectDB();

    const store = await Store.findOne({ _id: storeId, organizationId: auth.organizationId }).lean();
    if (!store) return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });

    const integrations = await Integration.find({ storeId }).lean();
    return NextResponse.json({ integrations });
  } catch (error) {
    console.error("GET integrations error:", error);
    return NextResponse.json({ error: "Error al cargar integraciones" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ storeId: string }> }) {
  try {
    const auth = await getAuth(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { storeId } = await params;
    const body = await req.json();

    await connectDB();
    const store = await Store.findOne({ _id: storeId, organizationId: auth.organizationId }).lean();
    if (!store) return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });

    if (!body.platform || !body.apiKey) {
      return NextResponse.json({ error: "Platform y API key requeridos" }, { status: 400 });
    }

    const existing = await Integration.findOne({ storeId, platform: body.platform });
    if (existing) {
      existing.apiKey = body.apiKey;
      existing.tier = body.tier || existing.tier;
      existing.label = body.label || existing.label;
      existing.status = "pending";
      if (body.config) {
        existing.config = { ...existing.config, ...body.config };
      }
      await existing.save();
      return NextResponse.json({ integration: existing });
    }

    const integration = await Integration.create({
      storeId,
      platform: body.platform,
      label: body.label || "",
      apiKey: body.apiKey,
      tier: body.tier || "developer",
      status: "pending",
      config: {
        rateLimit: body.config?.rateLimit || 60,
        dailyCap: body.config?.dailyCap || 1000,
        monthlyCap: body.config?.monthlyCap || 30000,
      },
    });

    return NextResponse.json({ integration }, { status: 201 });
  } catch (error) {
    console.error("POST integration error:", error);
    return NextResponse.json({ error: "Error al guardar integración" }, { status: 500 });
  }
}
