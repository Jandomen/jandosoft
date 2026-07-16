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
  { params }: { params: Promise<{ storeId: string; reservationId: string }> }
) {
  try {
    const auth = await getAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { storeId, reservationId } = await params;
    const body = await req.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: "status es requerido" }, { status: 400 });
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

    const reservation = restaurant.reservations.find(
      (r: any) => r.id === Number(reservationId)
    );
    if (!reservation) {
      return NextResponse.json({ error: "Reservación no encontrada" }, { status: 404 });
    }

    reservation.status = status;

    if (status === "seated" && reservation.tableNumber) {
      const table = restaurant.floorPlan?.tables?.find(
        (t: any) => t.number === reservation.tableNumber
      );
      if (table) {
        table.status = "occupied";
      }
    }

    if (
      (status === "completed" || status === "cancelled" || status === "no_show") &&
      reservation.tableNumber
    ) {
      const table = restaurant.floorPlan?.tables?.find(
        (t: any) => t.number === reservation.tableNumber
      );
      if (table) {
        table.status = "free";
      }
    }

    await restaurant.save();

    return NextResponse.json({ reservation });
  } catch (error) {
    console.error("PUT /api/restaurant/[storeId]/reservations/[reservationId] error:", error);
    return NextResponse.json({ error: "Error al actualizar reservación" }, { status: 500 });
  }
}
