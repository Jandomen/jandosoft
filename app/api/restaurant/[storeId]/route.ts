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

    let restaurant = await Restaurant.findOne({ storeId }).lean() as any;
    if (!restaurant) {
      restaurant = await Restaurant.create({ storeId });
      restaurant = restaurant.toObject();
    }

    const today = new Date().toISOString().split("T")[0];
    const todayOrders = restaurant.orders.filter(
      (o: any) => new Date(o.createdAt).toISOString().split("T")[0] === today
    );
    const revenue = todayOrders
      .filter((o: any) => o.paymentStatus === "paid")
      .reduce((sum: number, o: any) => sum + (o.total || 0), 0);
    const pendingCount = restaurant.orders.filter(
      (o: any) => o.status === "received" || o.status === "preparing"
    ).length;
    const pendingReservations = restaurant.reservations.filter(
      (r: any) => r.status === "pending"
    ).length;
    const activeWaiterCalls = restaurant.waiterCalls.filter(
      (w: any) => w.status === "pending" || w.status === "acknowledged"
    ).length;

    return NextResponse.json({
      restaurant: {
        floorPlan: restaurant.floorPlan,
        settings: restaurant.settings,
        tables: restaurant.floorPlan?.tables || [],
      },
      stats: {
        totalOrdersToday: todayOrders.length,
        revenueToday: revenue,
        pendingOrders: pendingCount,
        pendingReservations,
        activeWaiterCalls,
        totalCustomers: restaurant.loyaltyCustomers.length,
        averageRating:
          restaurant.reviews.length > 0
            ? restaurant.reviews.reduce((s: number, r: any) => s + r.rating, 0) /
              restaurant.reviews.length
            : 0,
      },
    });
  } catch (error) {
    console.error("GET /api/restaurant/[storeId] error:", error);
    return NextResponse.json({ error: "Error al obtener restaurante" }, { status: 500 });
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

    await connectDB();

    const store = await Store.findOne({
      _id: storeId,
      organizationId: auth.organizationId,
    }).lean();
    if (!store) {
      return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });
    }

    let restaurant = await Restaurant.findOne({ storeId });
    if (!restaurant) {
      restaurant = await Restaurant.create({ storeId });
    }

    if (body.floorPlan) {
      restaurant.floorPlan = body.floorPlan;
    }
    if (body.settings) {
      restaurant.settings = { ...restaurant.settings, ...body.settings };
    }
    await restaurant.save();

    return NextResponse.json({ restaurant: restaurant.toObject() });
  } catch (error) {
    console.error("PUT /api/restaurant/[storeId] error:", error);
    return NextResponse.json({ error: "Error al actualizar restaurante" }, { status: 500 });
  }
}
