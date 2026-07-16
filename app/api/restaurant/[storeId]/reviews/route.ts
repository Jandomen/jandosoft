import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Store } from "@/lib/models/Store";
import { Restaurant } from "@/lib/models/Restaurant";
import { getAuthFromHeaders, getAuthFromCookies } from "@/lib/auth";

async function getAuth(req: NextRequest) {
  return getAuthFromHeaders(req) || (await getAuthFromCookies());
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const auth = await getAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { storeId } = await params;

    await connectDB();

    const store = await Store.findOne({
      _id: storeId,
      organizationId: auth.organizationId,
    }).lean();
    if (!store) {
      return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });
    }

    const restaurant = await Restaurant.findOne({ storeId }).lean() as any;
    if (!restaurant) {
      return NextResponse.json({ reviews: [], averageRating: 0, totalReviews: 0 });
    }

    const reviews = (restaurant.reviews || []).sort(
      (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? Math.round(
            (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / totalReviews) * 10
          ) / 10
        : 0;

    return NextResponse.json({ reviews, averageRating, totalReviews });
  } catch (error) {
    console.error("GET /api/restaurant/[storeId]/reviews error:", error);
    return NextResponse.json({ error: "Error al obtener reseñas" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await params;
    const body = await req.json();

    if (!body.customerName || !body.rating) {
      return NextResponse.json(
        { error: "customerName y rating son requeridos" },
        { status: 400 }
      );
    }

    await connectDB();

    const restaurant = await Restaurant.findOne({ storeId }) as any;
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurante no encontrado" }, { status: 404 });
    }

    const reviewId = Date.now();
    const review: any = {
      id: reviewId,
      customerName: body.customerName,
      customerEmail: body.customerEmail || "",
      rating: Math.min(5, Math.max(1, Math.round(body.rating))),
      comment: body.comment || "",
      orderId: body.orderId || undefined,
    };

    restaurant.reviews.push(review);
    await restaurant.save();

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    console.error("POST /api/restaurant/[storeId]/reviews error:", error);
    return NextResponse.json({ error: "Error al crear reseña" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const auth = await getAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { storeId } = await params;
    const body = await req.json();

    if (!body.reviewId || !body.reply) {
      return NextResponse.json(
        { error: "reviewId y reply son requeridos" },
        { status: 400 }
      );
    }

    await connectDB();

    const store = await Store.findOne({
      _id: storeId,
      organizationId: auth.organizationId,
    }).lean();
    if (!store) {
      return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });
    }

    const restaurant = await Restaurant.findOne({ storeId }) as any;
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurante no encontrado" }, { status: 404 });
    }

    const review = restaurant.reviews.find((r: any) => r.id === body.reviewId);
    if (!review) {
      return NextResponse.json({ error: "Reseña no encontrada" }, { status: 404 });
    }

    review.reply = body.reply;
    await restaurant.save();

    return NextResponse.json({ review });
  } catch (error) {
    console.error("PUT /api/restaurant/[storeId]/reviews error:", error);
    return NextResponse.json({ error: "Error al responder reseña" }, { status: 500 });
  }
}
