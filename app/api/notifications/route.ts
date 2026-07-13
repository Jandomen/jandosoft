import { NextRequest, NextResponse } from "next/server";
import { getAuthFromCookies, getAuthFromHeaders } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Notification } from "@/lib/models/Notification";
import { messageEvents, NOTIFICATION_NEW } from "@/lib/messaging/events";

export async function GET(req: NextRequest) {
  const auth = getAuthFromHeaders(req) || await getAuthFromCookies();
  if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  await connectDB();

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
  const unreadOnly = searchParams.get("unread") === "true";

  const query: any = { userId: auth.userId };
  if (unreadOnly) query.read = false;

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  const unreadCount = await Notification.countDocuments({ userId: auth.userId, read: false });

  return NextResponse.json({ notifications, unreadCount });
}

export async function POST(req: NextRequest) {
  const auth = getAuthFromHeaders(req) || await getAuthFromCookies();
  if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { type, title, message, storeId, organizationId, link } = await req.json();
  if (!title) {
    return NextResponse.json({ error: "El título es obligatorio" }, { status: 400 });
  }

  await connectDB();

  const notification = await Notification.create({
    type: type || "info",
    title,
    message: message || "",
    userId: auth.userId,
    storeId: storeId || undefined,
    organizationId: organizationId || undefined,
    link: link || undefined,
  });

  messageEvents.emit(NOTIFICATION_NEW, {
    type: NOTIFICATION_NEW,
    payload: notification.toObject(),
    timestamp: Date.now(),
  });

  return NextResponse.json({ notification }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const auth = getAuthFromHeaders(req) || await getAuthFromCookies();
  if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { notificationId, markAllRead } = await req.json();

  await connectDB();

  if (markAllRead) {
    await Notification.updateMany(
      { userId: auth.userId, read: false },
      { $set: { read: true } }
    );
    return NextResponse.json({ success: true });
  }

  if (!notificationId) {
    return NextResponse.json({ error: "Se requiere notificationId" }, { status: 400 });
  }

  await Notification.updateOne(
    { _id: notificationId, userId: auth.userId },
    { $set: { read: true } }
  );

  return NextResponse.json({ success: true });
}
