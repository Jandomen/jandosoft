import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { Notification } from "@/lib/models/Notification";
import { getAuthFromCookies, getAuthFromHeaders } from "@/lib/auth";
import { messageEvents, NOTIFICATION_NEW } from "@/lib/messaging/events";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = getAuthFromHeaders(req) || await getAuthFromCookies();
  if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { subject, message, category } = await req.json();
  if (!subject?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "Asunto y mensaje son obligatorios" }, { status: 400 });
  }

  await connectDB();

  const sender = await User.findById(auth.userId).select("name email").lean();
  const admin = await User.findOne({ isSuperAdmin: true }).select("_id").lean();

  if (!admin) {
    return NextResponse.json({ error: "No hay administrador disponible" }, { status: 500 });
  }

  const categoryLabels: Record<string, string> = {
    support: "Soporte",
    suggestion: "Sugerencia",
    complaint: "Queja",
    billing: "Facturación",
    other: "Otro",
  };

  const notification = await Notification.create({
    type: "alert",
    title: `[Soporte] ${categoryLabels[category] || "Mensaje"}: ${subject}`,
    message: `De: ${sender?.name || "Usuario"} (${sender?.email || ""})\n\n${message}`,
    userId: (admin as any)._id.toString(),
    link: `/api/support?from=${auth.userId}`,
  });

  messageEvents.emit(NOTIFICATION_NEW, {
    type: NOTIFICATION_NEW,
    payload: notification.toObject(),
    timestamp: Date.now(),
  });

  return NextResponse.json({ success: true, message: "Mensaje enviado al administrador" });
}

export async function GET(req: NextRequest) {
  const auth = getAuthFromHeaders(req) || await getAuthFromCookies();
  if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  await connectDB();

  const { searchParams } = new URL(req.url);
  const fromUser = searchParams.get("from");

  const query: any = {};
  if (fromUser) {
    query.link = { $regex: `from=${fromUser}` };
  } else {
    query.userId = auth.userId;
  }
  query.title = { $regex: "\\[Soporte\\]" };

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  return NextResponse.json({ messages: notifications });
}
