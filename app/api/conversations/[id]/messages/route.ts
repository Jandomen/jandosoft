import { NextRequest, NextResponse } from "next/server";
import { getAuthFromCookies, getAuthFromHeaders } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Conversation from "@/lib/models/Conversation";
import Message from "@/lib/models/Message";
import { messageEvents, MESSAGE_NEW, type SSEEvent } from "@/lib/messaging/events";
import { emitMessageEvent } from "@/lib/socket-server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = getAuthFromHeaders(req) || await getAuthFromCookies();
  if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  await connectDB();

  const conv = await Conversation.findOne({
    _id: id,
    "participants.userId": auth.userId,
  });
  if (!conv) return NextResponse.json({ error: "Conversación no encontrada" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const before = searchParams.get("before");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

  const query: any = { conversationId: id };
  if (before) query.createdAt = { $lt: new Date(before) };

  const messages = await Message.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return NextResponse.json({ messages: messages.reverse() });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = getAuthFromHeaders(req) || await getAuthFromCookies();
  if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const { content, mediaUrl, mediaType } = await req.json();
  if (!content?.trim() && !mediaUrl) {
    return NextResponse.json({ error: "El mensaje no puede estar vacío" }, { status: 400 });
  }

  await connectDB();

  const conv = await Conversation.findOne({
    _id: id,
    "participants.userId": auth.userId,
  });
  if (!conv) return NextResponse.json({ error: "Conversación no encontrada" }, { status: 404 });

  const message = await Message.create({
    conversationId: id,
    senderId: auth.userId,
    senderEmail: auth.email,
    senderName: auth.email.split("@")[0],
    content: content?.trim() || "",
    ...(mediaUrl && mediaType ? { mediaUrl, mediaType } : {}),
  });

  const preview = mediaUrl
    ? `[${mediaType === "video" ? "Video" : "Imagen"}]${content?.trim() ? ": " + content.trim().slice(0, 80) : ""}`
    : content.trim().slice(0, 100);

  await Conversation.findByIdAndUpdate(id, {
    lastMessage: preview,
    lastSenderId: auth.userId,
    lastMessageAt: new Date(),
    updatedAt: new Date(),
  });

  const event: SSEEvent = {
    type: MESSAGE_NEW,
    payload: {
      conversationId: id,
      message: {
        _id: message._id,
        conversationId: id,
        senderId: auth.userId,
        senderEmail: auth.email,
        senderName: auth.email.split("@")[0],
        content: message.content,
        mediaUrl: message.mediaUrl,
        mediaType: message.mediaType,
        createdAt: message.createdAt,
        readAt: null,
      },
    },
    timestamp: Date.now(),
  };
  messageEvents.emit(`${MESSAGE_NEW}:${id}`, event);

  const participants = (conv.participants || []) as any[];
  for (const p of participants) {
    if (p.userId && p.userId.toString() !== auth.userId) {
      const participantUser = await import("@/lib/models/User").then(m =>
        m.User.findById(p.userId).lean().select("email")
      );
      if (participantUser?.email) {
        emitMessageEvent(String(participantUser.email), "new-message", {
          conversationId: id,
          message: event.payload.message,
        });
      }
    }
  }

  for (const p of participants) {
    if (p.userId) {
      const participantUser = await import("@/lib/models/User").then(m =>
        m.User.findById(p.userId).lean().select("email")
      );
      if (participantUser?.email) {
        const convIds = (await Conversation.find({ "participants.userId": p.userId }).select("_id").lean()).map((c: any) => c._id);
        const unread = await Message.countDocuments({
          conversationId: { $in: convIds },
          senderId: { $ne: p.userId },
          readAt: null,
        });
        emitMessageEvent(String(participantUser.email), "unread-update", { unread });
      }
    }
  }

  return NextResponse.json({ message });
}
