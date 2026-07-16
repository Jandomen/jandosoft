import type { SchedulerModule } from "../registry";

const mod: SchedulerModule = {
  name: "whatsapp",
  taskTypes: ["whatsapp"],

  async execute(task) {
    const { payload } = task;

    const to = payload?.to;
    const message = payload?.message || "";

    if (!to) {
      return { success: false, error: "No recipient phone" };
    }

    const apiKey = process.env.WHATSAPP_API_KEY;
    if (!apiKey) {
      return { success: false, error: "WHATSAPP_API_KEY not configured" };
    }

    // TODO: Integrate with WhatsApp Business API
    console.log(`[whatsapp] Would send to ${to}: ${message.slice(0, 50)}...`);

    return { success: true, message: `WhatsApp queued for ${to}` };
  },
};

export default mod;
