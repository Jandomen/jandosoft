import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { WhatsAppMessage } from "@/lib/models/WhatsAppMessage";
import { getAuthFromHeaders } from "@/lib/auth";
import { validateWhatsAppSend, incrementDailyCounter, sendWhatsAppMessage, upsertConversation } from "@/lib/whatsapp-middleware";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthFromHeaders(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await req.json();
    const { storeId, accountId, to, message, type = "text", mediaUrl } = body;

    if (!storeId || !to || !message) {
      return NextResponse.json({ error: "storeId, to y message son requeridos" }, { status: 400 });
    }

    await connectDB();

    const permission = await validateWhatsAppSend(storeId, accountId);
    if (!permission.allowed) {
      return NextResponse.json({ error: permission.error, code: permission.code }, { status: 403 });
    }

    if (!permission.account) {
      return NextResponse.json({ error: "No se encontro la cuenta de WhatsApp" }, { status: 404 });
    }

    const account = permission.account;
    const dailyRemaining = permission.dailyRemaining!;

    let payload: any = {};
    if (type === "image" && mediaUrl) {
      payload.type = "image";
      payload.image = { link: mediaUrl, caption: message || "" };
    } else if (type === "document" && mediaUrl) {
      payload.type = "document";
      payload.document = { link: mediaUrl, caption: message || "", filename: "documento" };
    } else {
      payload.type = "text";
      payload.text = { body: message };
    }

    const result = await sendWhatsAppMessage(account, to, payload);
    const cleanTo = to.replace(/[^0-9]/g, "");

    if (!result.success) {
      await WhatsAppMessage.create({
        storeId, accountId: account._id, direction: "outgoing", from: account.phoneNumberId,
        to: cleanTo, messageId: `out_${Date.now()}`, waId: cleanTo, type, body: message, status: "failed",
        errorMessage: result.error,
      });
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    await incrementDailyCounter(account._id.toString());

    const conversationId = await upsertConversation(
      storeId, account._id.toString(), cleanTo, "", cleanTo, message, "outgoing"
    );

    await WhatsAppMessage.create({
      storeId, accountId: account._id, conversationId, direction: "outgoing",
      from: account.phoneNumberId, to: cleanTo,
      messageId: result.messageId || `out_${Date.now()}`, waId: cleanTo,
      type, body: message, status: "sent", providerMessageId: result.messageId,
    });

    return NextResponse.json({ success: true, messageId: result.messageId, dailyRemaining: dailyRemaining - 1 });
  } catch (error: any) {
    console.error("[WA Send] Error:", error?.message || error);
    return NextResponse.json({ error: "Error interno al enviar mensaje" }, { status: 500 });
  }
}
