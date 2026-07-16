import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Appointment } from "@/lib/models/Appointment";
import { Customer } from "@/lib/models/Customer";
import { getAuthFromHeaders, getAuthFromCookies } from "@/lib/auth";
import { checkAppointmentConflict, getAvailableSlots } from "@/lib/appointment-utils";
import { notifyOwner } from "@/lib/notify";

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

async function getAuth(req: NextRequest) {
  return getAuthFromHeaders(req) || await getAuthFromCookies();
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuth(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId");
    const customerId = searchParams.get("customerId");
    const status = searchParams.get("status");
    const date = searchParams.get("date");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const availableSlots = searchParams.get("availableSlots");
    const slotDuration = parseInt(searchParams.get("slotDuration") || "30");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));

    if (!storeId) return NextResponse.json({ error: "storeId required" }, { status: 400 });

    if (availableSlots && date) {
      const slots = await getAvailableSlots(storeId, date, slotDuration);
      return NextResponse.json({ slots });
    }

    await connectDB();
    const filter: any = { storeId };

    if (customerId) filter.customerId = customerId;
    if (status) filter.status = status;
    if (date) filter.date = date;
    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = dateFrom;
      if (dateTo) filter.date.$lte = dateTo;
    }

    const skip = (page - 1) * limit;
    const [total, appointments] = await Promise.all([
      Appointment.countDocuments(filter),
      Appointment.find(filter)
        .sort({ date: 1, time: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    return NextResponse.json({ appointments, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("GET appointments error:", error);
    return NextResponse.json({ error: "Error loading appointments" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuth(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await req.json();
    const { storeId, ownerEmail, customerId, service, customerInfo, date, time, duration, notes, status } = body;

    if (!date || !time) {
      return NextResponse.json({ error: "date and time required" }, { status: 400 });
    }

    const email = customerInfo?.email || "";
    const phone = customerInfo?.phone || "";
    if (!email && !phone) {
      return NextResponse.json({ error: "email or phone required" }, { status: 400 });
    }

    await connectDB();

    const appointmentDuration = duration || service?.duration || 60;
    const conflict = await checkAppointmentConflict(storeId, date, time, appointmentDuration);
    if (conflict.hasConflict) {
      const conflicting = conflict.conflictingAppointments[0];
      return NextResponse.json({
        error: "conflict",
        message: `Horario ocupado: ${conflicting.customerName} tiene "${conflicting.serviceName}" de ${conflicting.time} a ${minutesToTime(timeToMinutes(conflicting.time) + conflicting.duration)}`,
        conflictingAppointments: conflict.conflictingAppointments,
      }, { status: 409 });
    }

    let finalCustomerId = customerId || null;
    if (email && !finalCustomerId && storeId) {
      const existing = await Customer.findOne({ storeId, email }).lean();
      if (existing) {
        finalCustomerId = existing._id;
      } else {
        const newCustomer = await Customer.create({
          storeId,
          name: customerInfo?.name || "Sin nombre",
          email,
          phone: phone || "",
          tags: ["appointment"],
          notes: `Auto-creado desde cita del ${date}`,
        });
        finalCustomerId = newCustomer._id;
      }
    }

    const appointment = await Appointment.create({
      storeId: storeId || undefined,
      ownerEmail: ownerEmail || undefined,
      customerId: finalCustomerId || undefined,
      service: service || { id: 0, name: "Sin servicio", price: 0, duration: duration || 60 },
      customerInfo: customerInfo || { name: "", email: "", phone: "" },
      date,
      time,
      duration: duration || 60,
      notes: notes || "",
      status: status || "pending",
      createdBy: "owner",
    });

    if (storeId) {
      try {
        const storeDoc = await (await import("@/lib/models/Store")).Store.findById(storeId).lean();
        const ownerId = String((storeDoc as any)?.ownerId || (storeDoc as any)?.userId || auth.userId);
        await notifyOwner(ownerId, storeId, "appointment", "Nueva cita agendada", `${customerInfo?.name || "Cliente"} - ${date} ${time} - ${service?.name || "Servicio"}`);
      } catch {}
    }

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    console.error("POST appointment error:", error);
    return NextResponse.json({ error: "Error creating appointment" }, { status: 500 });
  }
}
