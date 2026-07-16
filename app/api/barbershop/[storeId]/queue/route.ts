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
    return NextResponse.json({ queue: store.barberQueue || [] });
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
    const waiting = (store.barberQueue || []).filter((e: any) => e.status === "waiting");
    const position = waiting.length + 1;
    const entry = {
      id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      customerName: body.customerName || "",
      customerPhone: body.customerPhone || "",
      serviceRequested: body.serviceRequested || "",
      barberId: body.barberId || null,
      position,
      status: "waiting",
      checkInTime: new Date().toISOString(),
      notes: body.notes || "",
    };
    store.barberQueue = [...(store.barberQueue || []), entry];
    await store.save();
    return NextResponse.json({ entry });
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
    const idx = (store.barberQueue || []).findIndex((e: any) => e.id === id);
    if (idx === -1) return NextResponse.json({ error: "Entrada no encontrada" }, { status: 404 });
    if (updates.status === "in_progress") updates.startedAt = new Date().toISOString();
    if (updates.status === "completed" || updates.status === "cancelled") updates.completedAt = new Date().toISOString();
    store.barberQueue[idx] = { ...store.barberQueue[idx], ...updates };
    await store.save();
    return NextResponse.json({ entry: store.barberQueue[idx] });
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
    const entryId = searchParams.get("id");
    await connectDB();
    const store = await Store.findOne({ _id: storeId, organizationId: auth.organizationId });
    if (!store) return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });
    store.barberQueue = (store.barberQueue || []).filter((e: any) => e.id !== entryId);
    await store.save();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
