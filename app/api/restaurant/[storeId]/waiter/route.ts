import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Store } from "@/lib/models/Store";
import { Restaurant } from "@/lib/models/Restaurant";
import { User } from "@/lib/models/User";
import { getAuthFromHeaders, getAuthFromCookies } from "@/lib/auth";
import { notifyOwner } from "@/lib/notify";
import { emitWaiterCallEvent } from "@/lib/socket-server";

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
      return NextResponse.json({ calls: [] });
    }

    const activeCalls = (restaurant.waiterCalls || []).filter(
      (w: any) => w.status === "pending" || w.status === "acknowledged"
    );

    activeCalls.sort(
      (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({ calls: activeCalls });
  } catch (error) {
    console.error("GET /api/restaurant/[storeId]/waiter error:", error);
    return NextResponse.json({ error: "Error al obtener llamadas de mesero" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await params;
    const body = await req.json();

    await connectDB();

    const store = await Store.findOne({ slug: body.slug || undefined, _id: storeId }).lean() ||
      await Store.findOne({ _id: storeId }).lean();
    if (!store) {
      return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });
    }

    let restaurant = await Restaurant.findOne({ storeId }) as any;
    if (!restaurant) {
      restaurant = await Restaurant.create({ storeId });
    }

    const callId = Date.now();
    const tableNumber = body.tableNumber || 0;

    let resolvedTable = tableNumber;
    if (!resolvedTable && body.tableId) {
      const table = restaurant.floorPlan?.tables?.find(
        (t: any) => t.id === body.tableId
      );
      if (table) resolvedTable = table.number;
    }

    const call: any = {
      id: callId,
      tableNumber: resolvedTable,
      message: body.message || "",
      status: "pending",
    };

    restaurant.waiterCalls.push(call);
    await restaurant.save();

    emitWaiterCallEvent(storeId, "new-waiter-call", {
      call,
      storeId,
      tableNumber: resolvedTable,
    });

    const ownerId = String((store as any).ownerId || (store as any).userId);
    if (ownerId) {
      await notifyOwner(
        ownerId,
        storeId,
        "info",
        "Llamada de mesero",
        `Mesa ${resolvedTable}: ${call.message || "Solicitud de atención"}`
      );
    }

    return NextResponse.json({ call }, { status: 201 });
  } catch (error) {
    console.error("POST /api/restaurant/[storeId]/waiter error:", error);
    return NextResponse.json({ error: "Error al crear llamada de mesero" }, { status: 500 });
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

    if (!body.callId || !body.status) {
      return NextResponse.json({ error: "callId y status son requeridos" }, { status: 400 });
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

    const call = restaurant.waiterCalls.find((w: any) => w.id === body.callId);
    if (!call) {
      return NextResponse.json({ error: "Llamada no encontrada" }, { status: 404 });
    }

    call.status = body.status;
    if (body.status === "acknowledged") {
      call.acknowledgedAt = new Date();
    }
    if (body.status === "resolved") {
      call.resolvedAt = new Date();
    }

    await restaurant.save();

    emitWaiterCallEvent(storeId, "waiter-call-updated", {
      callId: call.id,
      status: body.status,
      storeId,
    });

    return NextResponse.json({ call });
  } catch (error) {
    console.error("PUT /api/restaurant/[storeId]/waiter error:", error);
    return NextResponse.json({ error: "Error al actualizar llamada de mesero" }, { status: 500 });
  }
}
