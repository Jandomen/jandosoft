import type { SchedulerModule } from "../registry";

const mod: SchedulerModule = {
  name: "sms",
  taskTypes: ["sms"],

  async execute(task) {
    const { payload } = task;

    const to = payload?.to;
    const message = payload?.message || "";

    if (!to) {
      return { success: false, error: "No recipient phone" };
    }

    const apiKey = process.env.SMS_API_KEY;
    if (!apiKey) {
      return { success: false, error: "SMS_API_KEY not configured" };
    }

    // TODO: Integrate with SMS provider (Twilio, Vonage, etc.)
    console.log(`[sms] Would send to ${to}: ${message.slice(0, 50)}...`);

    return { success: true, message: `SMS queued for ${to}` };
  },
};

export default mod;
