"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Plug, Search, Brain, Zap, CreditCard, MessageSquare, Mail, MapPin, Share2, Cloud,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { PLATFORM_INFO } from "@/lib/integration-platforms";
import IntegrationCard, { type IntegrationStatus } from "@/components/ui/IntegrationCard";
import IntegrationDrawer from "@/components/ui/IntegrationDrawer";
import {
  SiStripe, SiPaypal, SiMercadopago, SiBitcoin,
  SiTelegram, SiDiscord, SiWhatsapp,
  SiInstagram, SiFacebook, SiX, SiThreads, SiYoutube,
  SiGooglemaps, SiMapbox, SiGmail, SiMessenger, SiTiktok,
  SiPinterest, SiTwitch, SiReddit, SiSnapchat, SiTumblr,
  SiHere, SiTomtom, SiFoursquare, SiLeaflet, SiApple,
  SiMailchimp, SiMailgun, SiResend, SiBrevo,
  SiViber, SiLine, SiWechat, SiSignal, SiKakaotalk, SiZalo,
  SiRocketdotchat, SiMattermost, SiMatrix,
  SiIntercom, SiZendesk, SiLivechat, SiChatwoot, SiHelpscout, SiHubspot,
  SiAnthropic, SiGooglegemini, SiOllama, SiDeepseek, SiOpenrouter,
  SiMistralai, SiHuggingface, SiCloudflare, SiReplicate,
  SiPerplexity, SiNvidia, SiLmstudio,
} from "react-icons/si";
import { TbBrandSlack, TbBrandTwilio } from "react-icons/tb";
import { FaLinkedin, FaAws } from "react-icons/fa";

const REACT_ICONS: Record<string, any> = {
  SiTelegram, SiDiscord, SiWhatsapp, SiInstagram, SiFacebook, SiX, SiThreads,
  SiYoutube, SiGooglemaps, SiMapbox, SiGmail, SiMessenger, SiTiktok,
  SiLinkedin: FaLinkedin, SiPinterest, SiTwitch, SiReddit, SiSnapchat, SiTumblr,
  SiHere, SiTomtom, SiFoursquare, SiLeaflet, SiApple,
  SiMailchimp, SiMailgun, SiResend, SiBrevo,
  FaAws,
  SiViber, SiLine, SiWechat, SiSignal, SiKakaotalk, SiZalo,
  SiRocketdotchat, SiMattermost, SiMatrix,
  SiIntercom, SiZendesk, SiLivechat, SiChatwoot, SiHelpscout, SiHubspot,
  TbBrandSlack, TbBrandTwilio,
};

const ICON_COLORS: Record<string, string> = {
  stripe: "#635BFF", paypal: "#003087", mercadopago: "#009EE3", nowpayments: "#6C3EC1",
  square: "#3E4348", razorpay: "#072654", paystack: "#0F4B3A", flutterwave: "#F5A623",
  mollie: "#C3002F", paddle: "#3B5EE5", klarna: "#FFB3C7", dlocal: "#00AEEF",
  telegram: "#26A5E4", discord: "#5865F2", slack: "#4A154B", twilio: "#F22F46",
  whatsapp: "#25D366", whatsapp_business: "#25D366", instagram: "#E4405F",
  facebook: "#1877F2", twitter: "#000000", threads: "#000000", youtube: "#FF0000",
  google_maps: "#4285F4", mapbox: "#4264FB", gmail: "#EA4335", messenger: "#00B2FF",
  tiktok: "#000000", linkedin: "#0A66C2", pinterest: "#BD081C", twitch: "#9146FF",
  reddit: "#FF4500", snapchat: "#FFFC00", tumblr: "#36465D",
  here_maps: "#48DAD0", tomtom: "#005FAD", foursquare: "#F24E66", leaflet: "#199900",
  apple_maps: "#333333",
  sendgrid: "#1A82E2", mailchimp: "#FFE01B", mailgun: "#F47D31", resend: "#000000",
  amazon_ses: "#FF9900", brevo: "#0B97DE", smtp: "#6B7280",
  viber: "#7360F2", line: "#00C300", wechat: "#09B83E", signal: "#3A76F0",
  kakaotalk: "#FFCD00", zalo: "#0068FF", microsoft_teams: "#6264A7",
  rocket_chat: "#F5383D", mattermost: "#0072C6", matrix: "#0DBD8B",
  intercom: "#286EFA", zendesk: "#03363D", livechat: "#2C6BDA",
  chatwoot: "#146EB5", helpscout: "#2C6BDA", hubspot: "#FF7A59",
  openai: "#10a37f", anthropic: "#d4a574", gemini: "#4285f4", openrouter: "#6366f1",
  ollama: "#333333", groq: "#f55036", deepseek: "#4d6bfe", mistral: "#ff7000",
  xai: "#1d9bf0", perplexity: "#20b8cd", huggingface: "#ff9d00", cloudflare: "#f6821f",
  lmstudio: "#9333ea", nvidia: "#76b900", replicate: "#3b82f6", custom: "#71717a",
};

const AI_ICONS: Record<string, any> = {
  openai: Brain, anthropic: SiAnthropic, gemini: SiGooglegemini, openrouter: SiOpenrouter,
  ollama: SiOllama, groq: Zap, deepseek: SiDeepseek, mistral: SiMistralai,
  xai: Brain, perplexity: SiPerplexity, huggingface: SiHuggingface, cloudflare: SiCloudflare,
  lmstudio: SiLmstudio, nvidia: SiNvidia, replicate: SiReplicate, custom: Plug,
};

