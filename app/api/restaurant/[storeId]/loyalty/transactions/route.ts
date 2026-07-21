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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const auth = await getAuth(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { storeId } = await params;
    const body = await req.json();

    if (!body.memberId || !body.points || !body.type) {
      return NextResponse.json({ error: "memberId, points y type son requeridos" }, { status: 400 });
    }

    await connectDB();

    const store = await Store.findOne({ _id: storeId, organizationId: auth.organizationId }).lean();
    if (!store) return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });

    let restaurant = await Restaurant.findOne({ storeId }) as any;
    if (!restaurant) {
      restaurant = await Restaurant.create({ storeId });
    }

    const transactionId = Date.now();
    const pointsValue = body.type === "redeemed" ? -Math.abs(body.points) : Math.abs(body.points);
    const transaction: any = {
      id: transactionId,
      memberId: body.memberId,
      points: pointsValue,
      type: body.type,
      description: body.description || "",
      createdAt: new Date(),
    };

    restaurant.pointsTransactions = [...(restaurant.pointsTransactions || []), transaction];

    let loyaltyCustomer = (restaurant.loyaltyCustomers || []).find(
      (c: any) => c.customerId === body.memberId || c.memberId === body.memberId
    );

    if (!loyaltyCustomer) {
      loyaltyCustomer = {
        customerId: body.memberId,
        memberId: body.memberId,
        customerName: body.memberName || "",
        totalPoints: 0,
        totalVisits: 0,
        totalSpent: 0,
        lastVisit: new Date(),
        tier: "bronze",
      };
      restaurant.loyaltyCustomers = [...(restaurant.loyaltyCustomers || []), loyaltyCustomer];
    }

    loyaltyCustomer.totalPoints += pointsValue;
    if (body.type === "earned") {
      loyaltyCustomer.totalVisits += 1;
    }
    loyaltyCustomer.lastVisit = new Date();
    loyaltyCustomer.tier = getTier(loyaltyCustomer.totalPoints);

    await restaurant.save();

    return NextResponse.json({ transaction, loyaltyCustomer }, { status: 201 });
  } catch (error) {
    console.error("POST /api/restaurant/[storeId]/loyalty/transactions error:", error);
    return NextResponse.json({ error: "Error al registrar transacción de puntos" }, { status: 500 });
  }
}
