import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Integration } from "@/lib/models/Integration";
import { Store } from "@/lib/models/Store";
import { getAuthFromCookies, getAuthFromHeaders } from "@/lib/auth";

async function getAuth(req: NextRequest) {
  return getAuthFromHeaders(req) || await getAuthFromCookies();
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ storeId: string; integrationId: string }> }) {
  try {
    const auth = await getAuth(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { storeId, integrationId } = await params;
    await connectDB();

    const store = await Store.findOne({ _id: storeId, organizationId: auth.organizationId }).lean();
    if (!store) return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });

    await Integration.deleteOne({ _id: integrationId, storeId });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE integration error:", error);
    return NextResponse.json({ error: "Error al eliminar integración" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ storeId: string; integrationId: string }> }) {
  try {
    const auth = await getAuth(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { storeId, integrationId } = await params;
    const body = await req.json();
    await connectDB();

    const store = await Store.findOne({ _id: storeId, organizationId: auth.organizationId }).lean();
    if (!store) return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });

    const integration = await Integration.findOne({ _id: integrationId, storeId });
    if (!integration) return NextResponse.json({ error: "Integración no encontrada" }, { status: 404 });

    if (body.apiKey) integration.apiKey = body.apiKey;
    if (body.tier) integration.tier = body.tier;
    if (body.label !== undefined) integration.label = body.label;
    if (body.config) {
      integration.config = { ...integration.config, ...body.config };
    }
    if (body.apiKey) integration.status = "pending";

    await integration.save();
    return NextResponse.json({ integration });
  } catch (error) {
    console.error("PATCH integration error:", error);
    return NextResponse.json({ error: "Error al actualizar integración" }, { status: 500 });
  }
}
