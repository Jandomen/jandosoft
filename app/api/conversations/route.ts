import { NextRequest, NextResponse } from "next/server";
import { getAuthFromCookies } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Conversation from "@/lib/models/Conversation";
import { User } from "@/lib/models/User";
import { messageEvents, CONVERSATION_NEW, type SSEEvent } from "@/lib/messaging/events";

export async function GET() {
  const auth = await getAuthFromCookies();
  if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  await connectDB();
  const convos = await Conversation.find({
    "participants.userId": auth.userId,
  })
    .sort({ updatedAt: -1 })
    .lean();

  return NextResponse.json({ conversations: convos });
}

export async function POST(req: NextRequest) {
  const auth = await getAuthFromCookies();
  if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { participantEmail, participantId } = await req.json();
  if (!participantEmail && !participantId) {
    return NextResponse.json({ error: "Se requiere email o userId del participante" }, { status: 400 });
  }

  await connectDB();

  const targetUser = participantId
    ? await User.findById(participantId)
    : await User.findOne({ email: participantEmail });

  if (!targetUser) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  if (targetUser._id.toString() === auth.userId.toString()) {
    return NextResponse.json({ error: "No puedes crear conversación contigo mismo" }, { status: 400 });
  }

  // Check if conversation already exists between these two users
  const existing = await Conversation.findOne({
    $and: [
      { "participants.userId": auth.userId },
      { "participants.userId": targetUser._id },
    ],
  });

  if (existing) {
    return NextResponse.json({ conversation: existing, created: false });
  }

  const conversation = await Conversation.create({
    participants: [
      { userId: auth.userId, email: auth.email, name: auth.email.split("@")[0] },
      { userId: targetUser._id, email: targetUser.email, name: targetUser.name || targetUser.email.split("@")[0] },
    ],
  });

  const event: SSEEvent = {
    type: CONVERSATION_NEW,
    payload: { conversationId: conversation._id, participants: conversation.participants },
    timestamp: Date.now(),
  };
  messageEvents.emit(CONVERSATION_NEW, event);

  return NextResponse.json({ conversation, created: true });
}
