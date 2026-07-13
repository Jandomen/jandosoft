import type { ToolDefinition, ToolResult } from "./base";

export const TOOLS: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "create_appointment",
      description: "Create a new appointment for a customer",
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
        required: ["customerName", "date", "time"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_appointment",
      description: "Update an existing appointment's date, time, status, or notes",
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
];

export async function executeBookingTool(name: string, args: any, store: any, userId: string): Promise<ToolResult> {
  const storeId = store?._id || store?.id;
  if (!storeId) return { error: "No store selected" };
  const { connectDB } = await import("@/lib/mongodb");
  const { Appointment } = await import("@/lib/models/Appointment");
  await connectDB();

  if (name === "create_appointment") {
    const isCustomer = typeof userId === "string" && (userId === "guest" || userId.startsWith("guest:"));
    const servicePrice = args.servicePrice || 0;
    const appointment = await Appointment.create({
      storeId,
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
      date: args.date,
      time: args.time,
      duration: args.duration || 60,
      notes: args.notes || "",
      status: "pending",
      createdBy: isCustomer ? "customer" : "owner",
      paymentStatus: servicePrice > 0 ? "unpaid" : "paid",
    });

    let paymentUrl = "";
    if (servicePrice > 0 && store && (store as any).stripeAccountId && (store as any).paymentsEnabled) {
      try {
        const { default: Stripe } = await import("stripe");
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
        const session = await stripe.checkout.sessions.create({
          mode: "payment",
          line_items: [{
            price_data: {
              currency: "usd",
              product_data: { name: `${args.serviceName || "Servicio"} - ${args.customerName}` },
              unit_amount: Math.round(servicePrice * 100),
            },
            quantity: 1,
          }],
          metadata: {
            appointmentId: String(appointment._id),
            storeId: String(storeId),
            type: "appointment_payment",
          },
          payment_intent_data: {
            transfer_data: { destination: (store as any).stripeAccountId },
          },
          success_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://jandosoft.vercel.app"}/s/${(store as any).slug || ""}?payment=success`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://jandosoft.vercel.app"}/s/${(store as any).slug || ""}?payment=cancelled`,
        });
        paymentUrl = session.url || "";
        if (paymentUrl) {
          await Appointment.findByIdAndUpdate(appointment._id, { $set: { stripePaymentUrl: paymentUrl, paymentStatus: "pending" } });
        }
      } catch (e) {
        console.error("Failed to create payment for appointment:", e);
      }
    }

    const result: ToolResult = {
      success: true,
      message: `Cita creada: ${args.customerName} el ${args.date} a las ${args.time}`,
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
    const update: any = {};
    if (args.date) update.date = args.date;
    if (args.time) update.time = args.time;
    if (args.status) update.status = args.status;
    if (args.notes !== undefined) update.notes = args.notes;
    const updated = await Appointment.findByIdAndUpdate(args.appointmentId, { $set: update }, { new: true }).lean();
    if (!updated) return { error: `Cita con ID ${args.appointmentId} no encontrada` };
    return { success: true, message: `Cita actualizada correctamente` };
  }

  if (name === "cancel_appointment") {
    const updated = await Appointment.findByIdAndUpdate(args.appointmentId, { $set: { status: "cancelled" } }, { new: true }).lean();
    if (!updated) return { error: `Cita con ID ${args.appointmentId} no encontrada` };
    return { success: true, message: `Cita cancelada correctamente` };
  }

  if (name === "list_appointments") {
    const filter: any = { storeId };
    if (args.date) filter.date = args.date;
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
