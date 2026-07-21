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
  { params }: { params: Promise<{ storeId: string; reviewId: string }> }
) {
  try {
    const auth = await getAuth(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { storeId, reviewId } = await params;
    const body = await req.json();

    await connectDB();

    const store = await Store.findOne({ _id: storeId, organizationId: auth.organizationId }).lean();
    if (!store) return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });

    const restaurant = await Restaurant.findOne({ storeId }) as any;
    if (!restaurant) return NextResponse.json({ error: "Restaurante no encontrado" }, { status: 404 });

    const review = restaurant.reviews.find((r: any) => String(r.id) === reviewId || String(r._id) === reviewId);
    if (!review) return NextResponse.json({ error: "Reseña no encontrada" }, { status: 404 });

    if (body.reply !== undefined) review.reply = body.reply;
    if (body.status !== undefined) review.status = body.status;

    await restaurant.save();

    return NextResponse.json({ review });
  } catch (error) {
    console.error("PUT /api/restaurant/[storeId]/reviews/[reviewId] error:", error);
    return NextResponse.json({ error: "Error al actualizar reseña" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ storeId: string; reviewId: string }> }
) {
  try {
    const auth = await getAuth(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { storeId, reviewId } = await params;

    await connectDB();

    const store = await Store.findOne({ _id: storeId, organizationId: auth.organizationId }).lean();
    if (!store) return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });

    const restaurant = await Restaurant.findOne({ storeId }) as any;
    if (!restaurant) return NextResponse.json({ error: "Restaurante no encontrado" }, { status: 404 });

    const idx = restaurant.reviews.findIndex((r: any) => String(r.id) === reviewId || String(r._id) === reviewId);
    if (idx === -1) return NextResponse.json({ error: "Reseña no encontrada" }, { status: 404 });

    restaurant.reviews.splice(idx, 1);
    await restaurant.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/restaurant/[storeId]/reviews/[reviewId] error:", error);
    return NextResponse.json({ error: "Error al eliminar reseña" }, { status: 500 });
  }
}
