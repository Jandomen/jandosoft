import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Store } from "@/lib/models/Store";
import { Restaurant } from "@/lib/models/Restaurant";
import { getAuthFromHeaders, getAuthFromCookies } from "@/lib/auth";

async function getAuth(req: NextRequest) {
  return getAuthFromHeaders(req) || (await getAuthFromCookies());
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ storeId: string; callId: string }> }
) {
  try {
    const auth = await getAuth(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { storeId, callId } = await params;
    const body = await req.json();

    await connectDB();

    const store = await Store.findOne({ _id: storeId, organizationId: auth.organizationId }).lean();
    if (!store) return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });

    const restaurant = await Restaurant.findOne({ storeId }) as any;
    if (!restaurant) return NextResponse.json({ error: "Restaurante no encontrado" }, { status: 404 });

    const call = restaurant.waiterCalls.find((w: any) => String(w.id) === callId || String(w._id) === callId);
    if (!call) return NextResponse.json({ error: "Llamada no encontrada" }, { status: 404 });

    if (body.status) call.status = body.status;
    if (body.status === "acknowledged") call.acknowledgedAt = new Date();
    if (body.status === "resolved") call.resolvedAt = new Date();

    await restaurant.save();

    return NextResponse.json({ call });
  } catch (error) {
    console.error("PUT /api/restaurant/[storeId]/waiter-calls/[callId] error:", error);
    return NextResponse.json({ error: "Error al actualizar llamada de mesero" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ storeId: string; callId: string }> }
) {
  try {
    const auth = await getAuth(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { storeId, callId } = await params;

    await connectDB();

    const store = await Store.findOne({ _id: storeId, organizationId: auth.organizationId }).lean();
    if (!store) return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });

    const restaurant = await Restaurant.findOne({ storeId }) as any;
    if (!restaurant) return NextResponse.json({ error: "Restaurante no encontrado" }, { status: 404 });

    const idx = restaurant.waiterCalls.findIndex((w: any) => String(w.id) === callId || String(w._id) === callId);
    if (idx === -1) return NextResponse.json({ error: "Llamada no encontrada" }, { status: 404 });

    restaurant.waiterCalls.splice(idx, 1);
    await restaurant.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/restaurant/[storeId]/waiter-calls/[callId] error:", error);
    return NextResponse.json({ error: "Error al eliminar llamada de mesero" }, { status: 500 });
  }
}
