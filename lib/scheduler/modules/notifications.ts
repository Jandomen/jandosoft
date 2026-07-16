import { connectDB } from "@/lib/mongodb";
import { Notification } from "@/lib/models/Notification";
import { messageEvents, NOTIFICATION_NEW } from "@/lib/messaging/events";
import type { SchedulerModule } from "../registry";

const mod: SchedulerModule = {
  name: "notifications",
  taskTypes: ["store_notification", "notification"],

  async execute(task) {
    const { storeId, userId, payload } = task;
    await connectDB();

    const title = payload?.title || "Notificación";
    const message = payload?.message || "";
    const type = payload?.notificationType || payload?.type || "info";
    const link = payload?.link || "/dashboard";

    const doc = await Notification.create({
      type,
      title,
      message,
      userId,
      storeId,
      link,
    });

    messageEvents.emit(NOTIFICATION_NEW, {
      type: NOTIFICATION_NEW,
      payload: {
        _id: doc._id.toString(),
        type,
        title,
        message,
        userId,
        storeId,
        link,
        read: false,
        createdAt: doc.createdAt,
      },
      timestamp: Date.now(),
    });

    return { success: true, message: `Notification "${title}" created` };
  },
};

export default mod;
