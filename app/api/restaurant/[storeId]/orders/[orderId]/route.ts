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

const STATUS_FLOW: Record<string, string> = {
  received: "preparing",
  preparing: "ready",
  ready: "delivered",
};

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ storeId: string; orderId: string }> }
) {
  try {
    const auth = await getAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { storeId, orderId } = await params;
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

    const order = restaurant.orders.find((o: any) => o.id === Number(orderId));
    if (!order) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    order.status = status;

    if (status === "delivered" && order.tableNumber) {
      const table = restaurant.floorPlan?.tables?.find(
        (t: any) => t.number === order.tableNumber
      );
      if (table) {
        table.status = "cleaning";
      }
    }

    await restaurant.save();

    emitOrderEvent(storeId, "order-updated", {
      orderId: order.id,
      status,
      storeId,
    });

    const ownerUser = await User.findOne({ email: store.ownerEmail }).lean() as any;
    if (ownerUser) {
      const statusLabels: Record<string, string> = {
        preparing: "En preparación",
        ready: "Lista para servir",
        delivered: "Entregada",
        cancelled: "Cancelada",
      };
      await notifyOwner(
        String(ownerUser._id),
        storeId,
        "order",
        `Orden #${orderId} actualizada`,
        `Estado: ${statusLabels[status] || status}`
      );
    }

    return NextResponse.json({ order: order.toObject ? order.toObject() : order });
  } catch (error) {
    console.error("PUT /api/restaurant/[storeId]/orders/[orderId] error:", error);
    return NextResponse.json({ error: "Error al actualizar orden" }, { status: 500 });
  }
}
