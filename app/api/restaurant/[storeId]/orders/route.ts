import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Store } from "@/lib/models/Store";
import { Restaurant } from "@/lib/models/Restaurant";
import { User } from "@/lib/models/User";
import { getAuthFromHeaders, getAuthFromCookies } from "@/lib/auth";
import { notifyOwner } from "@/lib/notify";
import { emitOrderEvent } from "@/lib/socket-server";

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
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const date = searchParams.get("date");

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
      return NextResponse.json({ orders: [], stats: { totalToday: 0, revenueToday: 0, pendingCount: 0 } });
    }

    let orders = restaurant.orders || [];
    if (status) {
      orders = orders.filter((o: any) => o.status === status);
    }
    if (date) {
      orders = orders.filter(
        (o: any) => new Date(o.createdAt).toISOString().split("T")[0] === date
      );
    }

    orders.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const today = new Date().toISOString().split("T")[0];
    const todayOrders = (restaurant.orders || []).filter(
      (o: any) => new Date(o.createdAt).toISOString().split("T")[0] === today
    );
    const revenueToday = todayOrders
      .filter((o: any) => o.paymentStatus === "paid")
      .reduce((sum: number, o: any) => sum + (o.total || 0), 0);
    const pendingCount = (restaurant.orders || []).filter(
      (o: any) => o.status === "received" || o.status === "preparing"
    ).length;

    return NextResponse.json({
      orders,
      stats: {
        totalToday: todayOrders.length,
        revenueToday,
        pendingCount,
      },
    });
  } catch (error) {
    console.error("GET /api/restaurant/[storeId]/orders error:", error);
    return NextResponse.json({ error: "Error al obtener órdenes" }, { status: 500 });
  }
}

export async function POST(
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

    const settings = restaurant.settings;
    const orderId = Date.now();
    const items = body.items || [];
    const subtotal = items.reduce(
      (sum: number, item: any) => sum + item.price * (item.quantity || 1),
      0
    );
    const tax = subtotal * (settings.taxRate || 0.16);
    const tip = body.tip || subtotal * (settings.defaultTipPercent || 0.15);
    const discount = body.discount || 0;
    const total = subtotal + tax + tip - discount;

    const order: any = {
      id: orderId,
      tableNumber: body.tableNumber || undefined,
      orderType: body.orderType || "dine_in",
      items,
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      tip: Math.round(tip * 100) / 100,
      discount: Math.round(discount * 100) / 100,
      total: Math.round(total * 100) / 100,
      status: "received",
      customerName: body.customerName || "",
      customerPhone: body.customerPhone || "",
      customerEmail: body.customerEmail || "",
      paymentStatus: body.paymentStatus || "unpaid",
      paymentMethod: body.paymentMethod || "",
      couponCode: body.couponCode || "",
      pointsEarned: Math.floor(total * (settings.pointsPerDollar || 1)),
      notes: body.notes || "",
    };

    restaurant.orders.push(order);

    if (body.tableNumber) {
      const table = restaurant.floorPlan?.tables?.find(
        (t: any) => t.number === body.tableNumber
      );
      if (table) {
        table.status = "occupied";
      }
    }

    await restaurant.save();

    emitOrderEvent(storeId, "new-order", {
      order,
      storeId,
    });

    const ownerUser = await User.findOne({ email: store.ownerEmail }).lean() as any;
    if (ownerUser) {
      await notifyOwner(
        String(ownerUser._id),
        storeId,
        "order",
        "Nueva orden",
        `Orden #${orderId} - ${items.length} items - $${total.toFixed(2)}`
      );
    }

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error("POST /api/restaurant/[storeId]/orders error:", error);
    return NextResponse.json({ error: "Error al crear orden" }, { status: 500 });
  }
}
