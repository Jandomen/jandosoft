import type { ToolDefinition, ToolResult } from "./base";
import { getStoreTimezone, isDateInPast, isTimeInPast, computeRelativeDate, getDateComponents } from "@/lib/ai/time";

export const TOOLS: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "create_appointment",
      description: "Create a new appointment for a customer. The system automatically checks for scheduling conflicts.",
      parameters: {
        type: "object",
        properties: {
          customerName: { type: "string", description: "Customer name" },
          customerEmail: { type: "string", description: "Customer email" },
          customerPhone: { type: "string", description: "Customer phone" },
          serviceName: { type: "string", description: "Service name" },
          servicePrice: { type: "number", description: "Service price" },
          date: { type: "string", description: "Appointment date (YYYY-MM-DD)" },
          time: { type: "string", description: "Appointment time (HH:MM)" },
          duration: { type: "number", description: "Duration in minutes" },
          notes: { type: "string", description: "Additional notes" },
        },
        required: ["customerName", "date", "time", "customerEmail"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_appointment",
      description: "Update an existing appointment's date, time, status, or notes. The system checks for conflicts when rescheduling.",
      parameters: {
        type: "object",
        properties: {
          appointmentId: { type: "string", description: "Appointment ID" },
          date: { type: "string", description: "New date (YYYY-MM-DD)" },
          time: { type: "string", description: "New time (HH:MM)" },
          status: { type: "string", description: "New status" },
          notes: { type: "string", description: "New notes" },
        },
        required: ["appointmentId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "cancel_appointment",
      description: "Cancel an appointment by ID",
      parameters: {
        type: "object",
        properties: {
          appointmentId: { type: "string", description: "Appointment ID to cancel" },
        },
        required: ["appointmentId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_appointments",
      description: "List appointments for the store, optionally filtered by date or status",
      parameters: {
        type: "object",
        properties: {
          date: { type: "string", description: "Filter by date (YYYY-MM-DD)" },
          status: { type: "string", description: "Filter by status (pending, confirmed, cancelled)" },
          limit: { type: "number", description: "Max results (default 20)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "check_available_slots",
      description: "Check available time slots for a specific date. Use this before booking to show the customer available times.",
      parameters: {
        type: "object",
        properties: {
          date: { type: "string", description: "Date to check (YYYY-MM-DD)" },
          slotDuration: { type: "number", description: "Slot duration in minutes (default 30)" },
        },
        required: ["date"],
      },
    },
  },
];

export async function executeBookingTool(name: string, args: any, store: any, userId: string): Promise<ToolResult> {
  const storeId = store?._id || store?.id;
  if (!storeId) return { error: "No store selected" };
  const { connectDB } = await import("@/lib/mongodb");
  const { Appointment } = await import("@/lib/models/Appointment");
  await connectDB();

  if (name === "check_available_slots") {
    try {
      // Resolve relative dates
      const tz = getStoreTimezone(store);
      const lowerDate = args.date.toLowerCase().trim();
      let resolvedDate = args.date;
      if (["hoy", "today"].includes(lowerDate)) {
        resolvedDate = getDateComponents(tz).dateISO;
      } else if (["mañana", "manana", "tomorrow"].includes(lowerDate)) {
        resolvedDate = computeRelativeDate("tomorrow", tz);
      } else if (["ayer", "yesterday"].includes(lowerDate)) {
        resolvedDate = computeRelativeDate("yesterday", tz);
      }

      const { getAvailableSlots } = await import("@/lib/appointment-utils");
      const slots = await getAvailableSlots(String(storeId), resolvedDate, args.slotDuration || 30);
      const available = slots.filter(s => s.available);
      const taken = slots.filter(s => !s.available);
      return {
        success: true,
        message: available.length > 0
          ? `${available.length} horarios disponibles el ${args.date}. Horarios ocupados: ${taken.map(s => s.time).join(", ") || "ninguno"}`
          : `No hay horarios disponibles el ${args.date}`,
        slots: slots.map(s => ({
          time: s.time,
          available: s.available,
          conflictWith: s.conflictWith,
        })),
        availableCount: available.length,
        takenCount: taken.length,
      };
    } catch (e) {
      return { error: "Error al verificar disponibilidad" };
    }
  }

  if (name === "create_appointment") {
    const isCustomer = typeof userId === "string" && (userId === "guest" || userId.startsWith("guest:"));
    const servicePrice = args.servicePrice || 0;
    const appointmentDuration = args.duration || 60;

    // ── Resolve relative dates using server time ──
    const tz = getStoreTimezone(store);
    let resolvedDate = args.date;
    if (resolvedDate) {
      const lowerDate = resolvedDate.toLowerCase().trim();
      if (["hoy", "today"].includes(lowerDate)) {
        resolvedDate = getDateComponents(tz).dateISO;
      } else if (["mañana", "manana", "tomorrow"].includes(lowerDate)) {
        resolvedDate = computeRelativeDate("tomorrow", tz);
      } else if (["ayer", "yesterday"].includes(lowerDate)) {
        resolvedDate = computeRelativeDate("yesterday", tz);
      } else if (lowerDate.includes("lunes") || lowerDate.includes("martes") || lowerDate.includes("miércoles") ||
                 lowerDate.includes("jueves") || lowerDate.includes("viernes") || lowerDate.includes("sábado") ||
                 lowerDate.includes("domingo") || lowerDate.includes("monday") || lowerDate.includes("tuesday") ||
                 lowerDate.includes("wednesday") || lowerDate.includes("thursday") || lowerDate.includes("friday") ||
                 lowerDate.includes("saturday") || lowerDate.includes("sunday")) {
        resolvedDate = computeRelativeDate(lowerDate, tz);
      }
    }

    // ── Validate date is not in the past ──
    if (resolvedDate && isDateInPast(resolvedDate, tz)) {
      return {
        error: `La fecha ${resolvedDate} ya pasó. La fecha actual es ${getDateComponents(tz).dateISO}. Por favor elige una fecha futura.`,
      };
    }

    // ── Validate time is not in the past (if same day) ──
    if (resolvedDate && args.time && isTimeInPast(resolvedDate, args.time, tz)) {
      return {
        error: `La hora ${args.time} del ${resolvedDate} ya pasó. La hora actual es ${getDateComponents(tz).timeStr}. Por favor elige una hora futura.`,
      };
    }

    try {
      const { checkAppointmentConflict } = await import("@/lib/appointment-utils");
      const conflict = await checkAppointmentConflict(String(storeId), resolvedDate, args.time, appointmentDuration);
      if (conflict.hasConflict) {
        const conflicting = conflict.conflictingAppointments[0];
        return {
          error: `Conflicto de horario: ${conflicting.customerName} tiene "${conflicting.serviceName}" de ${conflicting.time} a ${minutesToTime(timeToMinutes(conflicting.time) + conflicting.duration)}. Por favor elige otro horario.`,
          conflict: true,
          conflictingAppointments: conflict.conflictingAppointments,
        };
      }
    } catch (e) {
      console.error("Conflict check failed:", e);
    }

    let customerId = null;
    if (args.customerEmail && storeId) {
      try {
        const { Customer } = await import("@/lib/models/Customer");
        const existing = await Customer.findOne({ storeId, email: args.customerEmail }).lean();
        if (existing) {
          customerId = existing._id;
        } else {
          const newCustomer = await Customer.create({
            storeId,
            name: args.customerName || "Sin nombre",
            email: args.customerEmail || "",
            phone: args.customerPhone || "",
            tags: ["chatbot"],
            notes: "Auto-creado desde chat AI",
          });
          customerId = newCustomer._id;
        }
      } catch (e) {
        console.error("Failed to auto-create customer:", e);
      }
    }

    const appointment = await Appointment.create({
      storeId,
      customerId: customerId || undefined,
      customerInfo: {
        name: args.customerName,
        email: args.customerEmail || "",
        phone: args.customerPhone || "",
      },
      service: {
        id: 0,
        name: args.serviceName || "General",
        price: servicePrice,
        duration: args.duration || 60,
      },
      date: resolvedDate,
      time: args.time,
      duration: args.duration || 60,
      notes: args.notes || "",
      status: "pending",
      createdBy: isCustomer ? "customer" : "owner",
      paymentStatus: servicePrice > 0 ? "unpaid" : "paid",
    });

    let paymentUrl = "";
    if (servicePrice > 0 && store) {
      try {
        const integrations = (store as any).paymentIntegrations?.filter((i: any) => i.enabled) || [];
        if (integrations.length > 0) {
          const { createProviderCheckout } = await import("@/lib/payment-providers/registry");
          const result = await createProviderCheckout(integrations, {
            storeId: String(storeId),
            storeName: (store as any).name,
            ownerEmail: (store as any).ownerEmail,
            amount: servicePrice,
            currency: "usd",
            description: `${args.serviceName || "Servicio"} - ${args.customerName}`,
            customerEmail: args.customerEmail || "",
            customerName: args.customerName || "",
          });
          paymentUrl = result.url || "";
        }
        if (paymentUrl) {
          await Appointment.findByIdAndUpdate(appointment._id, { $set: { stripePaymentUrl: paymentUrl, paymentStatus: "pending" } });
        }
      } catch (e) {
        console.error("Failed to create payment for appointment:", e);
      }
    }

    const result: ToolResult = {
      success: true,
      message: `Cita creada: ${args.customerName} el ${resolvedDate} a las ${args.time}`,
      appointmentId: appointment._id,
      paymentStatus: servicePrice > 0 ? "unpaid" : "paid",
    };
    if (paymentUrl) {
      result.stripePaymentUrl = paymentUrl;
      result.message += `. Pago requerido: $${servicePrice} — ${paymentUrl}`;
    }
    return result;
  }

  if (name === "update_appointment") {
    const existingApt = await Appointment.findById(args.appointmentId).lean();
    if (!existingApt) return { error: `Cita con ID ${args.appointmentId} no encontrada` };

    const newDate = args.date || (existingApt as any).date;
    const newTime = args.time || (existingApt as any).time;
    const newDuration = (existingApt as any).duration || (existingApt as any).service?.duration || 60;

    if (args.date || args.time) {
      try {
        const { checkAppointmentConflict } = await import("@/lib/appointment-utils");
        const conflict = await checkAppointmentConflict(String(storeId), newDate, newTime, newDuration, args.appointmentId);
        if (conflict.hasConflict) {
          const conflicting = conflict.conflictingAppointments[0];
          return {
            error: `Conflicto de horario: ${conflicting.customerName} tiene "${conflicting.serviceName}" de ${conflicting.time} a ${minutesToTime(timeToMinutes(conflicting.time) + conflicting.duration)}. Por favor elige otro horario.`,
            conflict: true,
            conflictingAppointments: conflict.conflictingAppointments,
          };
        }
      } catch (e) {
        console.error("Conflict check failed:", e);
      }
    }

    const update: any = {};
    if (args.date) update.date = args.date;
    if (args.time) update.time = args.time;
    if (args.status) update.status = args.status;
    if (args.notes !== undefined) update.notes = args.notes;
    const updated = await Appointment.findByIdAndUpdate(args.appointmentId, { $set: update }, { new: true }).lean();
    return { success: true, message: `Cita actualizada correctamente` };
  }

  if (name === "cancel_appointment") {
    const updated = await Appointment.findByIdAndUpdate(args.appointmentId, { $set: { status: "cancelled" } }, { new: true }).lean();
    if (!updated) return { error: `Cita con ID ${args.appointmentId} no encontrada` };
    return { success: true, message: `Cita cancelada correctamente` };
  }

  if (name === "list_appointments") {
    const filter: any = { storeId };
    if (args.date) {
      // Resolve relative dates
      const tz = getStoreTimezone(store);
      const lowerDate = args.date.toLowerCase().trim();
      let resolvedDate = args.date;
      if (["hoy", "today"].includes(lowerDate)) {
        resolvedDate = getDateComponents(tz).dateISO;
      } else if (["mañana", "manana", "tomorrow"].includes(lowerDate)) {
        resolvedDate = computeRelativeDate("tomorrow", tz);
      } else if (["ayer", "yesterday"].includes(lowerDate)) {
        resolvedDate = computeRelativeDate("yesterday", tz);
      }
      filter.date = resolvedDate;
    }
    if (args.status) filter.status = args.status;
    const appointments = await Appointment.find(filter).sort({ date: 1, time: 1 }).limit(args.limit || 20).lean();
    return {
      success: true,
      appointments: appointments.map((a: any) => ({
        id: a._id,
        customer: a.customerInfo.name,
        service: a.service?.name,
        date: a.date,
        time: a.time,
        duration: a.duration,
        status: a.status,
        notes: a.notes,
      })),
      count: appointments.length,
    };
  }

  return { error: `Unknown booking tool: ${name}` };
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
