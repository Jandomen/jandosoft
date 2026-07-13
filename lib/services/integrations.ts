import { connectDB } from "@/lib/mongodb";
import { Integration, IIntegration } from "@/lib/models/Integration";

type IntegrationData = {
  platform: string;
  credentials: Record<string, string>;
  enabled?: boolean;
};

export async function getIntegration(storeId: string, platform: string): Promise<IIntegration | null> {
  await connectDB();
  return Integration.findOne({ storeId, platform }).lean();
}

export async function getIntegrations(storeId: string): Promise<IIntegration[]> {
  await connectDB();
  return Integration.find({ storeId }).lean();
}

export async function setIntegration(storeId: string, data: IntegrationData): Promise<IIntegration> {
  await connectDB();
  return Integration.findOneAndUpdate(
    { storeId, platform: data.platform },
    { $set: { credentials: data.credentials, enabled: data.enabled ?? false } },
    { upsert: true, new: true },
  );
}

export async function deleteIntegration(storeId: string, platform: string): Promise<void> {
  await connectDB();
  await Integration.findOneAndDelete({ storeId, platform });
}

export async function testTelegram(botToken: string, chatId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: "✅ Conexión exitosa con Jandosoft!" }),
    });
    const data = await res.json();
    if (!data.ok) return { success: false, error: data.description || "Error desconocido" };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function testDiscord(webhookUrl: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "✅ Conexión exitosa con Jandosoft!" }),
    });
    if (!res.ok) return { success: false, error: `HTTP ${res.status}: ${await res.text()}` };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function testSlack(webhookUrl: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "✅ Conexión exitosa con Jandosoft!" }),
    });
    if (!res.ok) return { success: false, error: `HTTP ${res.status}: ${await res.text()}` };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function testTwilio(accountSid: string, authToken: string, from: string, to: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
      },
      body: new URLSearchParams({ From: from, To: to, Body: "✅ Conexión exitosa con Jandosoft!" }),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.message || `HTTP ${res.status}` };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function testWhatsApp(accountSid: string, authToken: string, from: string, to: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
      },
      body: new URLSearchParams({ From: `whatsapp:${from}`, To: `whatsapp:${to}`, Body: "✅ Conexión exitosa con Jandosoft!" }),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.message || `HTTP ${res.status}` };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function sendTelegram(credentials: Record<string, string>, message: string): Promise<{ success: boolean; error?: string }> {
  try {
    const botToken = credentials.botToken;
    const chatId = credentials.chatId;
    if (!botToken || !chatId) return { success: false, error: "Telegram no configurado: faltan botToken o chatId" };
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message }),
    });
    const data = await res.json();
    if (!data.ok) return { success: false, error: data.description || "Error" };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function sendDiscord(credentials: Record<string, string>, message: string): Promise<{ success: boolean; error?: string }> {
  try {
    const webhookUrl = credentials.webhookUrl;
    if (!webhookUrl) return { success: false, error: "Discord no configurado: falta webhookUrl" };
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message }),
    });
    if (!res.ok) return { success: false, error: `HTTP ${res.status}` };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function sendSlack(credentials: Record<string, string>, message: string): Promise<{ success: boolean; error?: string }> {
  try {
    const webhookUrl = credentials.webhookUrl;
    if (!webhookUrl) return { success: false, error: "Slack no configurado: falta webhookUrl" };
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: message }),
    });
    if (!res.ok) return { success: false, error: `HTTP ${res.status}` };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function sendSMS(credentials: Record<string, string>, to: string, body: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { accountSid, authToken, phoneNumber } = credentials;
    if (!accountSid || !authToken || !phoneNumber) return { success: false, error: "Twilio no configurado" };
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
      },
      body: new URLSearchParams({ From: phoneNumber, To: to, Body: body }),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.message || `HTTP ${res.status}` };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function sendWhatsApp(credentials: Record<string, string>, to: string, body: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { accountSid, authToken, phoneNumber } = credentials;
    if (!accountSid || !authToken || !phoneNumber) return { success: false, error: "WhatsApp no configurado" };
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
      },
      body: new URLSearchParams({ From: `whatsapp:${phoneNumber}`, To: `whatsapp:${to}`, Body: body }),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.message || `HTTP ${res.status}` };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}



