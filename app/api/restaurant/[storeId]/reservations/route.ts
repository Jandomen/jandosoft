import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Store } from "@/lib/models/Store";
import { Restaurant } from "@/lib/models/Restaurant";
import { User } from "@/lib/models/User";
import { getAuthFromHeaders, getAuthFromCookies } from "@/lib/auth";
import { notifyOwner } from "@/lib/notify";

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
    const date = searchParams.get("date");
    const status = searchParams.get("status");

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
      return NextResponse.json({ reservations: [] });
    }

    let reservations = restaurant.reservations || [];
    if (date) {
      reservations = reservations.filter((r: any) => r.date === date);
    }
    if (status) {
      reservations = reservations.filter((r: any) => r.status === status);
    }

    reservations.sort(
      (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({ reservations });
  } catch (error) {
    console.error("GET /api/restaurant/[storeId]/reservations error:", error);
    return NextResponse.json({ error: "Error al obtener reservaciones" }, { status: 500 });
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

    if (!body.customerName || !body.date || !body.time || !body.partySize) {
      return NextResponse.json(
        { error: "customerName, date, time y partySize son requeridos" },
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

    const settings = restaurant.settings;
    if (body.partySize > (settings.maxPartySize || 20)) {
      return NextResponse.json(
        { error: `El tamaño máximo de grupo es ${settings.maxPartySize || 20}` },
        { status: 400 }
      );
    }

    const reservationDate = new Date(body.date);
    const duration = settings.reservationDuration || 90;
    const [startH, startM] = body.time.split(":").map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = startMinutes + duration;

    const conflicting = restaurant.reservations.find((r: any) => {
      if (r.date !== body.date) return false;
      if (r.status === "cancelled" || r.status === "no_show") return false;
      if (!r.time) return false;
      const [rH, rM] = r.time.split(":").map(Number);
      const rStart = rH * 60 + rM;
      const rEnd = rStart + duration;
      return startMinutes < rEnd && endMinutes > rStart;
    });

    if (conflicting) {
      return NextResponse.json(
        {
          error: "conflict",
          message: `Ya existe una reservación en ese horario (reservación de ${conflicting.customerName} a las ${conflicting.time}).`,
        },
        { status: 409 }
      );
    }

    const reservationId = Date.now();
    const reservation: any = {
      id: reservationId,
      customerName: body.customerName,
      customerEmail: body.customerEmail || "",
      customerPhone: body.customerPhone || "",
      date: body.date,
      time: body.time,
      partySize: body.partySize,
      tableNumber: body.tableNumber || undefined,
      status: settings.autoAcceptReservations ? "confirmed" : "pending",
      notes: body.notes || "",
    };

    restaurant.reservations.push(reservation);
    await restaurant.save();

    const ownerUser = await User.findOne({ email: store.ownerEmail }).lean() as any;
    if (ownerUser) {
      await notifyOwner(
        String(ownerUser._id),
        storeId,
        "appointment",
        "Nueva reservación",
        `${body.customerName} - ${body.date} ${body.time} - ${body.partySize} personas`
      );
    }

    return NextResponse.json({ reservation }, { status: 201 });
  } catch (error) {
    console.error("POST /api/restaurant/[storeId]/reservations error:", error);
    return NextResponse.json({ error: "Error al crear reservación" }, { status: 500 });
  }
}
