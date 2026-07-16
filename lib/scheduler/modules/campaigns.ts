import { connectDB } from "@/lib/mongodb";
import { sendEmail } from "@/lib/email";
import { Store } from "@/lib/models/Store";
import type { SchedulerModule } from "../registry";

const mod: SchedulerModule = {
  name: "campaigns",
  taskTypes: ["email_campaign", "campaign"],

  async execute(task) {
    const { storeId, payload } = task;
    await connectDB();

    const recipients = payload?.recipients || [];
    const subject = payload?.subject || "Campaña";
    const content = payload?.content || "";
    const store = await Store.findById(storeId).lean().catch(() => null);
    const storeName = (store as any)?.name || "Jandosoft";

    if (recipients.length === 0) {
      return { success: false, error: "No recipients" };
    }

    let sent = 0;
    let failed = 0;

    for (const recipient of recipients) {
      try {
        const email = typeof recipient === "string" ? recipient : recipient.email;
        if (!email) continue;

        await sendEmail({
          to: email,
          subject,
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
              <h2 style="color:#dc2626">${subject}</h2>
              <div>${content}</div>
              <hr style="margin:20px 0;border:none;border-top:1px solid #eee"/>
              <p style="color:#999;font-size:11px">Enviado por ${storeName} — Jandosoft</p>
            </div>
          `,
        });
        sent++;
      } catch {
        failed++;
      }
    }

    return {
      success: sent > 0,
      message: `Campaign sent: ${sent} delivered, ${failed} failed`,
      error: failed > 0 ? `${failed} emails failed` : undefined,
    };
  },
};

export default mod;
