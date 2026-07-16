import { connectDB } from "@/lib/mongodb";
import { sendEmail } from "@/lib/email";
import type { SchedulerModule } from "../registry";

const mod: SchedulerModule = {
  name: "emails",
  taskTypes: ["email", "auto_email"],

  async execute(task) {
    const { payload } = task;
    await connectDB();

    const to = payload?.to;
    const subject = payload?.subject || "Mensaje automático";
    const html = payload?.html || payload?.content || "";

    if (!to) {
      return { success: false, error: "No recipient email" };
    }

    await sendEmail({ to, subject, html });

    return { success: true, message: `Email sent to ${to}` };
  },
};

export default mod;
