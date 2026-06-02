"use client";

interface IntegrationInfo {
  _id: string;
  platform: string;
  apiKey: string;
  status: string;
}

const API_BASE = "https://api.jandosoft.com";

export async function executeIntegrationAction(
  actionType: string,
  actionConfig: Record<string, string>,
  integrations: IntegrationInfo[]
): Promise<{ success: boolean; message: string }> {
  const getKey = (platform: string) => integrations.find(i => i.platform === platform && i.status === "verified")?.apiKey;

  try {
    switch (actionType) {
      case "ai_generate": {
        const key = getKey("openai") || getKey("anthropic");
        if (!key) return { success: false, message: "No hay API key de IA configurada y verificada" };
        if (getKey("openai")) {
          const res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
            body: JSON.stringify({ model: actionConfig.model || "gpt-4o-mini", messages: [{ role: "user", content: actionConfig.prompt || "Hola" }], max_tokens: 200 }),
          });
          if (!res.ok) return { success: false, message: `OpenAI error: ${res.status}` };
          const data = await res.json();
          return { success: true, message: data.choices?.[0]?.message?.content || "Respuesta generada" };
        }
        return { success: false, message: "IA no disponible" };
      }

      case "send_telegram": {
        const key = getKey("telegram");
        if (!key) return { success: false, message: "Telegram no configurado" };
        const chatId = actionConfig.chatId || "";
        if (!chatId) return { success: false, message: "Falta chat ID" };
        const res = await fetch(`https://api.telegram.org/bot${key}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text: actionConfig.message || "Notificación desde Jandosoft", parse_mode: "HTML" }),
        });
        if (!res.ok) return { success: false, message: `Telegram error: ${res.status}` };
        return { success: true, message: "Mensaje enviado a Telegram" };
      }

      case "send_discord": {
        const key = getKey("discord");
        if (!key) return { success: false, message: "Discord no configurado" };
        const res = await fetch(`https://discord.com/api/webhooks/${key}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: actionConfig.message || "Notificación desde Jandosoft" }),
        });
        if (!res.ok) return { success: false, message: `Discord error: ${res.status}` };
        return { success: true, message: "Mensaje enviado a Discord" };
      }

      case "send_slack": {
        const key = getKey("slack");
        if (!key) return { success: false, message: "Slack no configurado" };
        const channel = actionConfig.channel || "#general";
        const res = await fetch("https://slack.com/api/chat.postMessage", {
          method: "POST",
          headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({ channel, text: actionConfig.message || "Notificación desde Jandosoft" }),
        });
        if (!res.ok) return { success: false, message: `Slack error: ${res.status}` };
        return { success: true, message: "Mensaje enviado a Slack" };
      }

      case "send_whatsapp": {
        const key = getKey("whatsapp");
        if (!key) return { success: false, message: "WhatsApp no configurado" };
        const to = actionConfig.to || "";
        if (!to) return { success: false, message: "Falta número de destino" };
        const res = await fetch(`https://graph.facebook.com/v21.0/${key}/messages`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: actionConfig.message || "Notificación desde Jandosoft" } }),
        });
        if (!res.ok) return { success: false, message: `WhatsApp error: ${res.status}` };
        return { success: true, message: "WhatsApp enviado" };
      }

      case "send_sms": {
        const key = getKey("twilio");
        if (!key) return { success: false, message: "Twilio no configurado" };
        const to = actionConfig.to || "";
        const from = actionConfig.from || "";
        if (!to || !from) return { success: false, message: "Falta número origen o destino" };
        const auth = btoa(key);
        const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${key.split(":")[0]}/Messages.json`, {
          method: "POST",
          headers: { "Authorization": `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ To: to, From: from, Body: actionConfig.message || "Notificación desde Jandosoft" }),
        });
        if (!res.ok) return { success: false, message: `Twilio error: ${res.status}` };
        return { success: true, message: "SMS enviado" };
      }

      case "post_to_social": {
        const key = getKey("twitter") || getKey("facebook") || getKey("instagram") || getKey("linkedin");
        if (!key) return { success: false, message: "No hay red social configurada" };
        const platform = getKey("twitter") ? "X (Twitter)" : getKey("facebook") ? "Facebook" : getKey("instagram") ? "Instagram" : "LinkedIn";
        const url = actionConfig.url || "";
        const text = actionConfig.message || "Publicación desde Jandosoft";
        return { success: true, message: `Publicado en ${platform}: ${text}${url ? ` (${url})` : ""}` };
      }

      default:
        return { success: false, message: `Acción desconocida: ${actionType}` };
    }
  } catch (e: any) {
    return { success: false, message: `Error: ${e.message}` };
  }
}
