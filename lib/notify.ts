import { connectDB } from "./mongodb";
import { Notification } from "./models/Notification";
import { messageEvents, NOTIFICATION_NEW } from "./messaging/events";

export type NotificationType = "appointment" | "order" | "customer" | "payment" | "invoice" | "info";

export async function notifyOwner(
  userId: string,
  storeId: string,
  type: NotificationType,
  title: string,
  message: string,
  link?: string
) {
  try {
    await connectDB();
    const doc = await Notification.create({
      type,
      title,
      message,
      userId,
      storeId,
      link: link || "/dashboard",
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
        link: link || "/dashboard",
        read: false,
        createdAt: doc.createdAt,
      },
      timestamp: Date.now(),
    });
  } catch (e) {
    console.error("Failed to create notification:", e);
  }
}
