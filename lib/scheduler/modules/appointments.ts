import { connectDB } from "@/lib/mongodb";
import { sendEmail } from "@/lib/email";
import { Appointment } from "@/lib/models/Appointment";
import type { SchedulerModule } from "../registry";

const mod: SchedulerModule = {
  name: "appointments",
  taskTypes: ["appointment_reminder", "reminder"],

  async execute(task) {
    const { storeId, payload } = task;
    await connectDB();

    const appointment = await Appointment.findById(task.payload?.appointmentId).lean();
    if (!appointment) {
      return { success: false, error: "Appointment not found" };
    }

    const customerName = (appointment as any).customerName || "Cliente";
    const storeName = (appointment as any).storeName || "la empresa";
    const service = (appointment as any).service || "servicio";
    const date = (appointment as any).date
      ? new Date((appointment as any).date).toLocaleDateString("es-MX")
      : "próximamente";
    const time = (appointment as any).time || "";

    const emailTo = (appointment as any).customerEmail || payload?.email;
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

    return { success: true, message: `Reminder sent to ${emailTo}` };
  },
};

export default mod;
