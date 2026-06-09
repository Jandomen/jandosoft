import { NextRequest } from "next/server";
import { getAuthFromCookies, getAuthFromHeaders } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Conversation from "@/lib/models/Conversation";
import { messageEvents, MESSAGE_NEW, MESSAGE_READ, CONVERSATION_NEW, type SSEEvent } from "@/lib/messaging/events";

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

  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    start(controller) {
      const handler = (event: SSEEvent) => {
        if (closed) return;
        try {
          const data = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(data));
        } catch {}
      };

      const myConvEvent = `${MESSAGE_NEW}:${id}`;
      messageEvents.on(myConvEvent, handler);
      messageEvents.on(CONVERSATION_NEW, handler);
      messageEvents.on(`${MESSAGE_READ}:${id}`, handler);

      req.signal.addEventListener("abort", () => {
        closed = true;
        messageEvents.off(myConvEvent, handler);
        messageEvents.off(CONVERSATION_NEW, handler);
        messageEvents.off(`${MESSAGE_READ}:${id}`, handler);
        try { controller.close(); } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