const PAYMENT_ICONS: Record<string, any> = {
  stripe: SiStripe, paypal: SiPaypal, mercadopago: SiMercadopago, nowpayments: SiBitcoin,
  square: SiStripe, razorpay: SiStripe, paystack: SiStripe, flutterwave: SiStripe,
  mollie: SiStripe, paddle: SiStripe, klarna: SiStripe, dlocal: SiStripe,
};

const PAYMENT_FIELDS: Record<string, { key: string; label: string; placeholder: string; secret?: boolean }[]> = {
  stripe: [
    { key: "secretKey", label: "Secret Key", placeholder: "sk_live_xxx o sk_test_xxx", secret: true },
    { key: "publishableKey", label: "Publishable Key", placeholder: "pk_live_xxx o pk_test_xxx" },
    { key: "webhookSecret", label: "Webhook Secret", placeholder: "whsec_xxx", secret: true },
  ],
  paypal: [
    { key: "clientId", label: "Client ID", placeholder: "AYSq3RDG..." },
    { key: "clientSecret", label: "Client Secret", placeholder: "EGnHDxD...", secret: true },
    { key: "mode", label: "Modo", placeholder: "sandbox o live" },
  ],
  mercadopago: [
    { key: "accessToken", label: "Access Token", placeholder: "APP_USR-xxx", secret: true },
    { key: "publicKey", label: "Public Key", placeholder: "APP_USR-xxx" },
  ],
  nowpayments: [
    { key: "apiKey", label: "API Key", placeholder: "NOWPAYMENTS_API_KEY", secret: true },
    { key: "ipnSecret", label: "IPN Secret", placeholder: "xxx", secret: true },
  ],
  square: [
    { key: "accessToken", label: "Access Token", placeholder: "sq0atp-xxx", secret: true },
    { key: "applicationId", label: "Application ID", placeholder: "sq0idp-xxx" },
    { key: "locationId", label: "Location ID", placeholder: "LH..." },
    { key: "environment", label: "Entorno", placeholder: "sandbox o production" },
  ],
  razorpay: [
    { key: "keyId", label: "Key ID", placeholder: "rzp_test_xxx", secret: true },
    { key: "keySecret", label: "Key Secret", placeholder: "xxxxxxxx", secret: true },
  ],
  paystack: [
    { key: "secretKey", label: "Secret Key", placeholder: "sk_test_xxx o sk_live_xxx", secret: true },
    { key: "publicKey", label: "Public Key", placeholder: "pk_test_xxx o pk_live_xxx" },
  ],
  flutterwave: [
    { key: "secretKey", label: "Secret Key", placeholder: "FLWSECK-xxx", secret: true },
    { key: "publicKey", label: "Public Key", placeholder: "FLWPUBK-xxx" },
    { key: "encryptionKey", label: "Encryption Key", placeholder: "FLWSECK-xxx", secret: true },
  ],
  mollie: [
    { key: "apiKey", label: "API Key", placeholder: "test_xxx o live_xxx", secret: true },
  ],
  paddle: [
    { key: "vendorId", label: "Vendor ID", placeholder: "12345" },
    { key: "apiKey", label: "API Key", placeholder: "xxxxxxxx", secret: true },
    { key: "clientSideToken", label: "Client-Side Token", placeholder: "xxxxxxxx" },
    { key: "environment", label: "Entorno", placeholder: "sandbox o production" },
  ],
  klarna: [
    { key: "merchantId", label: "Merchant ID", placeholder: "xxxxxxxx" },
    { key: "apiKey", label: "API Key", placeholder: "xxxxxxxx", secret: true },
    { key: "environment", label: "Entorno", placeholder: "playground o production" },
  ],
  dlocal: [
    { key: "secretKey", label: "Secret Key", placeholder: "xxxxxxxx", secret: true },
    { key: "login", label: "Login", placeholder: "tu@email.com" },
    { key: "countryCode", label: "Código de país", placeholder: "BR, MX, AR, CO..." },
  ],
};

