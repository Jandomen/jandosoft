import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Integration } from "@/lib/models/Integration";
import { WhatsAppMessage } from "@/lib/models/WhatsAppMessage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "jandosoft-wa-verify-2026";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("[WA Webhook] Verified successfully");
    return new NextResponse(challenge || "", { status: 200 });
  }

  console.warn("[WA Webhook] Verification failed", { mode, token });
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

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
        } else if (change.field === "message_template_status_update") {
          await processTemplateStatus(wabaId, change.value);
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

  // Find store by WABA ID or phone number ID
  const integration = await Integration.findOne({
    platform: "whatsapp_business",
    enabled: true,
    $or: [
      { "credentials.businessAccountId": wabaId },
      { "credentials.phoneNumberId": phoneNumberId },
    ],
  });

  if (!integration) {
    console.log("[WA Webhook] No integration found for WABA:", wabaId);
    return;
  }

  const storeId = integration.storeId;

  // Process incoming messages
  for (const msg of messages) {
    const contact = contacts.find((c: any) => c.wa_id === msg.from);
    const type = msg.type || "unknown";
    let body = "";
    let mediaUrl = "";
    let caption = "";

    switch (type) {
      case "text":
        body = msg.text?.body || "";
        break;
      case "image":
        mediaUrl = msg.image?.id || "";
        caption = msg.image?.caption || "";
        body = "[Imagen]";
        break;
      case "audio":
        mediaUrl = msg.audio?.id || "";
        body = "[Audio]";
        break;
      case "video":
        mediaUrl = msg.video?.id || "";
        caption = msg.video?.caption || "";
        body = "[Video]";
        break;
      case "document":
        mediaUrl = msg.document?.id || "";
        caption = msg.document?.caption || "";
        body = msg.document?.filename || "[Documento]";
        break;
      case "location":
        body = `[Ubicación: ${msg.location?.latitude}, ${msg.location?.longitude}]`;
        break;
      case "interactive":
        body = msg.interactive?.button_reply?.title || msg.interactive?.list_reply?.title || JSON.stringify(msg.interactive);
        break;
      case "reaction":
        body = msg.reaction?.emoji || "";
        break;
      default:
        body = JSON.stringify(msg);
    }

    try {
      await WhatsAppMessage.findOneAndUpdate(
        { messageId: msg.id },
        {
          storeId,
          direction: "incoming",
          from: msg.from,
          to: phoneNumberId || "",
          messageId: msg.id,
          waId: contact?.wa_id || msg.from,
          type,
          body,
          mediaUrl,
          caption,
          status: "received",
          rawPayload: msg,
        },
        { upsert: true, new: true }
      );
      console.log(`[WA Webhook] Message saved: ${msg.id} from ${msg.from}`);
    } catch (e: any) {
      console.error("[WA Webhook] Error saving message:", e?.message);
    }
  }

  // Process status updates
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
      console.log(`[WA Webhook] Status update: ${status.id} -> ${status.status}`);
    } catch (e: any) {
      console.error("[WA Webhook] Error updating status:", e?.message);
    }
  }
}

async function processTemplateStatus(wabaId: string, value: any) {
  console.log("[WA Webhook] Template status:", JSON.stringify(value));
}
