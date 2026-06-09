import { NextRequest, NextResponse } from "next/server";
import { getAuthFromCookies, getAuthFromHeaders } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Conversation from "@/lib/models/Conversation";
import Message from "@/lib/models/Message";
import { messageEvents, MESSAGE_READ, type SSEEvent } from "@/lib/messaging/events";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = getAuthFromHeaders(req) || await getAuthFromCookies();
  if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  await connectDB();

  const conv = await Conversation.findOne({
    _id: id,
    "participants.userId": auth.userId,
  });
  if (!conv) return NextResponse.json({ error: "Conversación no encontrada" }, { status: 404 });

  const result = await Message.updateMany(
    { conversationId: id, senderId: { $ne: auth.userId }, readAt: null },
    { readAt: new Date() }
  );

  if (result.modifiedCount > 0) {
    const event: SSEEvent = {
      type: MESSAGE_READ,
      payload: { conversationId: id, readBy: auth.userId, readAt: new Date() },
      timestamp: Date.now(),
    };
    messageEvents.emit(`${MESSAGE_READ}:${id}`, event);
  }

  return NextResponse.json({ modified: result.modifiedCount });
}
