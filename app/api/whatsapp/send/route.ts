import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Integration } from "@/lib/models/Integration";
import { WhatsAppMessage } from "@/lib/models/WhatsAppMessage";
import { getAuthFromHeaders } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthFromHeaders(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await req.json();
    const { storeId, to, message, type = "text", templateName, templateParams, mediaUrl } = body;

    if (!storeId || !to || (!message && !templateName)) {
      return NextResponse.json({ error: "storeId, to y message (o templateName) son requeridos" }, { status: 400 });
    }

    await connectDB();

    const integration = await Integration.findOne({
      storeId,
      platform: "whatsapp_business",
      enabled: true,
    });

    if (!integration) {
      return NextResponse.json({ error: "WhatsApp Business no está configurado o habilitado para esta tienda" }, { status: 400 });
    }

    const { phoneNumberId, accessToken } = integration.credentials;
    if (!phoneNumberId || !accessToken) {
      return NextResponse.json({ error: "Faltan credenciales de WhatsApp Business (phoneNumberId o accessToken)" }, { status: 400 });
    }

    // Build WhatsApp API payload
    let payload: any = {
      messaging_product: "whatsapp",
      to: to.replace(/[^0-9]/g, ""),
      recipient_type: "individual",
    };

    if (templateName) {
      payload.type = "template";
      payload.template = {
        name: templateName,
        language: { code: "es" },
      };
      if (templateParams && templateParams.length > 0) {
        payload.template.components = [
          {
            type: "body",
            parameters: templateParams.map((p: string) => ({ type: "text", text: p })),
          },
        ];
      }
    } else if (type === "text" || !type) {
      payload.type = "text";
      payload.text = { body: message };
    } else if (type === "image" && mediaUrl) {
      payload.type = "image";
      payload.image = { link: mediaUrl, caption: message || "" };
    } else if (type === "document" && mediaUrl) {
      payload.type = "document";
      payload.document = { link: mediaUrl, caption: message || "", filename: "documento" };
    } else {
      payload.type = "text";
      payload.text = { body: message };
    }

    // Send via WhatsApp Cloud API
    const res = await fetch(`https://graph.facebook.com/v22.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      const errMsg = data.error?.message || `HTTP ${res.status}`;
      console.error("[WA Send] Error:", errMsg);

      // Log failed outgoing message
      await WhatsAppMessage.create({
        storeId,
        direction: "outgoing",
        from: phoneNumberId,
        to: to.replace(/[^0-9]/g, ""),
        messageId: `out_${Date.now()}`,
        waId: to.replace(/[^0-9]/g, ""),
        type: templateName ? "template" : "text",
        body: message || templateName || "",
        templateName,
        templateParams,
        status: "failed",
        errorMessage: errMsg,
        rawPayload: data,
      });

      return NextResponse.json({ error: errMsg }, { status: 500 });
    }

    // Log successful outgoing message
    const waMessage = data.messages?.[0];
    if (waMessage) {
      await WhatsAppMessage.create({
        storeId,
        direction: "outgoing",
        from: phoneNumberId,
        to: to.replace(/[^0-9]/g, ""),
        messageId: waMessage.id,
        waId: to.replace(/[^0-9]/g, ""),
        type: templateName ? "template" : "text",
        body: message || templateName || "",
        templateName,
        templateParams,
        status: "sent",
        providerMessageId: waMessage.id,
        rawPayload: data,
      });
    }

    return NextResponse.json({
      success: true,
      messageId: waMessage?.id,
      contacts: data.contacts,
    });
  } catch (error: any) {
    console.error("[WA Send] Error:", error?.message || error);
    return NextResponse.json({ error: "Error interno al enviar mensaje" }, { status: 500 });
  }
}
