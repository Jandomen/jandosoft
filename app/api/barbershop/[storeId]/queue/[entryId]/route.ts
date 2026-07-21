import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Store } from "@/lib/models/Store";
import { getAuthFromHeaders, getAuthFromCookies } from "@/lib/auth";

async function getAuth(req: NextRequest) {
  return getAuthFromHeaders(req) || (await getAuthFromCookies());
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ storeId: string; entryId: string }> }
) {
  try {
    const auth = await getAuth(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { storeId, entryId } = await params;
    const body = await req.json();

    await connectDB();

    const store = await Store.findOne({ _id: storeId, organizationId: auth.organizationId });
    if (!store) return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });

    const idx = (store.barberQueue || []).findIndex((e: any) => e.id === entryId || String(e._id) === entryId);
    if (idx === -1) return NextResponse.json({ error: "Entrada no encontrada" }, { status: 404 });

    const updates = { ...body };
    if (updates.status === "in_progress") updates.startedAt = new Date().toISOString();
    if (updates.status === "completed" || updates.status === "cancelled") updates.completedAt = new Date().toISOString();
    store.barberQueue[idx] = { ...store.barberQueue[idx], ...updates };
    await store.save();

    return NextResponse.json({ entry: store.barberQueue[idx] });
  } catch (error) {
    console.error("PUT /api/barbershop/[storeId]/queue/[entryId] error:", error);
    return NextResponse.json({ error: "Error al actualizar cola" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ storeId: string; entryId: string }> }
) {
  try {
    const auth = await getAuth(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { storeId, entryId } = await params;

    await connectDB();

    const store = await Store.findOne({ _id: storeId, organizationId: auth.organizationId });
    if (!store) return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });

    store.barberQueue = (store.barberQueue || []).filter((e: any) => e.id !== entryId && String(e._id) !== entryId);
    await store.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/barbershop/[storeId]/queue/[entryId] error:", error);
    return NextResponse.json({ error: "Error al eliminar entrada de cola" }, { status: 500 });
  }
}
