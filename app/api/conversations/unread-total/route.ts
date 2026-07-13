import { NextRequest } from "next/server";
import { getAuthFromCookies, getAuthFromHeaders } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Conversation from "@/lib/models/Conversation";
import Message from "@/lib/models/Message";

export async function GET(req: NextRequest) {
  const auth = getAuthFromHeaders(req) || await getAuthFromCookies();
  if (!auth) return new Response("No autorizado", { status: 401 });

  await connectDB();
  const conversations = await Conversation.find({
    "participants.userId": auth.userId,
  }).select("_id").lean();

  const convIds = conversations.map(c => c._id);
  const unread = await Message.countDocuments({
    conversationId: { $in: convIds },
    senderId: { $ne: auth.userId },
    readAt: null,
  });

  return Response.json({ unread });
}
