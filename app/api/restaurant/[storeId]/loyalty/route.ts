import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Store } from "@/lib/models/Store";
import { Restaurant } from "@/lib/models/Restaurant";
import { getAuthFromHeaders, getAuthFromCookies } from "@/lib/auth";

async function getAuth(req: NextRequest) {
  return getAuthFromHeaders(req) || (await getAuthFromCookies());
}

function getTier(points: number): "bronze" | "silver" | "gold" | "platinum" {
  if (points >= 5000) return "platinum";
  if (points >= 2000) return "gold";
  if (points >= 500) return "silver";
  return "bronze";
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
      return NextResponse.json({
        customers: [],
        stats: { totalCustomers: 0, totalPoints: 0, totalSpent: 0 },
      });
    }

    const customers = (restaurant.loyaltyCustomers || []).sort(
      (a: any, b: any) => b.totalPoints - a.totalPoints
    );

    const totalPoints = customers.reduce(
      (sum: number, c: any) => sum + c.totalPoints,
      0
    );
    const totalSpent = customers.reduce(
      (sum: number, c: any) => sum + c.totalSpent,
      0
    );
    const tierBreakdown = {
      platinum: customers.filter((c: any) => c.tier === "platinum").length,
      gold: customers.filter((c: any) => c.tier === "gold").length,
      silver: customers.filter((c: any) => c.tier === "silver").length,
      bronze: customers.filter((c: any) => c.tier === "bronze").length,
    };

    return NextResponse.json({
      customers,
      stats: {
        totalCustomers: customers.length,
        totalPoints,
        totalSpent,
        tierBreakdown,
      },
    });
  } catch (error) {
    console.error("GET /api/restaurant/[storeId]/loyalty error:", error);
    return NextResponse.json({ error: "Error al obtener datos de lealtad" }, { status: 500 });
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

    if (!body.customerId || !body.points || !body.type) {
      return NextResponse.json(
        { error: "customerId, points y type son requeridos" },
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

    let restaurant = await Restaurant.findOne({ storeId }) as any;
    if (!restaurant) {
      restaurant = await Restaurant.create({ storeId });
    }

    const transactionId = Date.now();
    const transaction: any = {
      id: transactionId,
      customerId: body.customerId,
      customerName: body.customerName || "",
      customerEmail: body.customerEmail || "",
      points: body.type === "redeemed" ? -Math.abs(body.points) : Math.abs(body.points),
      type: body.type,
      description: body.description || "",
      orderId: body.orderId || undefined,
    };

    restaurant.pointsTransactions.push(transaction);

    let loyaltyCustomer = restaurant.loyaltyCustomers.find(
      (c: any) => c.customerId === body.customerId
    );

    if (!loyaltyCustomer) {
      loyaltyCustomer = {
        customerId: body.customerId,
        customerName: body.customerName || "",
        customerEmail: body.customerEmail || "",
        totalPoints: 0,
        totalVisits: 0,
        totalSpent: 0,
        lastVisit: new Date(),
        tier: "bronze",
      };
      restaurant.loyaltyCustomers.push(loyaltyCustomer);
    }

    loyaltyCustomer.totalPoints += transaction.points;
    if (body.type === "earned") {
      loyaltyCustomer.totalVisits += 1;
      loyaltyCustomer.totalSpent += body.amount || 0;
    }
    loyaltyCustomer.lastVisit = new Date();
    loyaltyCustomer.tier = getTier(loyaltyCustomer.totalPoints);

    await restaurant.save();

    return NextResponse.json({ transaction, loyaltyCustomer }, { status: 201 });
  } catch (error) {
    console.error("POST /api/restaurant/[storeId]/loyalty error:", error);
    return NextResponse.json({ error: "Error al registrar transacción de puntos" }, { status: 500 });
  }
}
