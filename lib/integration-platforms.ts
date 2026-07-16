export const PLATFORM_INFO: Record<string, { label: string; icon: string; fields: { key: string; label: string; placeholder: string; secret?: boolean }[]; docs?: string }> = {
  telegram: {
    label: "Telegram",
    icon: "SiTelegram",
    fields: [
      { key: "botToken", label: "Token del Bot", placeholder: "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11", secret: true },
      { key: "chatId", label: "Chat ID", placeholder: "-1001234567890" },
    ],
    docs: "https://core.telegram.org/bots/tutorial",
  },
  discord: {
    label: "Discord",
    icon: "SiDiscord",
    fields: [
      { key: "webhookUrl", label: "Webhook URL", placeholder: "https://discord.com/api/webhooks/...", secret: true },
    ],
    docs: "https://support.discord.com/hc/en-us/articles/228383668",
  },
  slack: {
    label: "Slack",
    icon: "SiSlack",
    fields: [
      { key: "webhookUrl", label: "Webhook URL", placeholder: "https://hooks.slack.com/services/...", secret: true },
    ],
    docs: "https://api.slack.com/messaging/webhooks",
  },
  twilio: {
    label: "Twilio (SMS)",
    icon: "SiTwilio",
    fields: [
      { key: "accountSid", label: "Account SID", placeholder: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", secret: true },
      { key: "authToken", label: "Auth Token", placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", secret: true },
      { key: "phoneNumber", label: "Número de teléfono", placeholder: "+1234567890" },
    ],
    docs: "https://www.twilio.com/docs/sms",
  },
  whatsapp: {
    label: "WhatsApp (Twilio)",
    icon: "SiWhatsapp",
    fields: [
      { key: "accountSid", label: "Account SID", placeholder: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", secret: true },
      { key: "authToken", label: "Auth Token", placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", secret: true },
      { key: "phoneNumber", label: "Número de WhatsApp", placeholder: "+1234567890" },
    ],
    docs: "https://www.twilio.com/docs/whatsapp",
  },
  whatsapp_business: {
    label: "WhatsApp Business API (Meta)",
    icon: "SiWhatsapp",
    fields: [
      { key: "phoneNumberId", label: "Phone Number ID", placeholder: "123456789012345", secret: false },
      { key: "accessToken", label: "Access Token (permanente)", placeholder: "EAAx...", secret: true },
      { key: "businessAccountId", label: "WhatsApp Business Account ID", placeholder: "123456789012345", secret: false },
    ],
    docs: "https://developers.facebook.com/docs/whatsapp/cloud-api",
  },
  instagram: {
    label: "Instagram (Meta)",
    icon: "SiInstagram",
    fields: [
      { key: "instagramBusinessId", label: "ID de cuenta de Instagram Business", placeholder: "123456789012345", secret: false },
      { key: "accessToken", label: "Access Token (Meta)", placeholder: "EAAx...", secret: true },
      { key: "pageId", label: "Facebook Page ID (vinculada)", placeholder: "123456789012345", secret: false },
    ],
    docs: "https://developers.facebook.com/docs/instagram-api",
  },
  facebook: {
    label: "Facebook (Meta)",
    icon: "SiFacebook",
    fields: [
      { key: "pageId", label: "Facebook Page ID", placeholder: "123456789012345", secret: false },
      { key: "accessToken", label: "Access Token (Meta)", placeholder: "EAAx...", secret: true },
    ],
    docs: "https://developers.facebook.com/docs/pages/publishing",
  },
  twitter: {
    label: "Twitter / X",
    icon: "SiX",
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
    icon: "SiThreads",
    fields: [
      { key: "threadsUserId", label: "Threads User ID", placeholder: "123456789012345", secret: false },
      { key: "accessToken", label: "Access Token (Meta)", placeholder: "EAAx...", secret: true },
      { key: "instagramBusinessId", label: "Instagram Business ID (vinculado)", placeholder: "123456789012345", secret: false },
    ],
    docs: "https://developers.facebook.com/docs/threads",
  },
  youtube: {
    label: "YouTube (Google)",
    icon: "SiYoutube",
    fields: [
      { key: "apiKey", label: "API Key (Google Cloud)", placeholder: "AIzaSy...", secret: true },
      { key: "channelId", label: "Channel ID", placeholder: "UC...", secret: false },
    ],
    docs: "https://developers.google.com/youtube/v3",
  },
  google_maps: {
    label: "Google Maps",
    icon: "SiGooglemaps",
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "AIzaSy...", secret: true },
    ],
    docs: "https://console.cloud.google.com/google/maps-apis",
  },
  mapbox: {
    label: "Mapbox",
    icon: "SiMapbox",
    fields: [
      { key: "accessToken", label: "Access Token", placeholder: "pk.eyJ1Ijoi...", secret: true },
    ],
    docs: "https://account.mapbox.com/access-tokens/",
  },
  here_maps: {
    label: "HERE Maps",
    icon: "SiHere",
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "xxxx", secret: true },
    ],
    docs: "https://developer.here.com/documentation/quickstart/api_key.html",
  },
  tomtom: {
    label: "TomTom",
    icon: "SiTomtom",
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "xxxx", secret: true },
    ],
    docs: "https://developer.tomtom.com/user/register",
  },
  foursquare: {
    label: "Foursquare",
    icon: "SiFoursquare",
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "xxxx", secret: true },
    ],
    docs: "https://foursquare.com/developers/signup",
  },
  leaflet: {
    label: "Leaflet (OpenStreetMap)",
    icon: "SiLeaflet",
    fields: [],
    docs: "https://leafletjs.com/",
  },
  apple_maps: {
    label: "Apple Maps",
    icon: "SiApple",
    fields: [
      { key: "mapId", label: "Map ID", placeholder: "xxxx" },
      { key: "teamId", label: "Team ID", placeholder: "xxxx" },
      { key: "keyId", label: "Key ID", placeholder: "xxxx" },
      { key: "privateKey", label: "Private Key (PEM)", placeholder: "-----BEGIN PRIVATE KEY-----", secret: true },
    ],
    docs: "https://developer.apple.com/documentation/mapkitjs",
  },
  gmail: {
    label: "Gmail (Google)",
    icon: "SiGmail",
    fields: [
      { key: "clientId", label: "Client ID (OAuth 2.0)", placeholder: "1234567890-xxxxx.apps.googleusercontent.com", secret: true },
      { key: "clientSecret", label: "Client Secret", placeholder: "GOCSPX-...", secret: true },
      { key: "refreshToken", label: "Refresh Token", placeholder: "1//0g...", secret: true },
      { key: "emailAddress", label: "Email Address", placeholder: "tuempresa@gmail.com", secret: false },
    ],
    docs: "https://developers.google.com/gmail/api",
  },
  sendgrid: {
    label: "SendGrid",
    icon: "SiMailgun",
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "SG.xxxx...", secret: true },
      { key: "fromEmail", label: "Email remitente", placeholder: "hola@tuempresa.com" },
      { key: "fromName", label: "Nombre remitente", placeholder: "Tu Empresa" },
    ],
    docs: "https://docs.sendgrid.com/api-reference/api-keys",
  },
  mailchimp: {
    label: "Mailchimp",
    icon: "SiMailchimp",
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "xxxx-us1", secret: true },
      { key: "serverPrefix", label: "Server Prefix", placeholder: "us1" },
    ],
    docs: "https://mailchimp.com/developer/marketing/api/",
  },
  mailgun: {
    label: "Mailgun",
    icon: "SiMailgun",
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "key-xxxx", secret: true },
      { key: "domain", label: "Domain", placeholder: "mg.tuempresa.com" },
      { key: "region", label: "Región", placeholder: "us o eu" },
    ],
    docs: "https://documentation.mailgun.com/docs/mailgun/api-reference/openapi-final/tag/Domains/",
  },
  resend: {
    label: "Resend",
    icon: "SiResend",
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "re_xxxx", secret: true },
      { key: "fromEmail", label: "Email remitente", placeholder: "hola@tuempresa.com" },
    ],
    docs: "https://resend.com/docs/dashboard/api-keys",
  },
  amazon_ses: {
    label: "Amazon SES",
    icon: "FaAws",
    fields: [
      { key: "accessKeyId", label: "Access Key ID", placeholder: "AKIA...", secret: true },
      { key: "secretAccessKey", label: "Secret Access Key", placeholder: "xxxx", secret: true },
      { key: "region", label: "Región", placeholder: "us-east-1" },
      { key: "fromEmail", label: "Email remitente", placeholder: "hola@tuempresa.com" },
    ],
    docs: "https://docs.aws.amazon.com/ses/latest/dg/setting-up.html",
  },
  brevo: {
    label: "Brevo (ex Sendinblue)",
    icon: "SiBrevo",
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "xkeysib-xxxx", secret: true },
      { key: "fromEmail", label: "Email remitente", placeholder: "hola@tuempresa.com" },
      { key: "fromName", label: "Nombre remitente", placeholder: "Tu Empresa" },
    ],
    docs: "https://developers.brevo.com/reference/apikey-create",
  },
  smtp: {
    label: "SMTP Genérico",
    icon: "Mail",
    fields: [
      { key: "host", label: "SMTP Host", placeholder: "smtp.tuempresa.com" },
      { key: "port", label: "Puerto", placeholder: "587 o 465" },
      { key: "user", label: "Usuario", placeholder: "hola@tuempresa.com" },
      { key: "password", label: "Contraseña", placeholder: "xxxx", secret: true },
      { key: "fromEmail", label: "Email remitente", placeholder: "hola@tuempresa.com" },
    ],
    docs: "",
  },
  messenger: {
    label: "Messenger (Meta)",
    icon: "SiMessenger",
    fields: [
      { key: "pageId", label: "Facebook Page ID", placeholder: "123456789012345", secret: false },
      { key: "accessToken", label: "Page Access Token", placeholder: "EAAx...", secret: true },
    ],
    docs: "https://developers.facebook.com/docs/messenger-platform",
  },
  viber: {
    label: "Viber",
    icon: "SiViber",
    fields: [
      { key: "authToken", label: "Auth Token", placeholder: "xxxx", secret: true },
      { key: "senderId", label: "Sender ID (Viber bot)", placeholder: "xxxx" },
    ],
    docs: "https://developers.viber.com/docs/api/rest-bot-api",
  },
  line: {
    label: "LINE",
    icon: "SiLine",
    fields: [
      { key: "channelAccessToken", label: "Channel Access Token", placeholder: "xxxx", secret: true },
      { key: "channelSecret", label: "Channel Secret", placeholder: "xxxx", secret: true },
    ],
    docs: "https://developers.line.biz/en/docs/messaging-api/",
  },
  wechat: {
    label: "WeChat",
    icon: "SiWechat",
    fields: [
      { key: "appId", label: "AppID", placeholder: "xxxx", secret: false },
      { key: "appSecret", label: "AppSecret", placeholder: "xxxx", secret: true },
      { key: "token", label: "Token", placeholder: "xxxx", secret: true },
      { key: "encodingAesKey", label: "EncodingAESKey", placeholder: "xxxx", secret: true },
    ],
    docs: "https://developers.weixin.qq.com/doc/offiaccount/en/Basic_Information/Access_Overview.html",
  },
  signal: {
    label: "Signal",
    icon: "SiSignal",
    fields: [
      { key: "number", label: "Número Signal", placeholder: "+1234567890" },
      { key: "apiUrl", label: "API URL (signal-cli REST)", placeholder: "https://tu-servidor:8080" },
    ],
    docs: "https://github.com/bbernhard/signal-cli-rest-api",
  },
  kakaotalk: {
    label: "KakaoTalk",
    icon: "SiKakaotalk",
    fields: [
      { key: "plusfriendKey", label: "Plus Friend Key", placeholder: "xxxx" },
      { key: "adminKey", label: "Admin Key", placeholder: "xxxx", secret: true },
    ],
    docs: "https://developers.kakao.com/docs/en/message/rest-api",
  },
  zalo: {
    label: "Zalo",
    icon: "SiZalo",
    fields: [
      { key: "oaId", label: "Official Account ID", placeholder: "xxxx" },
      { key: "secretKey", label: "Secret Key", placeholder: "xxxx", secret: true },
    ],
    docs: "https://developers.zalo.me/docs/message-api",
  },
  microsoft_teams: {
    label: "Microsoft Teams",
    icon: "MessageSquare",
    fields: [
      { key: "webhookUrl", label: "Webhook URL", placeholder: "https://outlook.office.com/webhook/...", secret: true },
    ],
    docs: "https://learn.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook",
  },
  rocket_chat: {
    label: "Rocket.Chat",
    icon: "SiRocketdotchat",
    fields: [
      { key: "webhookUrl", label: "Webhook URL", placeholder: "https://tu-rocketchat/hooks/...", secret: true },
    ],
    docs: "https://docs.rocket.chat/use-rocket.cat/conversational-tools/incoming-webhooks",
  },
  mattermost: {
    label: "Mattermost",
    icon: "SiMattermost",
    fields: [
      { key: "webhookUrl", label: "Incoming Webhook URL", placeholder: "https://tu-mattermost/hooks/xxxx", secret: true },
    ],
    docs: "https://developers.mattermost.com/integrate/webhooks/incoming/",
  },
  matrix: {
    label: "Matrix / Element",
    icon: "SiMatrix",
    fields: [
      { key: "homeserver", label: "Homeserver URL", placeholder: "https://matrix.org" },
      { key: "accessToken", label: "Access Token", placeholder: "xxxx", secret: true },
      { key: "roomId", label: "Room ID", placeholder: "!xxxx:matrix.org" },
    ],
    docs: "https://spec.matrix.org/latest/client-server-api/",
  },
  intercom: {
    label: "Intercom",
    icon: "SiIntercom",
    fields: [
      { key: "appId", label: "App ID", placeholder: "xxxx" },
      { key: "apiKey", label: "API Key", placeholder: "xxxx", secret: true },
    ],
    docs: "https://developers.intercom.com/docs",
  },
  zendesk: {
    label: "Zendesk",
    icon: "SiZendesk",
    fields: [
      { key: "subdomain", label: "Subdomain", placeholder: "tuempresa" },
      { key: "apiToken", label: "API Token", placeholder: "xxxx", secret: true },
      { key: "email", label: "Email de admin", placeholder: "admin@tuempresa.com" },
    ],
    docs: "https://developer.zendesk.com/api-reference/introduction/security-and-auth/",
  },
  livechat: {
    label: "LiveChat",
    icon: "SiLivechat",
    fields: [
      { key: "licenseId", label: "License ID", placeholder: "1234567" },
      { key: "apiKey", label: "API Key", placeholder: "xxxx", secret: true },
    ],
    docs: "https://developer.livechat.com/docs/getting-started/",
  },
  chatwoot: {
    label: "Chatwoot",
    icon: "SiChatwoot",
    fields: [
      { key: "apiUrl", label: "API URL", placeholder: "https://chat.tuempresa.com" },
      { key: "apiKey", label: "API Token", placeholder: "xxxx", secret: true },
    ],
    docs: "https://www.chatwoot.com/docs/api/",
  },
  helpscout: {
    label: "Help Scout",
    icon: "SiHelpscout",
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "xxxx", secret: true },
    ],
    docs: "https://developer.helpscout.com/",
  },
  hubspot_chat: {
    label: "HubSpot Chat",
    icon: "SiHubspot",
    fields: [
      { key: "portalId", label: "Portal ID", placeholder: "12345678" },
      { key: "apiKey", label: "API Key", placeholder: "xxxx", secret: true },
    ],
    docs: "https://developers.hubspot.com/docs/api/conversations/intro",
  },
  tiktok: {
    label: "TikTok",
    icon: "SiTiktok",
    fields: [
      { key: "accessToken", label: "Access Token", placeholder: "clt.xxxxx...", secret: true },
      { key: "openId", label: "Open ID (TikTok user ID)", placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", secret: false },
    ],
    docs: "https://developers.tiktok.com/",
  },
  linkedin: {
    label: "LinkedIn",
    icon: "SiLinkedin",
    fields: [
      { key: "organizationId", label: "Organization ID", placeholder: "12345678" },
      { key: "accessToken", label: "Access Token", placeholder: "AQX...", secret: true },
    ],
    docs: "https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/share-on-linkedin",
  },
  pinterest: {
    label: "Pinterest",
    icon: "SiPinterest",
    fields: [
      { key: "accessToken", label: "Access Token", placeholder: "AxT...", secret: true },
      { key: "boardId", label: "Board ID (opcional)", placeholder: "1234567890123" },
    ],
    docs: "https://developers.pinterest.com/docs/getting-started/",
  },
  twitch: {
    label: "Twitch",
    icon: "SiTwitch",
    fields: [
      { key: "clientId", label: "Client ID", placeholder: "xxxxxxxxxxxxxxxxxxxxxxxx" },
      { key: "accessToken", label: "Access Token", placeholder: "oauth:xxxxxxx", secret: true },
    ],
    docs: "https://dev.twitch.tv/docs/api/",
  },
  reddit: {
    label: "Reddit",
    icon: "SiReddit",
    fields: [
      { key: "clientId", label: "Client ID", placeholder: "xxxxxxxxxxxxxxxx" },
      { key: "clientSecret", label: "Client Secret", placeholder: "xxxxxxxxxxxxxxxx", secret: true },
      { key: "userAgent", label: "User Agent", placeholder: "myapp/1.0" },
    ],
    docs: "https://www.reddit.com/dev/api/",
  },
  snapchat: {
    label: "Snapchat",
    icon: "SiSnapchat",
    fields: [
      { key: "clientId", label: "Client ID", placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" },
      { key: "clientSecret", label: "Client Secret", placeholder: "xxxxxxxxxxxxxxxx", secret: true },
    ],
    docs: "https://developers.snap.com/docs/ads-api/Getting-Started",
  },
  tumblr: {
    label: "Tumblr",
    icon: "SiTumblr",
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "xxxxxxxxxxxxxxxx" },
      { key: "blogName", label: "Blog Name", placeholder: "tu-blog.tumblr.com" },
    ],
    docs: "https://www.tumblr.com/docs/en/api/v2",
  },
};
