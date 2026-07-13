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
  SiAnthropic, SiGooglegemini, SiOllama, SiDeepseek, SiOpenrouter,
  SiMistralai, SiHuggingface, SiCloudflare, SiReplicate,
  SiPerplexity, SiNvidia, SiLmstudio,
} from "react-icons/si";
import { TbBrandSlack, TbBrandTwilio } from "react-icons/tb";

const REACT_ICONS: Record<string, any> = {
  SiTelegram, SiDiscord, SiWhatsapp, SiInstagram, SiFacebook, SiX, SiThreads,
  SiYoutube, SiGooglemaps, SiMapbox, SiGmail, SiMessenger, SiTiktok,
  TbBrandSlack, TbBrandTwilio,
};

const ICON_COLORS: Record<string, string> = {
  stripe: "#635BFF", paypal: "#003087", mercadopago: "#009EE3", nowpayments: "#6C3EC1",
  telegram: "#26A5E4", discord: "#5865F2", slack: "#4A154B", twilio: "#F22F46",
  whatsapp: "#25D366", whatsapp_business: "#25D366", instagram: "#E4405F",
  facebook: "#1877F2", twitter: "#000000", threads: "#000000", youtube: "#FF0000",
  google_maps: "#4285F4", mapbox: "#4264FB", gmail: "#EA4335", messenger: "#00B2FF",
  tiktok: "#000000",
  openai: "#10a37f", anthropic: "#d4a574", gemini: "#4285f4", openrouter: "#6366f1",
  ollama: "#ffffff", groq: "#f55036", deepseek: "#4d6bfe", mistral: "#ff7000",
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

const CATEGORIES: CategoryDef[] = [
  { id: "payment", label: "Pasarelas de pago", emoji: "💳", icon: CreditCard },
  { id: "ai", label: "Proveedores de IA", emoji: "🤖", icon: Brain },
  { id: "messaging", label: "Mensajería", emoji: "📲", icon: MessageSquare },
  { id: "email", label: "Correo", emoji: "📧", icon: Mail },
  { id: "maps", label: "Mapas y ubicación", emoji: "🗺️", icon: MapPin },
  { id: "social", label: "Redes sociales", emoji: "🔗", icon: Share2 },
  { id: "cloud", label: "Almacenamiento", emoji: "☁️", icon: Cloud },
];

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

  for (const [platform, info] of Object.entries(PLATFORM_INFO)) {
    let category = "social";
    if (["telegram", "discord", "slack", "whatsapp", "whatsapp_business", "messenger"].includes(platform)) category = "messaging";
    else if (["gmail"].includes(platform)) category = "email";
    else if (["google_maps", "mapbox"].includes(platform)) category = "maps";
    else if (["youtube", "tiktok"].includes(platform)) category = "social";

    list.push({
      id: `plat_${platform}`, category, label: info.label,
      desc: `Integra ${info.label} con tu negocio`,
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

  useEffect(() => {
    Promise.all([fetchIntegrations(), fetchPaymentIntegrations(), fetchAIProvider()]);
  }, [storeId]);

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
    return CATEGORIES.filter(c => catIds.has(c.id));
  }, [filteredIntegrations]);

  const openDrawer = (integration: IntegrationDef) => {
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
    setDrawerSaving(true);
    const id = selectedIntegration.id;

    try {
      if (id.startsWith("plat_")) {
        const platform = id.replace("plat_", "");
        const res = await fetch("/api/integrations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storeId, platform, credentials: drawerForm }),
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
        });
        const data = await res.json();
        if (!res.ok) { showToast(data.error || "Error al guardar", "error"); return; }
        showToast(`${selectedIntegration.label} conectado correctamente`, "success");
        await fetchPaymentIntegrations();
      }
      setDrawerOpen(false);
    } catch { showToast("Error de conexión", "error"); }
    setDrawerSaving(false);
  };

  const disconnectFromDrawer = async () => {
    if (!selectedIntegration) return;
    const id = selectedIntegration.id;
    try {
      if (id.startsWith("plat_")) {
        const platform = id.replace("plat_", "");
        await fetch(`/api/integrations?storeId=${storeId}&platform=${platform}`, { method: "DELETE" });
        await fetchIntegrations();
      } else if (id.startsWith("ai_")) {
        await fetch(`/api/stores/${storeId}/ai-provider?storeId=${storeId}`, { method: "DELETE" });
        setAiProvider(null);
      } else if (["stripe", "paypal", "mercadopago", "nowpayments"].includes(id)) {
        await fetch(`/api/stores/${storeId}/payment-integrations?provider=${id}`, { method: "DELETE" });
        await fetchPaymentIntegrations();
      }
      showToast(`${selectedIntegration.label} desconectado`, "success");
      setDrawerOpen(false);
    } catch { showToast("Error de conexión", "error"); }
  };

  const testFromDrawer = async () => {
    if (!selectedIntegration || !selectedIntegration.id.startsWith("plat_")) return;
    setDrawerTesting(true);
    const platform = selectedIntegration.id.replace("plat_", "");
    try {
      const res = await fetch("/api/integrations/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, credentials: drawerForm }),
      });
      const data = await res.json();
      if (data.success) showToast(`${selectedIntegration.label} conectado correctamente`, "success");
      else showToast(`Error: ${data.error || "Falló la prueba"}`, "error");
    } catch { showToast("Error de conexión", "error"); }
    setDrawerTesting(false);
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
          Conecta servicios, pasaeros de pago, IA y más a tu negocio.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
        <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          placeholder="Buscar integraciones..."
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
              {catIntegrations.map(integration => (
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
              ))}
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