const AI_PROVIDERS_LIST = [
  { id: "openai", label: "OpenAI", desc: "GPT-4o, GPT-4.1, o3-mini", pricing: "de pago", priceRef: "~$0.15-60/M tokens", models: ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini", "gpt-4.1", "o3-mini"], docs: "https://platform.openai.com/api-keys" },
  { id: "anthropic", label: "Anthropic", desc: "Claude Sonnet, Haiku, Opus", pricing: "de pago", priceRef: "~$0.25-75/M tokens", models: ["claude-sonnet-4-20250514", "claude-3-5-haiku-20241022", "claude-opus-4-20250514"], docs: "https://console.anthropic.com/settings/keys" },
  { id: "gemini", label: "Google Gemini", desc: "Flash, Pro — tier gratuito", pricing: "gratis", priceRef: "Tier gratuito generoso (15 RPM)", models: ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-2.5-pro"], docs: "https://aistudio.google.com/apikey" },
  { id: "openrouter", label: "OpenRouter", desc: "100+ modelos, paga por uso", pricing: "de pago", priceRef: "Agregador multi-modelo", models: ["openai/gpt-4o-mini", "openai/gpt-4o", "anthropic/claude-3.5-sonnet", "deepseek/deepseek-chat"], docs: "https://openrouter.ai/keys" },
  { id: "ollama", label: "Ollama", desc: "100% local y gratis", pricing: "gratis", priceRef: "Gratis — corre en tu PC", models: ["llama3.1", "mistral", "codellama", "phi3", "gemma2"], docs: "https://ollama.com/download" },
  { id: "groq", label: "Groq", desc: "Inferencia ultrarrápida", pricing: "gratis", priceRef: "Tier gratuito generoso", models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"], docs: "https://console.groq.com/keys" },
  { id: "deepseek", label: "DeepSeek", desc: "Relación calidad/precio top", pricing: "muy barato", priceRef: "~$0.14-2.19/M tokens", models: ["deepseek-chat", "deepseek-reasoner"], docs: "https://platform.deepseek.com/api_keys" },
  { id: "mistral", label: "Mistral AI", desc: "Modelos europeos", pricing: "de pago", priceRef: "~$0.15-8/M tokens", models: ["mistral-large-latest", "mistral-small-latest", "codestral-latest"], docs: "https://console.mistral.ai/api-keys/" },
  { id: "xai", label: "xAI (Grok)", desc: "Modelos de Elon Musk", pricing: "de pago", priceRef: "~$0.60-6/M tokens", models: ["grok-2", "grok-2-mini"], docs: "https://console.x.ai/" },
  { id: "perplexity", label: "Perplexity", desc: "Respuestas con internet", pricing: "de pago", priceRef: "~$0.20-5/M tokens", models: ["llama-3.1-sonar-small-128k-online"], docs: "https://www.perplexity.ai/settings/api" },
  { id: "huggingface", label: "Hugging Face", desc: "Miles de modelos open-source", pricing: "gratis", priceRef: "Inference API gratuita", models: ["meta-llama/Meta-Llama-3.1-8B-Instruct"], docs: "https://huggingface.co/settings/tokens" },
  { id: "cloudflare", label: "Cloudflare AI", desc: "10K requests/día gratis", pricing: "gratis", priceRef: "10K requests/día gratis", models: ["@cf/meta/llama-3.1-8b-instruct"], docs: "https://dash.cloudflare.com/profile/api-tokens" },
  { id: "lmstudio", label: "LM Studio", desc: "Interfaz gráfica local", pricing: "gratis", priceRef: "Gratis — interfaz local", models: [], docs: "https://lmstudio.ai/download" },
  { id: "nvidia", label: "NVIDIA NIM", desc: "GPU inference gratis", pricing: "gratis", priceRef: "1000 credits gratis", models: ["meta/llama-3.1-8b-instruct"], docs: "https://build.nvidia.com/" },
  { id: "replicate", label: "Replicate", desc: "Model hosting", pricing: "de pago", priceRef: "~$0.00015/s", models: ["meta/meta-llama-3.1-8b-instruct"], docs: "https://replicate.com/account/api-tokens" },
  { id: "custom", label: "Custom", desc: "Cualquier servidor OpenAI-compatible", pricing: "variable", priceRef: "Variable", models: [], docs: "" },
];

type CategoryDef = { id: string; label: string; emoji: string; icon: any };

function getCategories(t: (key: string) => string): CategoryDef[] {
  return [
    { id: "payment", label: t("integrations.category_payments"), emoji: "💳", icon: CreditCard },
    { id: "ai", label: t("integrations.category_ai"), emoji: "🤖", icon: Brain },
    { id: "messaging", label: t("integrations.category_messaging"), emoji: "📲", icon: MessageSquare },
    { id: "email", label: t("integrations.category_email"), emoji: "📧", icon: Mail },
    { id: "maps", label: t("integrations.category_maps"), emoji: "🗺️", icon: MapPin },
    { id: "social", label: t("integrations.category_social"), emoji: "🔗", icon: Share2 },
    { id: "cloud", label: t("integrations.category_storage"), emoji: "☁️", icon: Cloud },
  ];
}

interface IntegrationDef {
  id: string;
  category: string;
  label: string;
  desc: string;
  icon: any;
  iconColor: string;
  docsUrl?: string;
  status: IntegrationStatus;
  connectedInfo?: string;
  fields: { key: string; label: string; placeholder: string; secret?: boolean }[];
}

interface Integration {
  _id: string;
  platform: string;
  enabled: boolean;
  credentials: Record<string, string>;
}

interface PaymentIntegration {
  provider: string;
  enabled: boolean;
  isDefault: boolean;
  connectedAt?: string;
  hasCredentials: boolean;
}

function buildIntegrationsList(
  integrations: Integration[],
  paymentIntegrations: PaymentIntegration[],
  aiProvider: any,
): IntegrationDef[] {
  const list: IntegrationDef[] = [];

  const getPlatStatus = (platform: string): IntegrationStatus => {
    const existing = integrations.find(i => i.platform === platform);
    if (!existing) return "disconnected";
    return existing.enabled ? "connected" : "disconnected";
  };

  const getPlatInfo = (platform: string): string => {
    const existing = integrations.find(i => i.platform === platform);
    if (!existing?.enabled) return "";
    return `Configurado — ${Object.keys(existing.credentials).filter(k => existing.credentials[k]).length} campos`;
  };

  const getPayStatus = (provider: string): IntegrationStatus => {
    const pi = paymentIntegrations.find(p => p.provider === provider);
    return pi?.enabled ? "connected" : "disconnected";
  };

  const getPayInfo = (provider: string): string => {
    const pi = paymentIntegrations.find(p => p.provider === provider);
    if (!pi?.enabled) return "";
    return pi.isDefault ? "Conectado — Predeterminado" : "Conectado";
  };

  list.push(
    { id: "stripe", category: "payment", label: "Stripe", desc: "Pagos con tarjeta de crédito y débito mundialmente", icon: SiStripe, iconColor: "#635BFF", docsUrl: "https://dashboard.stripe.com/apikeys", status: getPlatStatus("stripe") === "connected" ? "connected" : getPayStatus("stripe"), connectedInfo: getPayInfo("stripe") || getPlatInfo("stripe"), fields: PAYMENT_FIELDS.stripe },
    { id: "paypal", category: "payment", label: "PayPal", desc: "Pagos seguros con PayPal y tarjetas", icon: SiPaypal, iconColor: "#003087", docsUrl: "https://developer.paypal.com/dashboard/applications", status: getPayStatus("paypal"), connectedInfo: getPayInfo("paypal"), fields: PAYMENT_FIELDS.paypal },
    { id: "mercadopago", category: "payment", label: "Mercado Pago", desc: "Pagos en Latinoamérica — cuotas, QR, transferencias", icon: SiMercadopago, iconColor: "#009EE3", docsUrl: "https://www.mercadopago.com.ar/developers", status: getPayStatus("mercadopago"), connectedInfo: getPayInfo("mercadopago"), fields: PAYMENT_FIELDS.mercadopago },
    { id: "nowpayments", category: "payment", label: "NOWPayments", desc: "Acepta Bitcoin, Ethereum y 150+ criptomonedas", icon: SiBitcoin, iconColor: "#6C3EC1", docsUrl: "https://nowpayments.io/api", status: getPayStatus("nowpayments"), connectedInfo: getPayInfo("nowpayments"), fields: PAYMENT_FIELDS.nowpayments },
    { id: "square", category: "payment", label: "Square", desc: "Pagos online y presenciales — POS incluido", icon: SiStripe, iconColor: "#3E4348", docsUrl: "https://developer.squareup.com/apps", status: getPayStatus("square"), connectedInfo: getPayInfo("square"), fields: PAYMENT_FIELDS.square },
    { id: "razorpay", category: "payment", label: "Razorpay", desc: "Pagos en India — UPI, wallets, tarjetas", icon: SiStripe, iconColor: "#072654", docsUrl: "https://dashboard.razorpay.com/app/keys", status: getPayStatus("razorpay"), connectedInfo: getPayInfo("razorpay"), fields: PAYMENT_FIELDS.razorpay },
    { id: "paystack", category: "payment", label: "Paystack", desc: "Pagos en África — tarjetas, transferencias, mobile money", icon: SiStripe, iconColor: "#0F4B3A", docsUrl: "https://dashboard.paystack.com/settings/keys", status: getPayStatus("paystack"), connectedInfo: getPayInfo("paystack"), fields: PAYMENT_FIELDS.paystack },
    { id: "flutterwave", category: "payment", label: "Flutterwave", desc: "Pagos en África y Latinoamérica — multi-moneda", icon: SiStripe, iconColor: "#F5A623", docsUrl: "https://dashboard.flutterwave.com/developers/apikeys", status: getPayStatus("flutterwave"), connectedInfo: getPayInfo("flutterwave"), fields: PAYMENT_FIELDS.flutterwave },
    { id: "mollie", category: "payment", label: "Mollie", desc: "Pagos en Europa — iDEAL, Bancontact, tarjetas", icon: SiStripe, iconColor: "#C3002F", docsUrl: "https://www.mollie.com/dashboard/developers/api-keys", status: getPayStatus("mollie"), connectedInfo: getPayInfo("mollie"), fields: PAYMENT_FIELDS.mollie },
    { id: "paddle", category: "payment", label: "Paddle", desc: "SaaS billing — maneja impuestos y suscripciones", icon: SiStripe, iconColor: "#3B5EE5", docsUrl: "https://www.paddle.com/billing/manage/api-keys", status: getPayStatus("paddle"), connectedInfo: getPayInfo("paddle"), fields: PAYMENT_FIELDS.paddle },
    { id: "klarna", category: "payment", label: "Klarna", desc: "Buy Now Pay Later — cuotas sin interés", icon: SiStripe, iconColor: "#FFB3C7", docsUrl: "https://docs.klarna.com/klarna-payments/integrate/", status: getPayStatus("klarna"), connectedInfo: getPayInfo("klarna"), fields: PAYMENT_FIELDS.klarna },
    { id: "dlocal", category: "payment", label: "dLocal", desc: "Pagos en Latinoamérica — transferencias locales", icon: SiStripe, iconColor: "#00AEEF", docsUrl: "https://docs.dlocal.com/", status: getPayStatus("dlocal"), connectedInfo: getPayInfo("dlocal"), fields: PAYMENT_FIELDS.dlocal },
  );

  for (const ai of AI_PROVIDERS_LIST) {
    const connected = aiProvider?.enabled && aiProvider?.provider === ai.id;
    list.push({
      id: `ai_${ai.id}`, category: "ai", label: ai.label, desc: ai.desc,
      icon: AI_ICONS[ai.id] || Brain, iconColor: ICON_COLORS[ai.id] || "#71717a",
      docsUrl: ai.docs, status: connected ? "connected" : "disconnected",
      connectedInfo: connected ? `Modelo: ${aiProvider.model}` : "",
      fields: [
        ...(ai.id !== "ollama" ? [{ key: "apiKey", label: "API Key", placeholder: `Tu API key de ${ai.label}`, secret: true }] : []),
        ...(ai.id === "ollama" || ai.id === "lmstudio" || ai.id === "custom" ? [{ key: "baseUrl", label: "Base URL", placeholder: ai.id === "ollama" ? "http://localhost:11434/v1" : ai.id === "lmstudio" ? "http://localhost:1234/v1" : "https://tu-servidor.com/v1" }] : []),
        ...(ai.models.length > 0 ? [{ key: "model", label: "Modelo", placeholder: ai.models[0] }] : [{ key: "model", label: "Modelo", placeholder: "nombre-del-modelo" }]),
      ],
    });
  }

  const MESSAGING_SUB: Record<string, string> = {
    telegram: "App de mensajería", discord: "Gaming y comunidades", slack: "Equipo de trabajo",
    whatsapp: "App de mensajería", whatsapp_business: "Negocios (API oficial)", messenger: "Facebook Messenger",
    viber: "App de mensajería", line: "App de mensajería (Asia)", wechat: "App super (China)",
    signal: "App cifrada", kakaotalk: "App de mensajería (Corea)", zalo: "App de mensajería (Vietnam)",
    microsoft_teams: "Equipo de trabajo (Microsoft)", rocket_chat: "Chat auto-hospedado",
    mattermost: "Chat auto-hospedado (open source)", matrix: "Chat descentralizado (open source)",
    intercom: "Soporte y chat en vivo", zendesk: "Soporte al cliente", livechat: "Chat en vivo web",
    chatwoot: "Soporte open source", helpscout: "Soporte al cliente", hubspot_chat: "Chat + CRM (HubSpot)",
  };

  for (const [platform, info] of Object.entries(PLATFORM_INFO)) {
    let category = "social";
    if (["telegram", "discord", "slack", "whatsapp", "whatsapp_business", "messenger", "viber", "line", "wechat", "signal", "kakaotalk", "zalo", "microsoft_teams", "rocket_chat", "mattermost", "matrix", "intercom", "zendesk", "livechat", "chatwoot", "helpscout", "hubspot_chat"].includes(platform)) category = "messaging";
    else if (["gmail", "sendgrid", "mailchimp", "mailgun", "resend", "amazon_ses", "brevo", "smtp"].includes(platform)) category = "email";
    else if (["google_maps", "mapbox", "here_maps", "tomtom", "foursquare", "leaflet", "apple_maps"].includes(platform)) category = "maps";
    else if (["youtube", "tiktok", "linkedin", "pinterest", "twitch", "reddit", "snapchat", "tumblr"].includes(platform)) category = "social";

    const subTag = MESSAGING_SUB[platform] ? ` — ${MESSAGING_SUB[platform]}` : "";
    list.push({
      id: `plat_${platform}`, category, label: info.label,
      desc: `Integra ${info.label} con tu negocio${subTag}`,
      icon: REACT_ICONS[info.icon] || Plug,
      iconColor: ICON_COLORS[platform] || "#71717a",
      docsUrl: info.docs,
      status: getPlatStatus(platform),
      connectedInfo: getPlatInfo(platform),
      fields: info.fields,
    });
  }

  return list;
}

export default function IntegrationsPanel({ storeId, userEmail }: { storeId: string; userEmail?: string }) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentIntegrations, setPaymentIntegrations] = useState<PaymentIntegration[]>([]);
  const [aiProvider, setAiProvider] = useState<any>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationDef | null>(null);
  const [drawerForm, setDrawerForm] = useState<Record<string, string>>({});
  const [drawerSaving, setDrawerSaving] = useState(false);
  const [drawerTesting, setDrawerTesting] = useState(false);
  const [stripeConnectStatus, setStripeConnectStatus] = useState<any>(null);
  const [stripeConnecting, setStripeConnecting] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchIntegrations(), fetchPaymentIntegrations(), fetchAIProvider(), fetchStripeConnectStatus()]);
  }, [storeId]);

  const fetchStripeConnectStatus = async () => {
    try {
      const res = await fetch(`/api/stripe/account-status?storeId=${storeId}`);
      const data = await res.json();
      setStripeConnectStatus(data);
    } catch {}
  };

  const handleStripeConnect = async () => {
    setStripeConnecting(true);
    setStripeError(null);
    try {
      const res = await fetch("/api/stripe/create-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, userId: userEmail, email: userEmail }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.alreadyConnected) {
        showToast("Stripe ya está conectado", "info");
        await fetchStripeConnectStatus();
      } else {
        const errMsg = data.error || "Error al conectar con Stripe";
        setStripeError(errMsg);
        showToast(errMsg, "error");
      }
    } catch {
      const errMsg = "Error de conexión con el servidor";
      setStripeError(errMsg);
      showToast(errMsg, "error");
    } finally {
      setStripeConnecting(false);
    }
  };

  const handleStripeDisconnect = async () => {
    if (!confirm("¿Desconectar Stripe? Se eliminará la conexión con tu cuenta.")) return;
    try {
      await fetch("/api/stripe/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId }),
      });
      setStripeConnectStatus({ connected: false });
      showToast("Stripe desconectado", "success");
    } catch {
      showToast("Error al desconectar", "error");
    }
  };

  const handleStripeOnboarding = async () => {
    try {
      const res = await fetch("/api/stripe/onboarding-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        showToast(data.error || "Error al generar link", "error");
      }
    } catch {
      showToast("Error de conexión", "error");
    }
  };

  const fetchAIProvider = async () => {
    try {
      const res = await fetch(`/api/stores/${storeId}/ai-provider`);
      const data = await res.json();
      if (data.aiProvider) setAiProvider(data.aiProvider);
    } catch {}
  };

  const fetchPaymentIntegrations = async () => {
    try {
      const res = await fetch(`/api/stores/${storeId}/payment-integrations`);
      const data = await res.json();
      setPaymentIntegrations(data.integrations || []);
    } catch {}
  };

  const fetchIntegrations = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/integrations?storeId=${storeId}`);
      const data = await res.json();
      if (data.success) setIntegrations(data.integrations);
    } catch { showToast(t("integrations.error_load"), "error"); }
    setLoading(false);
  };

  const allIntegrations = useMemo(
    () => buildIntegrationsList(integrations, paymentIntegrations, aiProvider),
    [integrations, paymentIntegrations, aiProvider]
  );

  const filteredIntegrations = useMemo(() => {
    if (!searchQuery) return allIntegrations;
    const q = searchQuery.toLowerCase();
    return allIntegrations.filter(i =>
      i.label.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q) || i.category.includes(q)
    );
  }, [allIntegrations, searchQuery]);

  const visibleCategories = useMemo(() => {
    const catIds = new Set(filteredIntegrations.map(i => i.category));
    return getCategories(t).filter(c => catIds.has(c.id));
  }, [filteredIntegrations, t]);

  const openDrawer = (integration: IntegrationDef) => {
    if (integration.id === "stripe" && stripeConnectStatus?.connected) {
      return;
    }
    setSelectedIntegration(integration);
    const initial: Record<string, string> = {};
    if (integration.id.startsWith("plat_")) {
      const platform = integration.id.replace("plat_", "");
      const existing = integrations.find(i => i.platform === platform);
      if (existing) {
        for (const f of integration.fields) initial[f.key] = existing.credentials[f.key] || "";
      }
    }
    if (integration.id.startsWith("ai_")) {
      const aiId = integration.id.replace("ai_", "");
      if (aiProvider?.provider === aiId) {
        initial.apiKey = "";
        initial.baseUrl = aiProvider.baseUrl || "";
        initial.model = aiProvider.model || "";
      } else {
        const aiDef = AI_PROVIDERS_LIST.find(p => p.id === aiId);
        initial.baseUrl = aiId === "ollama" ? "http://localhost:11434/v1" : aiId === "lmstudio" ? "http://localhost:1234/v1" : "";
        initial.model = aiDef?.models?.[0] || "";
      }
    }
    if (["stripe", "paypal", "mercadopago", "nowpayments"].includes(integration.id)) {
      const pi = paymentIntegrations.find(p => p.provider === integration.id);
      if (!pi?.hasCredentials) {
        for (const f of integration.fields) initial[f.key] = "";
      }
    }
    setDrawerForm(initial);
    setDrawerOpen(true);
  };

  const saveFromDrawer = async () => {
    if (!selectedIntegration) return;
    const id = selectedIntegration.id;

    const requiredFields = selectedIntegration.fields.filter(f => f.key !== "baseUrl" && f.key !== "model");
    const hasAnyValue = requiredFields.some(f => drawerForm[f.key]?.trim());
    if (requiredFields.length > 0 && !hasAnyValue) {
      showToast("Ingresa al menos una credencial para conectar", "error");
      return;
    }

    if (id.startsWith("ai_")) {
      const aiId = id.replace("ai_", "");
      if (aiId !== "ollama" && aiId !== "lmstudio" && !drawerForm.apiKey?.trim()) {
        showToast("Ingresa tu API Key para conectar", "error");
        return;
      }
    }

    setDrawerSaving(true);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      if (id.startsWith("plat_")) {
        const platform = id.replace("plat_", "");
        const res = await fetch("/api/integrations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storeId, platform, credentials: drawerForm }),
          signal: controller.signal,
        });
        const data = await res.json();
        if (!res.ok) { showToast(data.error || t("integrations.error_save"), "error"); return; }
        showToast(`${selectedIntegration.label} conectado correctamente`, "success");
        await fetchIntegrations();
      } else if (id.startsWith("ai_")) {
        const aiId = id.replace("ai_", "");
        const aiDef = AI_PROVIDERS_LIST.find(p => p.id === aiId);
        const res = await fetch(`/api/stores/${storeId}/ai-provider`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storeId, provider: aiId,
            apiKey: drawerForm.apiKey || "",
            baseUrl: drawerForm.baseUrl || (aiId === "ollama" ? "http://localhost:11434/v1" : aiId === "lmstudio" ? "http://localhost:1234/v1" : ""),
            model: drawerForm.model || aiDef?.models?.[0] || "",
          }),
          signal: controller.signal,
        });
        const data = await res.json();
        if (!res.ok) { showToast(data.error || "Error al guardar", "error"); return; }
        showToast(`${selectedIntegration.label} configurado correctamente`, "success");
        await fetchAIProvider();
      } else if (["stripe", "paypal", "mercadopago", "nowpayments"].includes(id)) {
        const res = await fetch(`/api/stores/${storeId}/payment-integrations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storeId, provider: id, credentials: drawerForm }),
          signal: controller.signal,
        });
        const data = await res.json();
        if (!res.ok) { showToast(data.error || "Error al guardar", "error"); return; }
        showToast(`${selectedIntegration.label} conectado correctamente`, "success");
        await fetchPaymentIntegrations();
      }
      setDrawerOpen(false);
    } catch (e: any) {
      if (e?.name === "AbortError") {
        showToast("Tiempo de espera agotado. Verifica tu conexión e intenta de nuevo.", "error");
      } else {
        showToast("Error de conexión", "error");
      }
    } finally {
      clearTimeout(timeout);
      setDrawerSaving(false);
    }
  };

  const disconnectFromDrawer = async () => {
    if (!selectedIntegration) return;
    const id = selectedIntegration.id;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 10000);
    try {
      if (id.startsWith("plat_")) {
        const platform = id.replace("plat_", "");
        await fetch(`/api/integrations?storeId=${storeId}&platform=${platform}`, { method: "DELETE", signal: ctrl.signal });
        await fetchIntegrations();
      } else if (id.startsWith("ai_")) {
        await fetch(`/api/stores/${storeId}/ai-provider?storeId=${storeId}`, { method: "DELETE", signal: ctrl.signal });
        setAiProvider(null);
      } else if (["stripe", "paypal", "mercadopago", "nowpayments"].includes(id)) {
        await fetch(`/api/stores/${storeId}/payment-integrations?provider=${id}`, { method: "DELETE", signal: ctrl.signal });
        await fetchPaymentIntegrations();
      }
      showToast(`${selectedIntegration.label} desconectado`, "success");
      setDrawerOpen(false);
    } catch (e: any) {
      if (e?.name === "AbortError") {
        showToast("Tiempo de espera agotado. Intenta de nuevo.", "error");
      } else {
        showToast("Error de conexión", "error");
      }
    } finally { clearTimeout(t); }
  };

  const testFromDrawer = async () => {
    if (!selectedIntegration || !selectedIntegration.id.startsWith("plat_")) return;
    setDrawerTesting(true);
    const platform = selectedIntegration.id.replace("plat_", "");
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000);
    try {
      const res = await fetch("/api/integrations/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, credentials: drawerForm }),
        signal: ctrl.signal,
      });
      const data = await res.json();
      if (data.success) showToast(`${selectedIntegration.label} conectado correctamente`, "success");
      else showToast(`Error: ${data.error || "Falló la prueba"}`, "error");
    } catch (e: any) {
      if (e?.name === "AbortError") {
        showToast("Tiempo de espera agotado. Verifica las credenciales.", "error");
      } else {
        showToast("Error de conexión", "error");
      }
    } finally { clearTimeout(t); setDrawerTesting(false); }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <h3 className="text-2xl max-[400px]:text-xl font-black italic text-zinc-950 uppercase tracking-tighter">
          <Plug className="w-6 h-6 max-[400px]:w-5 max-[400px]:h-5 inline mr-3 text-red-600" />{t("integrations.title")}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-40 bg-zinc-50 rounded-[2rem] animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-2xl max-[400px]:text-xl font-black italic text-zinc-950 uppercase tracking-tighter">
          <Plug className="w-6 h-6 max-[400px]:w-5 max-[400px]:h-5 inline mr-3 text-red-600" />{t("integrations.title")}
        </h3>
        <p className="text-xs font-medium text-zinc-400 italic -mt-1">
          {t("integrations.subtitle")}
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
        <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          placeholder={t("integrations.search")}
          className="w-full bg-zinc-50 pl-11 pr-4 py-3 rounded-2xl border border-zinc-100 outline-none font-medium text-sm focus:bg-white focus:border-red-200 transition-all" />
      </div>

      {visibleCategories.map(cat => {
        const catIntegrations = filteredIntegrations.filter(i => i.category === cat.id);
        if (catIntegrations.length === 0) return null;
        const CatIcon = cat.icon;
        return (
          <div key={cat.id} className="space-y-4">
            <div className="flex items-center gap-2">
              <CatIcon className="w-4 h-4 text-zinc-400" />
              <h4 className="text-sm font-black italic text-zinc-950 uppercase tracking-tight">{cat.label}</h4>
              <span className="text-[9px] font-bold text-zinc-300 italic">({catIntegrations.length})</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {catIntegrations.map(integration => {
                if (integration.id === "stripe") {
                  const isConnected = stripeConnectStatus?.connected;
                  const isOnboarded = stripeConnectStatus?.onboarded;
                  return (
                    <div key="stripe" className="bg-white rounded-[2rem] border border-zinc-100 p-5 hover:shadow-lg transition-all cursor-pointer" onClick={() => { if (!isConnected && !stripeError) handleStripeConnect(); }}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2.5 bg-[#635BFF]/10 rounded-xl">
                          <SiStripe className="w-5 h-5" style={{ color: "#635BFF" }} />
                        </div>
                        {isConnected ? (
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black italic uppercase flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />Conectado
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-zinc-50 text-zinc-400 rounded-full text-[9px] font-black italic uppercase">No conectado</span>
                        )}
                      </div>
                      <h5 className="text-sm font-black italic text-zinc-950 mb-1">Stripe Connect</h5>
                      <p className="text-[10px] font-medium text-zinc-400 mb-3">Conecta tu cuenta Stripe para recibir pagos directamente</p>
                      {isConnected && stripeConnectStatus?.email && (
                        <p className="text-[9px] text-zinc-300 mb-2 truncate">{stripeConnectStatus.email}</p>
                      )}
                      {stripeError && (
                        <div className="mb-3 p-2.5 bg-red-50 border border-red-100 rounded-xl">
                          <p className="text-[10px] font-bold text-red-600">{stripeError}</p>
                        </div>
                      )}
                      <div className="flex gap-2 mt-2">
                        {!isConnected ? (
                          <button disabled={stripeConnecting} onClick={(e) => { e.stopPropagation(); handleStripeConnect(); }} className="flex-1 px-3 py-2 bg-[#635BFF] text-white text-[10px] font-black italic rounded-xl hover:bg-[#5048e0] transition-all disabled:opacity-50">
                            {stripeConnecting ? "Conectando..." : "Conectar con Stripe"}
                          </button>
                        ) : (
                          <>
                            {!isOnboarded && (
                              <button onClick={(e) => { e.stopPropagation(); handleStripeOnboarding(); }} className="flex-1 px-3 py-2 bg-amber-50 text-amber-600 text-[10px] font-black italic rounded-xl hover:bg-amber-100 transition-all">
                                Completar registro
                              </button>
                            )}
                            <button onClick={(e) => { e.stopPropagation(); handleStripeDisconnect(); }} className="px-3 py-2 bg-red-50 text-red-500 text-[10px] font-black italic rounded-xl hover:bg-red-100 transition-all">
                              Desconectar
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                }
                return (
                <IntegrationCard
                  key={integration.id}
                  icon={integration.icon}
                  iconColor={integration.iconColor}
                  label={integration.label}
                  description={integration.desc}
                  status={integration.status}
                  connectedLabel={integration.connectedInfo}
                  onClick={() => openDrawer(integration)}
                />
              );
              })}

              {cat.id === "payment" && (
                <div className="col-span-full bg-white rounded-[2rem] border border-zinc-100 p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 bg-amber-50 rounded-xl">
                      <CreditCard className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h5 className="text-sm font-black italic text-zinc-950">Política de pago</h5>
                      <p className="text-[10px] font-medium text-zinc-400">Configura cuándo los clientes deben pagar</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { value: "always", label: "Pago obligatorio", desc: "Tiendas, e-commerce — el cliente DEBE pagar en línea para completar la compra", emoji: "🔒" },
                      { value: "optional", label: "Pago opcional", desc: "Servicios, barberías, salones — el cliente PUEDE pagar en línea o en el establecimiento", emoji: "💰" },
                      { value: "none", label: "Sin pagos en línea", desc: "Solo facturación — los clientes pagan por transferencia o en persona", emoji: "📋" },
                    ].map(opt => (
                      <button key={opt.value} onClick={async () => {
                        try {
                          await fetch(`/api/stores/${storeId}/payment-integrations`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ paymentPolicy: opt.value }),
                          });
                          showToast("Política de pago actualizada", "success");
                        } catch { showToast("Error al guardar", "error"); }
                      }}
                        className="text-left p-4 rounded-xl border-2 border-zinc-100 hover:border-amber-200 transition-all">
                        <span className="text-lg">{opt.emoji}</span>
                        <p className="text-xs font-black italic text-zinc-950 mt-2">{opt.label}</p>
                        <p className="text-[9px] text-zinc-400 font-medium mt-1">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {filteredIntegrations.length === 0 && (
        <div className="text-center py-16">
          <Plug className="w-10 h-10 text-zinc-200 mx-auto mb-3" />
          <p className="text-sm font-medium text-zinc-300 italic">No se encontraron integraciones para &quot;{searchQuery}&quot;</p>
        </div>
      )}

      <IntegrationDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        icon={selectedIntegration?.icon || Plug}
        iconColor={selectedIntegration?.iconColor || "#71717a"}
        label={selectedIntegration?.label || ""}
        description={selectedIntegration?.desc}
        docsUrl={selectedIntegration?.docsUrl}
        connected={selectedIntegration?.status === "connected"}
        connectedInfo={selectedIntegration?.connectedInfo}
        fields={selectedIntegration?.fields || []}
        formValues={drawerForm}
        onFormChange={(key, value) => setDrawerForm(prev => ({ ...prev, [key]: value }))}
        onSave={saveFromDrawer}
        onDisconnect={selectedIntegration?.status === "connected" ? disconnectFromDrawer : undefined}
        onTest={selectedIntegration?.status === "connected" && selectedIntegration?.id.startsWith("plat_") ? testFromDrawer : undefined}
        saving={drawerSaving}
        testing={drawerTesting}
      />
    </div>
  );
}
