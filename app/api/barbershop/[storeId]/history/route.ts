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
    const { searchParams } = new URL(req.url);
    const barberId = searchParams.get("barberId");
    await connectDB();
    const store = await Store.findOne({ _id: storeId, organizationId: auth.organizationId }).lean() as any;
    if (!store) return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });
    let history = store.barberServiceHistory || [];
    if (barberId) history = history.filter((h: any) => h.barberId === Number(barberId));
    history.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return NextResponse.json({ history });
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
    const entry = {
      id: `sh_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      barberId: body.barberId,
      barberName: body.barberName || "",
      customerName: body.customerName || "",
      customerPhone: body.customerPhone || "",
      service: body.service || "",
      price: body.price || 0,
      duration: body.duration || 0,
      notes: body.notes || "",
      rating: body.rating || null,
      date: new Date().toISOString(),
    };
    store.barberServiceHistory = [...(store.barberServiceHistory || []), entry];
    await store.save();
    return NextResponse.json({ entry });
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
    store.barberServiceHistory = (store.barberServiceHistory || []).filter((h: any) => h.id !== entryId);
    await store.save();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
