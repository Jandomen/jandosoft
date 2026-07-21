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
  { params }: { params: Promise<{ storeId: string; promoId: string }> }
) {
  try {
    const auth = await getAuth(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { storeId, promoId } = await params;
    const body = await req.json();

    await connectDB();

    const store = await Store.findOne({ _id: storeId, organizationId: auth.organizationId }).lean();
    if (!store) return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });

    const restaurant = await Restaurant.findOne({ storeId }) as any;
    if (!restaurant) return NextResponse.json({ error: "Restaurante no encontrado" }, { status: 404 });

    const index = restaurant.promotions.findIndex((p: any) => String(p.id) === promoId || String(p._id) === promoId);
    if (index === -1) return NextResponse.json({ error: "Promoción no encontrada" }, { status: 404 });

    const existing = restaurant.promotions[index].toObject ? restaurant.promotions[index].toObject() : restaurant.promotions[index];
    const updated = { ...existing, ...body };
    if (updated.code) updated.code = updated.code.toUpperCase();
    restaurant.promotions[index] = updated;
    await restaurant.save();

    return NextResponse.json({ promotion: restaurant.promotions[index] });
  } catch (error) {
    console.error("PUT /api/restaurant/[storeId]/promotions/[promoId] error:", error);
    return NextResponse.json({ error: "Error al actualizar promoción" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ storeId: string; promoId: string }> }
) {
  try {
    const auth = await getAuth(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { storeId, promoId } = await params;

    await connectDB();

    const store = await Store.findOne({ _id: storeId, organizationId: auth.organizationId }).lean();
    if (!store) return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });

    const restaurant = await Restaurant.findOne({ storeId }) as any;
    if (!restaurant) return NextResponse.json({ error: "Restaurante no encontrado" }, { status: 404 });

    const index = restaurant.promotions.findIndex((p: any) => String(p.id) === promoId || String(p._id) === promoId);
    if (index === -1) return NextResponse.json({ error: "Promoción no encontrada" }, { status: 404 });

    restaurant.promotions.splice(index, 1);
    await restaurant.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/restaurant/[storeId]/promotions/[promoId] error:", error);
    return NextResponse.json({ error: "Error al eliminar promoción" }, { status: 500 });
  }
}
