import { NextRequest, NextResponse } from "next/server";
import { getAuthFromCookies, getAuthFromHeaders } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Conversation from "@/lib/models/Conversation";
import Message from "@/lib/models/Message";
import { messageEvents, MESSAGE_NEW, type SSEEvent } from "@/lib/messaging/events";

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
  const { content } = await req.json();
  if (!content?.trim()) {
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
    content: content.trim(),
  });

  await Conversation.findByIdAndUpdate(id, {
    lastMessage: content.trim().slice(0, 100),
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
        content: content.trim(),
        createdAt: message.createdAt,
        readAt: null,
      },
    },
    timestamp: Date.now(),
  };
  messageEvents.emit(`${MESSAGE_NEW}:${id}`, event);

  return NextResponse.json({ message });
}
