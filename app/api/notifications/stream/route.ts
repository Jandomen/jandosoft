import { NextRequest } from "next/server";
import { getAuthFromCookies, getAuthFromHeaders } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Conversation from "@/lib/models/Conversation";
import { messageEvents, MESSAGE_NEW, CONVERSATION_NEW, NOTIFICATION_NEW, type SSEEvent } from "@/lib/messaging/events";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = getAuthFromHeaders(req) || await getAuthFromCookies();
  if (!auth) return new Response("No autorizado", { status: 401 });

  await connectDB();
  const userConversations = await Conversation.find({
    "participants.userId": auth.userId,
  }).select("_id").lean();

  const convIds = userConversations.map(c => c._id.toString());
  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    start(controller) {
      let heartbeat: ReturnType<typeof setInterval> | null = null;
      let closeTimer: ReturnType<typeof setTimeout> | null = null;

      const cleanup = () => {
        if (closed) return;
        closed = true;
        if (heartbeat) clearInterval(heartbeat);
        if (closeTimer) clearTimeout(closeTimer);
        convIds.forEach((cid) => {
          messageEvents.off(`${MESSAGE_NEW}:${cid}`, handler);
        });
        messageEvents.off(CONVERSATION_NEW, handler);
        messageEvents.off(NOTIFICATION_NEW, notificationHandler);
        try { controller.close(); } catch {}
      };

      const handler = (event: SSEEvent) => {
        if (closed) return;
        try {
          const data = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(data));
        } catch {}
      };

      const notificationHandler = (event: SSEEvent) => {
        if (closed) return;
        if (event.payload?.userId === auth.userId) {
          try {
            const data = `data: ${JSON.stringify(event)}\n\n`;
            controller.enqueue(encoder.encode(data));
          } catch {}
        }
      };

      convIds.forEach((cid) => {
        messageEvents.on(`${MESSAGE_NEW}:${cid}`, handler);
      });
      messageEvents.on(CONVERSATION_NEW, handler);
      messageEvents.on(NOTIFICATION_NEW, notificationHandler);

      // Heartbeat cada 15s para keep-alive en Vercel
      heartbeat = setInterval(() => {
        if (closed) return;
        try { controller.enqueue(encoder.encode(": heartbeat\n\n")); } catch {}
      }, 15000);

      // Cierra graciosamente a los 25s antes del timeout 30s de Vercel → evita 504
      closeTimer = setTimeout(() => {
        cleanup();
      }, 25000);

      req.signal.addEventListener("abort", cleanup);
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
