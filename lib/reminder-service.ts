import { connectDB } from "@/lib/mongodb";
import { Appointment, IAppointment } from "@/lib/models/Appointment";
import { Store } from "@/lib/models/Store";
import { sendAppointmentReminderEmail } from "@/lib/email-service";

export async function scheduleAppointmentReminders(appointmentId: string): Promise<void> {
  await connectDB();
  const appointment = await Appointment.findById(appointmentId).lean();
  if (!appointment) return;

  const a = appointment as unknown as IAppointment;
  const store = a.storeId ? await Store.findById(a.storeId).lean() : null;

  const dateObj = new Date(`${a.date}T${a.time}`);
  const dateStr = dateObj.toLocaleDateString("es", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeStr = dateObj.toLocaleTimeString("es", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (a.customerInfo.email) {
    await sendAppointmentReminderEmail({
      to: a.customerInfo.email,
      customerName: a.customerInfo.name,
      serviceName: a.service.name,
      date: dateStr,
      time: timeStr,
      notes: a.notes,
      storeId: a.storeId?.toString() || "",
    });
  }
}
