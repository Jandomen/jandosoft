import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Store } from "@/lib/models/Store";
import { getAuthFromHeaders, getAuthFromCookies } from "@/lib/auth";

async function getAuth(req: NextRequest) {
  return getAuthFromHeaders(req) || (await getAuthFromCookies());
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ storeId: string; barberId: string }> }
) {
  try {
    const auth = await getAuth(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { storeId, barberId } = await params;
    const body = await req.json();

    await connectDB();

    const store = await Store.findOne({ _id: storeId, organizationId: auth.organizationId });
    if (!store) return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });

    const idx = (store.barbers || []).findIndex((b: any) => String(b.id) === barberId || String(b._id) === barberId);
    if (idx === -1) return NextResponse.json({ error: "Barbero no encontrado" }, { status: 404 });

    store.barbers[idx] = { ...store.barbers[idx], ...body };
    await store.save();

    return NextResponse.json({ barber: store.barbers[idx] });
  } catch (error) {
    console.error("PUT /api/barbershop/[storeId]/barbers/[barberId] error:", error);
    return NextResponse.json({ error: "Error al actualizar barbero" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ storeId: string; barberId: string }> }
) {
  try {
    const auth = await getAuth(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { storeId, barberId } = await params;

    await connectDB();

    const store = await Store.findOne({ _id: storeId, organizationId: auth.organizationId });
    if (!store) return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });

    store.barbers = (store.barbers || []).filter((b: any) => String(b.id) !== barberId && String(b._id) !== barberId);
    await store.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/barbershop/[storeId]/barbers/[barberId] error:", error);
    return NextResponse.json({ error: "Error al eliminar barbero" }, { status: 500 });
  }
}