export async function testWhatsAppBusiness(phoneNumberId: string, accessToken: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`https://graph.facebook.com/v22.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phoneNumberId,
        type: "text",
        text: { body: "✅ Conexión exitosa con Jandosoft!" },
      }),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error?.message || `HTTP ${res.status}` };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function sendWhatsAppBusiness(credentials: Record<string, string>, to: string, message: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { phoneNumberId, accessToken } = credentials;
    if (!phoneNumberId || !accessToken) return { success: false, error: "WhatsApp Business no configurado" };
    const res = await fetch(`https://graph.facebook.com/v22.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: message },
      }),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error?.message || `HTTP ${res.status}` };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}



export async function testInstagram(instagramBusinessId: string, accessToken: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`https://graph.facebook.com/v22.0/${instagramBusinessId}?fields=id,username&access_token=${accessToken}`);
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error?.message || `HTTP ${res.status}` };
    return { success: true, error: `Cuenta: @${data.username}` };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function postToInstagram(credentials: Record<string, string>, imageUrl: string | null, caption: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { instagramBusinessId, accessToken } = credentials;
    if (!instagramBusinessId || !accessToken) return { success: false, error: "Instagram no configurado" };

    if (imageUrl) {
      const mediaRes = await fetch(`https://graph.facebook.com/v22.0/${instagramBusinessId}/media`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ image_url: imageUrl, caption }),
      });
      const mediaData = await mediaRes.json();
      if (!mediaRes.ok) return { success: false, error: mediaData.error?.message || "Error al crear media" };

      const containerId = mediaData.id;
      const publishRes = await fetch(`https://graph.facebook.com/v22.0/${instagramBusinessId}/media_publish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ creation_id: containerId }),
      });
      const publishData = await publishRes.json();
      if (!publishRes.ok) return { success: false, error: publishData.error?.message || "Error al publicar" };
      return { success: true };
    }

    const res = await fetch(`https://graph.facebook.com/v22.0/${instagramBusinessId}/media`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ caption, media_type: "IMAGE", image_url: "https://via.placeholder.com/1" }),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error?.message || `HTTP ${res.status}` };
    return { success: true, error: "Para publicar en Instagram se necesita una imagen. Usa el campo imageUrl." };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/* ─── Facebook (Meta Graph API) ─── */

export async function testFacebook(pageId: string, accessToken: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`https://graph.facebook.com/v22.0/${pageId}?fields=id,name&access_token=${accessToken}`);
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error?.message || `HTTP ${res.status}` };
    return { success: true, error: `Página: ${data.name}` };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function postToFacebook(credentials: Record<string, string>, message: string, link?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { pageId, accessToken } = credentials;
    if (!pageId || !accessToken) return { success: false, error: "Facebook no configurado" };

    const body: any = { message, access_token: accessToken };
    if (link) body.link = link;

    const res = await fetch(`https://graph.facebook.com/v22.0/${pageId}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error?.message || `HTTP ${res.status}` };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/* ─── Twitter / X API ─── */

export async function testTwitter(bearerToken: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch("https://api.twitter.com/2/users/me", {
      headers: { Authorization: `Bearer ${bearerToken}` },
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.detail || data.title || `HTTP ${res.status}` };
    return { success: true, error: `Usuario: @${data.data?.username}` };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function postToTwitter(credentials: Record<string, string>, text: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { bearerToken } = credentials;
    if (!bearerToken) return { success: false, error: "Twitter no configurado" };

    const res = await fetch("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${bearerToken}`,
      },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.detail || data.title || `HTTP ${res.status}` };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/* ─── Threads (Meta API) ─── */

export async function testThreads(threadsUserId: string, accessToken: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`https://graph.threads.net/v1.0/${threadsUserId}?fields=id,username&access_token=${accessToken}`);
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error?.message || `HTTP ${res.status}` };
    return { success: true, error: `Usuario: ${data.username || data.id}` };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function postToThreads(credentials: Record<string, string>, text: string, linkUrl?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { threadsUserId, accessToken } = credentials;
    if (!threadsUserId || !accessToken) return { success: false, error: "Threads no configurado" };

    const body: any = {
      media_type: "TEXT",
      text,
      access_token: accessToken,
    };
    if (linkUrl) body.link_url = linkUrl;

    const createRes = await fetch(`https://graph.threads.net/v1.0/${threadsUserId}/threads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const createData = await createRes.json();
    if (!createRes.ok) return { success: false, error: createData.error?.message || "Error al crear thread" };

    const containerId = createData.id;
    const publishRes = await fetch(`https://graph.threads.net/v1.0/${threadsUserId}/threads_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creation_id: containerId, access_token: accessToken }),
    });
    const publishData = await publishRes.json();
    if (!publishRes.ok) return { success: false, error: publishData.error?.message || "Error al publicar" };

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/* ─── YouTube (Google API) ─── */

