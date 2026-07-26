import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { WhatsAppMessage } from "@/lib/models/WhatsAppMessage";
import { WhatsAppConversation } from "@/lib/models/WhatsAppConversation";
import { getWhatsAppAccountByWabaId, getWhatsAppAccountByPhoneNumberId, upsertConversation } from "@/lib/whatsapp-middleware";
import { emitWhatsAppEvent } from "@/lib/socket-server";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "jandosoft-wa-verify-2026";
const APP_SECRET = process.env.META_APP_SECRET || "";
const MAX_AI_INPUT_LENGTH = 2000;

function verifySignature(rawBody: string, signature: string | null): boolean {
  if (!APP_SECRET || !signature) return !APP_SECRET;
  const expected = "sha256=" + crypto.createHmac("sha256", APP_SECRET).update(rawBody).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new NextResponse(challenge || "", { status: 200 });
  }
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-hub-signature-256");

    if (APP_SECRET && !verifySignature(rawBody, signature)) {
      console.warn("[WA Webhook] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    if (!body.object || body.object !== "whatsapp_business_account") {
      return NextResponse.json({ received: true });
    }

    const entries = body.entry || [];
    if (entries.length === 0) return NextResponse.json({ received: true });

    await connectDB();

    for (const entry of entries) {
      const wabaId = entry.id;
      const changes = entry.changes || [];
      for (const change of changes) {
        if (change.field === "messages") {
          await processMessages(wabaId, change.value);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("[WA Webhook] Error:", error?.message || error);
    return NextResponse.json({ received: true });
  }
}

async function processMessages(wabaId: string, value: any) {
  const phoneNumberId = value.metadata?.phone_number_id;
  const contacts = value.contacts || [];
  const messages = value.messages || [];
  const statuses = value.statuses || [];

  const account = await getWhatsAppAccountByWabaId(wabaId, phoneNumberId)
    || await getWhatsAppAccountByPhoneNumberId(phoneNumberId);

  if (!account) {
    console.log("[WA Webhook] No account found for WABA:", wabaId);
    return;
  }

  const storeId = account.storeId.toString();

  for (const msg of messages) {
    if (msg.context && msg.context.from === phoneNumberId) {
      continue;
    }

    const contact = contacts.find((c: any) => c.wa_id === msg.from);
    const type = msg.type || "unknown";
    let body = "";
    let mediaUrl = "";
    let caption = "";

    switch (type) {
      case "text": body = msg.text?.body || ""; break;
      case "image": mediaUrl = msg.image?.id || ""; caption = msg.image?.caption || ""; body = "[Imagen]"; break;
      case "audio": mediaUrl = msg.audio?.id || ""; body = "[Audio]"; break;
      case "video": mediaUrl = msg.video?.id || ""; caption = msg.video?.caption || ""; body = "[Video]"; break;
      case "document": mediaUrl = msg.document?.id || ""; body = msg.document?.filename || "[Documento]"; break;
      case "location": body = `[Ubicacion: ${msg.location?.latitude}, ${msg.location?.longitude}]`; break;
      case "interactive": body = msg.interactive?.button_reply?.title || msg.interactive?.list_reply?.title || JSON.stringify(msg.interactive); break;
      case "reaction": body = msg.reaction?.emoji || ""; break;
      default: body = JSON.stringify(msg);
    }

    const customerName = contact?.profile?.name || "";
    const customerPhone = contact?.wa_id || msg.from;
    const waId = contact?.wa_id || msg.from;

    const conversationId = await upsertConversation(
      storeId, account._id.toString(), waId, customerName, customerPhone, body, "incoming"
    );

    try {
      await WhatsAppMessage.findOneAndUpdate(
        { messageId: msg.id },
        {
          storeId,
          accountId: account._id,
          conversationId,
          direction: "incoming",
          from: msg.from,
          to: phoneNumberId || "",
          messageId: msg.id,
          waId,
          type,
          body,
          mediaUrl,
          caption,
          status: "received",
          rawPayload: msg,
        },
        { upsert: true, new: true }
      );

      emitWhatsAppEvent(storeId, "new-whatsapp-message", {
        storeId,
        conversationId,
        waId,
        customerName,
        body,
        type,
        direction: "incoming",
      });
    } catch (e: any) {
      console.error("[WA Webhook] Error saving message:", e?.message);
    }

    const conversation = await WhatsAppConversation.findById(conversationId).lean();
    if (conversation?.aiAutoReply && body && type === "text" && !body.startsWith("[")) {
      const truncatedBody = body.slice(0, MAX_AI_INPUT_LENGTH);
      triggerAIReply(storeId, account._id.toString(), conversationId, waId, truncatedBody, customerName).catch(err =>
        console.error("[WA Webhook] AI reply error:", err?.message)
      );
    }
  }

  for (const status of statuses) {
    try {
      const updateData: any = { status: status.status };
      if (status.status === "failed" && status.errors?.length) {
        updateData.errorMessage = status.errors.map((e: any) => e.message).join(", ");
      }
      await WhatsAppMessage.findOneAndUpdate(
        { $or: [{ messageId: status.id }, { providerMessageId: status.id }] },
        updateData,
        { new: true }
      );
    } catch (e: any) {
      console.error("[WA Webhook] Error updating status:", e?.message);
    }
  }
}

async function triggerAIReply(
  storeId: string,
  accountId: string,
  conversationId: string,
  waId: string,
  incomingMessage: string,
  customerName: string
) {
  try {
    const { Store } = await import("@/lib/models/Store");
    const { WhatsAppAccount } = await import("@/lib/models/WhatsAppAccount");
    const { sendWhatsAppMessage, incrementDailyCounter } = await import("@/lib/whatsapp-middleware");

    const store = await Store.findById(storeId).lean().select("aiProvider agentConfig name").catch(() => null);
    if (!store) return;

    const aiProvider = (store as any).aiProvider;
    const agentConfig = (store as any).agentConfig;

    let replyText = "";

    if (aiProvider?.enabled && aiProvider.apiKey && aiProvider.baseUrl) {
      try {
        const systemPrompt = agentConfig?.systemPrompt || `Eres el asistente virtual de ${(store as any).name || "la empresa"}. Responde de forma amable, profesional y concisa en español. Ayuda al cliente con sus consultas.`;

        const aiRes = await fetch(`${aiProvider.baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${aiProvider.apiKey}`,
          },
          body: JSON.stringify({
            model: aiProvider.model || "gpt-4o-mini",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: `${customerName ? `El cliente ${customerName} dice: ` : ""}${incomingMessage}` },
            ],
            max_tokens: 300,
            temperature: 0.7,
          }),
        });

        const aiData = await aiRes.json();
        replyText = aiData.choices?.[0]?.message?.content || "";
      } catch (aiErr: any) {
        console.error("[WA AI] Provider error:", aiErr?.message);
      }
    }

    if (!replyText) {
      const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
      if (OPENROUTER_KEY) {
        try {
          const systemPrompt = agentConfig?.systemPrompt || `Eres el asistente virtual de ${(store as any).name || "la empresa"}. Responde de forma amable, profesional y concisa en español.`;

          const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${OPENROUTER_KEY}`,
            },
            body: JSON.stringify({
              model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `${customerName ? `El cliente ${customerName} dice: ` : ""}${incomingMessage}` },
              ],
              max_tokens: 300,
              temperature: 0.7,
            }),
          });

          const aiData = await aiRes.json();
          replyText = aiData.choices?.[0]?.message?.content || "";
        } catch (aiErr: any) {
          console.error("[WA AI] OpenRouter error:", aiErr?.message);
        }
      }
    }

    if (!replyText) return;

    const accountDoc = await WhatsAppAccount.findById(accountId).lean();
    if (!accountDoc) return;

    const result = await sendWhatsAppMessage(accountDoc, waId, {
      type: "text",
      text: { body: replyText },
    });

    if (result.success) {
      await incrementDailyCounter(accountId);
      const cleanWaId = waId.replace(/[^0-9]/g, "");
      await WhatsAppMessage.create({
        storeId,
        accountId,
        conversationId,
        direction: "outgoing",
        from: accountDoc.phoneNumberId,
        to: cleanWaId,
        messageId: result.messageId || `ai_${Date.now()}`,
        waId: cleanWaId,
        type: "text",
        body: replyText,
        status: "sent",
        providerMessageId: result.messageId,
      });

      await WhatsAppConversation.findByIdAndUpdate(conversationId, {
        lastMessageAt: new Date(),
        lastMessagePreview: replyText.slice(0, 100),
      });

      emitWhatsAppEvent(storeId, "new-whatsapp-message", {
        storeId,
        conversationId,
        waId,
        body: replyText,
        type: "text",
        direction: "outgoing",
        customerName,
      });
    }
  } catch (error: any) {
    console.error("[WA AI] Error:", error?.message);
  }
}
