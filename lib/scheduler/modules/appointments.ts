import { connectDB } from "@/lib/mongodb";
import { sendEmail } from "@/lib/email";
import { Appointment } from "@/lib/models/Appointment";
import type { SchedulerModule } from "../registry";

const mod: SchedulerModule = {
  name: "appointments",
  taskTypes: ["appointment_reminder", "reminder", "prospect_noshow"],

  async execute(task) {
    const { payload } = task;
    await connectDB();

    const appointment = await Appointment.findById((payload as any)?.appointmentId).lean() as any;
    if (!appointment) {
      return { success: false, error: "Appointment not found" };
    }

    // Support both legacy and detailed types
    const isNoShowRescue = task.type === "prospect_noshow";
    const customerName = appointment.customerInfo?.name || (appointment as any).customerName || "Cliente";
    const storeName = (appointment as any).storeName || "la empresa";
    const service = appointment.service?.name || (appointment as any).service || "servicio";
    const date = appointment.date ? new Date(appointment.date).toLocaleDateString("es-MX") : "próximamente";
    const time = appointment.time || "";

    const emailTo = appointment.customerInfo?.email || (appointment as any).customerEmail || (payload as any)?.email;

    // No-show rescue: if appointment is no_show, send rescue
    if (isNoShowRescue || appointment.settingStage === "no_show") {
      if (!emailTo) return { success: false, error: "No recipient email for no-show" };
      await sendEmail({
        to: emailTo,
        subject: `¿Reagendamos tu cita en ${storeName}?`,
        html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px"><h2 style="color:#dc2626">¿Reagendamos?</h2><p>Hola <strong>${customerName}</strong>, vimos que no pudiste asistir el ${date} ${time}. ¿Te sirve otro hueco? Responde a este email.</p></div>`,
      });
      return { success: true, message: `No-show rescue sent to ${emailTo}` };
    }

    if (!emailTo) {
      return { success: false, error: "No recipient email" };
    }

    await sendEmail({
      to: emailTo,
      subject: `Recordatorio: tu cita en ${storeName}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
          <h2 style="color:#dc2626">📅 Recordatorio de cita</h2>
          <p>Hola <strong>${customerName}</strong>,</p>
          <p>Tienes una cita programada:</p>
          <ul>
            <li><strong>Servicio:</strong> ${service}</li>
            <li><strong>Fecha:</strong> ${date}</li>
            ${time ? `<li><strong>Hora:</strong> ${time}</li>` : ""}
          </ul>
          <p style="color:#666;font-size:12px">— ${storeName}</p>
        </div>
      `,
    });

    // Auto-schedule T-1h if this was T-24h
    try {
      const aptDate = new Date(`${appointment.date}T${appointment.time || "09:00"}:00`);
      const now = new Date();
      const diffMs = aptDate.getTime() - now.getTime();
      if (diffMs > 2 * 60 * 60 * 1000) {
        // Schedule 1h before
        const { ScheduledTask } = await import("@/lib/models/ScheduledTask");
        await ScheduledTask.create({
          type: "appointment_reminder",
          payload: { appointmentId: String(appointment._id) },
          runAt: new Date(aptDate.getTime() - 60 * 60 * 1000),
          status: "pending",
          storeId: appointment.storeId,
        });
      }
    } catch {}

    return { success: true, message: `Reminder sent to ${emailTo}` };
  },
};

export default mod;