export async function testYouTube(apiKey: string, channelId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${apiKey}`);
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error?.message || `HTTP ${res.status}` };
    const channel = data.items?.[0];
    if (!channel) return { success: false, error: "Canal no encontrado" };
    const stats = channel.statistics || {};
    return { success: true, error: `Canal: ${channel.snippet.title} | Suscriptores: ${stats.subscriberCount} | Videos: ${stats.videoCount}` };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function getYouTubeStats(credentials: Record<string, string>): Promise<{ success: boolean; error?: string; stats?: any }> {
  try {
    const { apiKey, channelId } = credentials;
    if (!apiKey || !channelId) return { success: false, error: "YouTube no configurado" };
    const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${apiKey}`);
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error?.message || `HTTP ${res.status}` };
    const channel = data.items?.[0];
    if (!channel) return { success: false, error: "Canal no encontrado" };
    return { success: true, stats: { title: channel.snippet.title, subscribers: channel.statistics.subscriberCount, views: channel.statistics.viewCount, videos: channel.statistics.videoCount } };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/* ─── Gmail (Google API) ─── */

export async function testGmail(accessToken: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error?.message || `HTTP ${res.status}` };
    return { success: true, error: `Email: ${data.emailAddress}` };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function sendGmail(credentials: Record<string, string>, to: string, subject: string, body: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { accessToken, emailAddress } = credentials;
    if (!accessToken || !emailAddress) return { success: false, error: "Gmail no configurado" };

    const utf8Bytes = new TextEncoder().encode(
      `From: ${emailAddress}\r\nTo: ${to}\r\nSubject: ${subject}\r\nMIME-Version: 1.0\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n${body}`
    );
    const base64Encoded = btoa(String.fromCharCode(...utf8Bytes));

    const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ raw: base64Encoded }),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error?.message || `HTTP ${res.status}` };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/* ─── Messenger (Meta) ─── */

export async function testMessenger(pageId: string, accessToken: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`https://graph.facebook.com/v22.0/me?fields=id,name&access_token=${accessToken}`);
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error?.message || `HTTP ${res.status}` };
    return { success: true, error: `Página: ${data.name}` };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function sendMessenger(credentials: Record<string, string>, recipientId: string, message: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { pageId, accessToken } = credentials;
    if (!pageId || !accessToken) return { success: false, error: "Messenger no configurado" };

    const res = await fetch(`https://graph.facebook.com/v22.0/me/messages?access_token=${accessToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: recipientId },
        messaging_type: "UPDATE",
        message: { text: message },
      }),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error?.message || `HTTP ${res.status}` };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/* ─── TikTok API ─── */

export async function testTikTok(accessToken: string, openId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`https://open.tiktokapis.com/v2/user/info/?fields=display_name,username`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    if (!res.ok) {
      const errBody = await res.text();
      return { success: false, error: errBody || `HTTP ${res.status}` };
    }
    const user = data.data?.user;
    if (user) return { success: true, error: `Usuario: @${user.username} (${user.display_name})` };
    return { success: false, error: "No se pudo obtener información del usuario" };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function postToTikTok(credentials: Record<string, string>, videoUrl: string, description: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { accessToken, openId } = credentials;
    if (!accessToken || !openId) return { success: false, error: "TikTok no configurado" };

    const initRes = await fetch("https://open.tiktokapis.com/v2/video/init/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        source_info: { source: "PULL_FROM_URL", video_url: videoUrl },
        post_info: {
          privacy_level: "PUBLIC_TO_EVERYONE",
          title: description,
          disable_duet: false,
          disable_stitch: false,
          disable_comment: false,
        },
      }),
    });
    const initData = await initRes.json();
    if (!initRes.ok) return { success: false, error: initData.error?.message || "Error al iniciar subida" };

    return { success: true, error: "Video subido a TikTok. La publicación puede tomar unos minutos." };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function testMapbox(accessToken: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/Mexico.json?access_token=${accessToken}&limit=1`);
    const data = await res.json();
    if (data.features?.length) return { success: true };
    return { success: false, error: data.message || "Token inválido" };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function testGoogleMaps(apiKey: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=Mexico&key=${apiKey}`
    );
    const data = await res.json();
    if (data.status === "OK" || data.status === "ZERO_RESULTS") {
      return { success: true };
    }
    return { success: false, error: data.error_message || `Error: ${data.status}` };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export { PLATFORM_INFO } from "@/lib/integration-platforms";
