import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ScheduledTask } from "@/lib/models/ScheduledTask";
import { sendEmail } from "@/lib/email";

const MAX_PER_RUN = 50;

async function handleAppointmentReminder(payload: Record<string, any>): Promise<string> {
  const { customerEmail, customerName, storeName, serviceName, date, time } = payload;
  if (!customerEmail) throw new Error("customerEmail required");

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;">
      <h2 style="color:#ef4444;">Recordatorio de Cita</h2>
      <p>Hola <strong>${customerName || "Cliente"}</strong>,</p>
      <p>Te recordamos tu próxima cita en <strong>${storeName || "nuestra empresa"}</strong>:</p>
      <div style="background:#f5f5f4;border-radius:16px;padding:20px;margin:20px 0;">
        ${serviceName ? `<p><strong>Servicio:</strong> ${serviceName}</p>` : ""}
        <p><strong>Fecha:</strong> ${date}</p>
        <p><strong>Hora:</strong> ${time}</p>
      </div>
      <p style="color:#666;">Si necesitas reprogramar, contáctanos con anticipación.</p>
      <p style="color:#888;font-size:11px;margin-top:24px;">Jandosoft — Tu negocio en línea</p>
    </div>`;

  const result = await sendEmail({ to: customerEmail, subject: `Recordatorio: ${serviceName || "Cita"} — ${storeName || "Jandosoft"}`, html });
  if (!result.success) throw new Error(result.error || "Email send failed");
  return `Recordatorio enviado a ${customerEmail}`;
}

async function handleEmailCampaign(payload: Record<string, any>): Promise<string> {
  const { to, subject, content } = payload;
  if (!to || !subject) throw new Error("to and subject required");

  const html = content || `<p>Mensaje de Jandosoft</p>`;
  const result = await sendEmail({ to, subject, html });
  if (!result.success) throw new Error(result.error || "Email send failed");
  return `Campaña enviada a ${to}`;
}

async function handleStoreNotification(payload: Record<string, any>): Promise<string> {
  const { type, ownerEmail, customerName, storeName, amount, product } = payload;

  if (!ownerEmail) throw new Error("ownerEmail required");

  let subject: string;
  let html: string;

  if (type === "new_order") {
    subject = `Nuevo Pedido — ${storeName || "Jandosoft"}`;
    html = `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;">
        <h2 style="color:#ef4444;">Nuevo Pedido Recibido</h2>
        <p>Se ha registrado un nuevo pedido en <strong>${storeName || "tu empresa"}</strong>:</p>
        <div style="background:#f5f5f4;border-radius:16px;padding:20px;margin:20px 0;">
          <p><strong>Cliente:</strong> ${customerName || "N/A"}</p>
          <p><strong>Producto:</strong> ${product || "N/A"}</p>
          ${amount ? `<p><strong>Total:</strong> $${amount}</p>` : ""}
        </div>
      </div>`;
  } else if (type === "new_booking") {
    subject = `Nueva Reserva — ${storeName || "Jandosoft"}`;
    html = `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;">
        <h2 style="color:#ef4444;">Nueva Reserva</h2>
        <p>Se ha realizado una nueva reserva en <strong>${storeName || "tu empresa"}</strong>.</p>
        <div style="background:#f5f5f4;border-radius:16px;padding:20px;margin:20px 0;">
          <p><strong>Cliente:</strong> ${customerName || "N/A"}</p>
          ${amount ? `<p><strong>Monto:</strong> $${amount}</p>` : ""}
        </div>
      </div>`;
  } else {
    subject = `Notificación — ${storeName || "Jandosoft"}`;
    html = `<p>Notificación de tu tienda en Jandosoft.</p>`;
  }

  const result = await sendEmail({ to: ownerEmail, subject, html });
  if (!result.success) throw new Error(result.error || "Email send failed");
  return `Notificación enviada a ${ownerEmail}`;
}

async function handleAiFollowup(payload: Record<string, any>): Promise<string> {
  const { prompt, context } = payload;
  if (!prompt) throw new Error("prompt required");

  const response = await fetch(`${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/api/ai/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: prompt,
      context: context || {},
      quick: true,
    }),
  });
  if (!response.ok) throw new Error("AI followup failed");
  const data = await response.json();
  return `AI followup completado: ${data.response?.slice(0, 200) || "OK"}`;
}

const HANDLERS: Record<string, (payload: Record<string, any>) => Promise<string>> = {
  appointment_reminder: handleAppointmentReminder,
  email_campaign: handleEmailCampaign,
  store_notification: handleStoreNotification,
  ai_followup: handleAiFollowup,
} as any;

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();

    const tasks = await ScheduledTask.find({
      runAt: { $lte: new Date() },
      status: "pending",
    })
      .sort({ runAt: 1 })
      .limit(MAX_PER_RUN);

    if (tasks.length === 0) {
      return NextResponse.json({ processed: 0, message: "No pending tasks" });
    }

    const results: { id: string; type: string; status: string; result?: string; error?: string }[] = [];

    for (const task of tasks) {
      task.status = "processing";
      task.attempts += 1;
      await task.save();

      try {
        const handler = HANDLERS[task.type];
        if (!handler) throw new Error(`No handler for type: ${task.type}`);

        const result = await handler(task.payload);
        task.status = "done";
        await task.save();
        results.push({ id: task._id.toString(), type: task.type, status: "done", result });
      } catch (err: any) {
        task.status = task.attempts >= task.maxAttempts ? "failed" : "pending";
        task.error = err.message;
        await task.save();
        results.push({ id: task._id.toString(), type: task.type, status: task.status, error: err.message });
      }
    }

    return NextResponse.json({ processed: results.length, results });
  } catch (error: any) {
    console.error("[Scheduler] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
