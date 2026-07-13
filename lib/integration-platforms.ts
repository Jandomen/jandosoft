export const PLATFORM_INFO: Record<string, { label: string; icon: string; fields: { key: string; label: string; placeholder: string; secret?: boolean }[]; docs?: string }> = {
  telegram: {
    label: "Telegram",
    icon: "Send",
    fields: [
      { key: "botToken", label: "Token del Bot", placeholder: "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11", secret: true },
      { key: "chatId", label: "Chat ID", placeholder: "-1001234567890" },
    ],
    docs: "https://core.telegram.org/bots/tutorial",
  },
  discord: {
    label: "Discord",
    icon: "MessageSquare",
    fields: [
      { key: "webhookUrl", label: "Webhook URL", placeholder: "https://discord.com/api/webhooks/...", secret: true },
    ],
    docs: "https://support.discord.com/hc/en-us/articles/228383668",
  },
  slack: {
    label: "Slack",
    icon: "MessageCircle",
    fields: [
      { key: "webhookUrl", label: "Webhook URL", placeholder: "https://hooks.slack.com/services/...", secret: true },
    ],
    docs: "https://api.slack.com/messaging/webhooks",
  },
  twilio: {
    label: "Twilio (SMS)",
    icon: "Smartphone",
    fields: [
      { key: "accountSid", label: "Account SID", placeholder: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", secret: true },
      { key: "authToken", label: "Auth Token", placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", secret: true },
      { key: "phoneNumber", label: "Número de teléfono", placeholder: "+1234567890" },
    ],
    docs: "https://www.twilio.com/docs/sms",
  },
  whatsapp: {
    label: "WhatsApp (Twilio)",
    icon: "MessageCircle",
    fields: [
      { key: "accountSid", label: "Account SID", placeholder: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", secret: true },
      { key: "authToken", label: "Auth Token", placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", secret: true },
      { key: "phoneNumber", label: "Número de WhatsApp", placeholder: "+1234567890" },
    ],
    docs: "https://www.twilio.com/docs/whatsapp",
  },
  whatsapp_business: {
    label: "WhatsApp Business API (Meta)",
    icon: "MessageCircle",
    fields: [
      { key: "phoneNumberId", label: "Phone Number ID", placeholder: "123456789012345", secret: false },
      { key: "accessToken", label: "Access Token (permanente)", placeholder: "EAAx...", secret: true },
      { key: "businessAccountId", label: "WhatsApp Business Account ID", placeholder: "123456789012345", secret: false },
    ],
    docs: "https://developers.facebook.com/docs/whatsapp/cloud-api",
  },
  instagram: {
    label: "Instagram (Meta)",
    icon: "Camera",
    fields: [
      { key: "instagramBusinessId", label: "ID de cuenta de Instagram Business", placeholder: "123456789012345", secret: false },
      { key: "accessToken", label: "Access Token (Meta)", placeholder: "EAAx...", secret: true },
      { key: "pageId", label: "Facebook Page ID (vinculada)", placeholder: "123456789012345", secret: false },
    ],
    docs: "https://developers.facebook.com/docs/instagram-api",
  },
  facebook: {
    label: "Facebook (Meta)",
    icon: "Globe",
    fields: [
      { key: "pageId", label: "Facebook Page ID", placeholder: "123456789012345", secret: false },
      { key: "accessToken", label: "Access Token (Meta)", placeholder: "EAAx...", secret: true },
    ],
    docs: "https://developers.facebook.com/docs/pages/publishing",
  },
  twitter: {
    label: "Twitter / X",
    icon: "Hash",
    fields: [
      { key: "bearerToken", label: "Bearer Token", placeholder: "AAAAAAAAAAAAAAAAAAAAA...", secret: true },
      { key: "apiKey", label: "API Key", placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxx", secret: true },
      { key: "apiSecret", label: "API Secret", placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxx", secret: true },
      { key: "accessToken", label: "Access Token", placeholder: "1234567890-xxxxxxxxx", secret: true },
      { key: "accessTokenSecret", label: "Access Token Secret", placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxx", secret: true },
    ],
    docs: "https://developer.twitter.com/en/docs/twitter-api",
  },
  threads: {
    label: "Threads (Meta)",
    icon: "MessageCircle",
    fields: [
      { key: "threadsUserId", label: "Threads User ID", placeholder: "123456789012345", secret: false },
      { key: "accessToken", label: "Access Token (Meta)", placeholder: "EAAx...", secret: true },
      { key: "instagramBusinessId", label: "Instagram Business ID (vinculado)", placeholder: "123456789012345", secret: false },
    ],
    docs: "https://developers.facebook.com/docs/threads",
  },
  youtube: {
    label: "YouTube (Google)",
    icon: "Play",
    fields: [
      { key: "apiKey", label: "API Key (Google Cloud)", placeholder: "AIzaSy...", secret: true },
      { key: "channelId", label: "Channel ID", placeholder: "UC...", secret: false },
    ],
    docs: "https://developers.google.com/youtube/v3",
  },
  google_maps: {
    label: "Google Maps",
    icon: "MapPin",
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "AIzaSy...", secret: true },
    ],
    docs: "https://console.cloud.google.com/google/maps-apis",
  },
  mapbox: {
    label: "Mapbox",
    icon: "Map",
    fields: [
      { key: "accessToken", label: "Access Token", placeholder: "pk.eyJ1Ijoi...", secret: true },
    ],
    docs: "https://account.mapbox.com/access-tokens/",
  },
  gmail: {
    label: "Gmail (Google)",
    icon: "Mail",
    fields: [
      { key: "clientId", label: "Client ID (OAuth 2.0)", placeholder: "1234567890-xxxxx.apps.googleusercontent.com", secret: true },
      { key: "clientSecret", label: "Client Secret", placeholder: "GOCSPX-...", secret: true },
      { key: "refreshToken", label: "Refresh Token", placeholder: "1//0g...", secret: true },
      { key: "emailAddress", label: "Email Address", placeholder: "tuempresa@gmail.com", secret: false },
    ],
    docs: "https://developers.google.com/gmail/api",
  },
  messenger: {
    label: "Messenger (Meta)",
    icon: "MessageCircle",
    fields: [
      { key: "pageId", label: "Facebook Page ID", placeholder: "123456789012345", secret: false },
      { key: "accessToken", label: "Page Access Token", placeholder: "EAAx...", secret: true },
    ],
    docs: "https://developers.facebook.com/docs/messenger-platform",
  },
  tiktok: {
    label: "TikTok",
    icon: "Music",
    fields: [
      { key: "accessToken", label: "Access Token", placeholder: "clt.xxxxx...", secret: true },
      { key: "openId", label: "Open ID (TikTok user ID)", placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", secret: false },
    ],
    docs: "https://developers.tiktok.com/",
  },
};
