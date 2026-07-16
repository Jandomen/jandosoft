import { connectDB } from "@/lib/mongodb";
import type { SchedulerModule } from "../registry";

const mod: SchedulerModule = {
  name: "ai",
  taskTypes: ["ai", "ai_followup"],

  async execute(task) {
    const { storeId, payload } = task;
    await connectDB();

    const prompt = payload?.prompt || payload?.message || "";
    const context = payload?.context || {};

    if (!prompt) {
      return { success: false, error: "No prompt provided" };
    }

    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    const token = process.env.CRON_SECRET;

    const res = await fetch(`${baseUrl}/api/ai/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        message: prompt,
        store: { _id: storeId, ...context },
        history: [],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return { success: false, error: `AI API error ${res.status}: ${text.slice(0, 200)}` };
    }

    const data = await res.json();
    return { success: true, message: `AI task executed: ${(data.response || "").slice(0, 100)}` };
  },
};

export default mod;
