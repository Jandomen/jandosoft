import { NextRequest } from "next/server";
import { getAuthFromCookies, getAuthFromHeaders } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Conversation from "@/lib/models/Conversation";
import Message from "@/lib/models/Message";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = getAuthFromHeaders(req) || await getAuthFromCookies();
  if (!auth) return new Response("No autorizado", { status: 401 });

  const { id } = await params;

  await connectDB();
  const conv = await Conversation.findOne({
    _id: id,
    "participants.userId": auth.userId,
  });
  if (!conv) return new Response("Conversación no encontrada", { status: 404 });

  const unread = await Message.countDocuments({
    conversationId: id,
    senderId: { $ne: auth.userId },
    readAt: null,
  });

  return Response.json({ unread });
}
