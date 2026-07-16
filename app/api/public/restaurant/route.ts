import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Store } from "@/lib/models/Store";
import { Restaurant } from "@/lib/models/Restaurant";
import { User } from "@/lib/models/User";
import { notifyOwner } from "@/lib/notify";

async function getOrCreateRestaurant(storeId: string) {
  let restaurant = await Restaurant.findOne({ storeId }) as any;
  if (!restaurant) {
    restaurant = await Restaurant.create({ storeId });
  }
  return restaurant;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const action = searchParams.get("action") || "menu";

    if (!slug) {
      return NextResponse.json({ error: "slug es requerido" }, { status: 400 });
    }

    await connectDB();

    const store = await Store.findOne({ slug }).lean() as any;
    if (!store) {
      return NextResponse.json({ error: "Restaurante no encontrado" }, { status: 404 });
    }

    const storeId = String(store._id);
    const restaurant = await getOrCreateRestaurant(storeId);

    if (action === "menu") {
      const menuItems = store.menuItems || [];
      const categories = [...new Set(menuItems.map((item: any) => item.category))];
      return NextResponse.json({ menuItems, categories });
    }

    if (action === "table") {
      const tableNumber = parseInt(searchParams.get("table") || "0");
      if (!tableNumber) {
        return NextResponse.json({ error: "table es requerido" }, { status: 400 });
      }
      const table = restaurant.floorPlan?.tables?.find(
        (t: any) => t.number === tableNumber
      );
      if (!table) {
        return NextResponse.json({ error: "Mesa no encontrada" }, { status: 404 });
      }
      return NextResponse.json({ table });
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch (error) {
    console.error("GET /api/public/restaurant error:", error);
    return NextResponse.json({ error: "Error al obtener datos" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, slug } = body;

    if (!slug) {
      return NextResponse.json({ error: "slug es requerido" }, { status: 400 });
    }

    await connectDB();

    const store = await Store.findOne({ slug }).lean() as any;
    if (!store) {
      return NextResponse.json({ error: "Restaurante no encontrado" }, { status: 404 });
    }

    const storeId = String(store._id);
    const restaurant = await getOrCreateRestaurant(storeId);
    const settings = restaurant.settings;

    if (action === "create_order") {
      const items = body.items || [];
      if (items.length === 0) {
        return NextResponse.json({ error: "items es requerido" }, { status: 400 });
      }

      const orderId = Date.now();
      const subtotal = items.reduce(
        (sum: number, item: any) => sum + item.price * (item.quantity || 1),
        0
      );
      const tax = subtotal * (settings.taxRate || 0.16);
      const tip = body.tip || subtotal * (settings.defaultTipPercent || 0.15);
      const total = subtotal + tax + tip;

      const order: any = {
        id: orderId,
        tableNumber: body.tableNumber || undefined,
        orderType: body.orderType || "dine_in",
        items,
        subtotal: Math.round(subtotal * 100) / 100,
        tax: Math.round(tax * 100) / 100,
        tip: Math.round(tip * 100) / 100,
        discount: 0,
        total: Math.round(total * 100) / 100,
        status: "received",
        customerName: body.customerName || "",
        customerPhone: body.customerPhone || "",
        customerEmail: body.customerEmail || "",
        paymentStatus: "unpaid",
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

      const ownerUser = await User.findOne({ email: store.ownerEmail }).lean() as any;
      if (ownerUser) {
        await notifyOwner(
          String(ownerUser._id),
          storeId,
          "order",
          "Nueva orden (pública)",
          `Orden #${orderId} - ${items.length} items - $${total.toFixed(2)}`
        );
      }

      return NextResponse.json({ order }, { status: 201 });
    }

    if (action === "create_reservation") {
      if (!body.customerName || !body.date || !body.time || !body.partySize) {
        return NextResponse.json(
          { error: "customerName, date, time y partySize son requeridos" },
          { status: 400 }
        );
      }

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
            message: `Horario no disponible. Ya existe una reservación a las ${conflicting.time}.`,
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
          "Nueva reservación (pública)",
          `${body.customerName} - ${body.date} ${body.time} - ${body.partySize} personas`
        );
      }

      return NextResponse.json({ reservation }, { status: 201 });
    }

    if (action === "create_review") {
      if (!body.customerName || !body.rating) {
        return NextResponse.json(
          { error: "customerName y rating son requeridos" },
          { status: 400 }
        );
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
    }

    if (action === "call_waiter") {
      const callId = Date.now();
      let tableNumber = body.tableNumber || 0;

      if (!tableNumber && body.tableId) {
        const table = restaurant.floorPlan?.tables?.find(
          (t: any) => t.id === body.tableId
        );
        if (table) tableNumber = table.number;
      }

      const call: any = {
        id: callId,
        tableNumber,
        message: body.message || "",
        status: "pending",
      };

      restaurant.waiterCalls.push(call);
      await restaurant.save();

      const ownerUser = await User.findOne({ email: store.ownerEmail }).lean() as any;
      if (ownerUser) {
        await notifyOwner(
          String(ownerUser._id),
          storeId,
          "info",
          "Llamada de mesero (pública)",
          `Mesa ${tableNumber}: ${call.message || "Solicitud de atención"}`
        );
      }

      return NextResponse.json({ call }, { status: 201 });
    }

    if (action === "validate_coupon") {
      if (!body.code) {
        return NextResponse.json({ error: "code es requerido" }, { status: 400 });
      }

      const code = body.code.toUpperCase();
      const promotion = restaurant.promotions.find(
        (p: any) => p.code === code && p.active
      );

      if (!promotion) {
        return NextResponse.json(
          { valid: false, error: "Cupón no válido o inactivo" },
          { status: 404 }
        );
      }

      const now = new Date().toISOString().split("T")[0];
      if (promotion.validFrom > now || promotion.validUntil < now) {
        return NextResponse.json(
          { valid: false, error: "Cupón fuera de fecha de vigencia" },
          { status: 400 }
        );
      }

      if (promotion.maxUses > 0 && promotion.usedCount >= promotion.maxUses) {
        return NextResponse.json(
          { valid: false, error: "Cupón agotado" },
          { status: 400 }
        );
      }

      if (body.orderTotal && body.orderTotal < promotion.minOrder) {
        return NextResponse.json(
          {
            valid: false,
            error: `El pedido mínimo para este cupón es $${promotion.minOrder}`,
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        valid: true,
        promotion: {
          code: promotion.code,
          type: promotion.type,
          value: promotion.value,
          description: promotion.description,
          minOrder: promotion.minOrder,
        },
      });
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch (error) {
    console.error("POST /api/public/restaurant error:", error);
    return NextResponse.json({ error: "Error al procesar solicitud" }, { status: 500 });
  }
}
