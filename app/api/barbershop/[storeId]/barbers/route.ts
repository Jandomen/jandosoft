import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Store } from "@/lib/models/Store";
import { getAuthFromHeaders, getAuthFromCookies } from "@/lib/auth";

async function getAuth(req: NextRequest) {
  return getAuthFromHeaders(req) || (await getAuthFromCookies());
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ storeId: string }> }) {
  try {
    const auth = await getAuth(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const { storeId } = await params;
    await connectDB();
    const store = await Store.findOne({ _id: storeId, organizationId: auth.organizationId }).lean() as any;
    if (!store) return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });
    return NextResponse.json({ barbers: store.barbers || [] });
  } catch (e) {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ storeId: string }> }) {
  try {
    const auth = await getAuth(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const { storeId } = await params;
    const body = await req.json();
    await connectDB();
    const store = await Store.findOne({ _id: storeId, organizationId: auth.organizationId });
    if (!store) return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });
    const newId = (store.barbers || []).length > 0 ? Math.max(...store.barbers.map((b: any) => b.id || 0)) + 1 : 1;
    const barber = { id: newId, ...body, active: true, joinedAt: new Date().toISOString() };
    store.barbers = [...(store.barbers || []), barber];
    await store.save();
    return NextResponse.json({ barber });
  } catch (e) {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ storeId: string }> }) {
  try {
    const auth = await getAuth(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const { storeId } = await params;
    const body = await req.json();
    const { id, ...updates } = body;
    await connectDB();
    const store = await Store.findOne({ _id: storeId, organizationId: auth.organizationId });
    if (!store) return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });
    const idx = (store.barbers || []).findIndex((b: any) => b.id === id);
    if (idx === -1) return NextResponse.json({ error: "Barbero no encontrado" }, { status: 404 });
    store.barbers[idx] = { ...store.barbers[idx], ...updates };
    await store.save();
    return NextResponse.json({ barber: store.barbers[idx] });
  } catch (e) {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ storeId: string }> }) {
  try {
    const auth = await getAuth(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const { storeId } = await params;
    const { searchParams } = new URL(req.url);
    const barberId = Number(searchParams.get("id"));
    await connectDB();
    const store = await Store.findOne({ _id: storeId, organizationId: auth.organizationId });
    if (!store) return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });
    store.barbers = (store.barbers || []).filter((b: any) => b.id !== barberId);
    await store.save();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
