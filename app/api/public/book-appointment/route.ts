import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Appointment } from "@/lib/models/Appointment";
import { Store } from "@/lib/models/Store";
import { User } from "@/lib/models/User";
import { Customer } from "@/lib/models/Customer";
import { checkAppointmentConflict, getAvailableSlots } from "@/lib/appointment-utils";
import { notifyOwner } from "@/lib/notify";
import { getPlanConfig, getPlanLimitsFromConfig } from "@/lib/plan-config";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const date = searchParams.get("date");
    const slotDuration = parseInt(searchParams.get("slotDuration") || "30");

    if (!slug || !date) {
      return NextResponse.json({ error: "slug and date required" }, { status: 400 });
    }

    await connectDB();
    const store = await Store.findOne({ slug }).lean();
    if (!store) {
      return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });
    }

    const slots = await getAvailableSlots(String(store._id), date, slotDuration);
    return NextResponse.json({ slots });
  } catch (error) {
    console.error("GET available slots error:", error);
    return NextResponse.json({ error: "Error loading slots" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug, serviceId, serviceName, servicePrice, serviceDuration, date, time, duration, name, email, phone, notes } = body;

    if (!slug || !date || !time || !name) {
      return NextResponse.json({ error: "slug, date, time and name required" }, { status: 400 });
    }

    await connectDB();
    const store = await Store.findOne({ slug }).lean();
    if (!store) {
      return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });
    }

    const storeUser = await User.findOne({ email: (store as any).ownerEmail }).lean();
    const config = await getPlanConfig();

    const isExpired = storeUser?.subscriptionExpiry && new Date(storeUser.subscriptionExpiry) < new Date();
    const isCanceled = storeUser?.subscriptionStatus === "canceled";
    const effectiveSubscription = (isExpired || isCanceled) ? null : storeUser?.subscription;
    const limits = getPlanLimitsFromConfig(config, effectiveSubscription || "free");

    const appointmentCount = await Appointment.countDocuments({ storeId: String(store._id) });
    if (appointmentCount >= limits.maxAppointments && limits.maxAppointments < 999) {
      return NextResponse.json({
        error: "plan_limit",
        message: `Esta empresa ha alcanzado el límite de ${limits.maxAppointments} citas en su plan actual. ¡Upgrada para aceptar más citas!`,
        needsUpgrade: true,
      }, { status: 403 });
    }

    const storeId = String(store._id);
    const appointmentDuration = duration || serviceDuration || 60;

    const conflict = await checkAppointmentConflict(storeId, date, time, appointmentDuration);
    if (conflict.hasConflict) {
      const conflicting = conflict.conflictingAppointments[0];
      return NextResponse.json({
        error: "conflict",
        message: `Este horario ya está ocupado. La cita de ${conflicting.customerName} ("${conflicting.serviceName}") es de ${conflicting.time} a ${minutesToTime(timeToMinutes(conflicting.time) + conflicting.duration)}. Por favor elige otro horario.`,
        conflictingAppointments: conflict.conflictingAppointments,
      }, { status: 409 });
    }

    let customerId: string | undefined;
    if (email) {
      const existing = await Customer.findOne({ storeId, email }).lean();
      if (existing) {
        customerId = String(existing._id);
      } else {
        const newCustomer = await Customer.create({
          storeId,
          name,
          email: email || "",
          phone: phone || "",
          tags: ["booking"],
          notes: "Creado desde reserva pública",
        });
        customerId = String(newCustomer._id);
      }
    }

    const appointment = await Appointment.create({
      storeId,
      customerId: customerId || undefined,
      service: {
        id: serviceId || 0,
        name: serviceName || "Sin servicio",
        price: servicePrice || 0,
        duration: serviceDuration || duration || 60,
      },
      customerInfo: { name, email: email || "", phone: phone || "" },
      date,
      time,
      duration: appointmentDuration,
      notes: notes || "",
      status: "pending",
      createdBy: "customer",
    });

    const ownerId = String((store as any).ownerId || (store as any).userId);
    if (ownerId) {
      await notifyOwner(ownerId, storeId, "appointment", "Nueva cita agendada", `${name} - ${date} ${time} - ${serviceName || "Servicio"}`);
    }

    return NextResponse.json({ success: true, appointment }, { status: 201 });
  } catch (error) {
    console.error("Public book appointment error:", error);
    return NextResponse.json({ error: "Error creating booking" }, { status: 500 });
  }
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
