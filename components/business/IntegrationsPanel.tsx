"use client";

import { useState, useEffect } from "react";
import { Plug, Send, Check, X, Loader2, Trash2, ExternalLink, Search, Star, Brain, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/Toast";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { PLATFORM_INFO } from "@/lib/integration-platforms";
import {
  SiStripe, SiPaypal, SiMercadopago, SiBitcoin,
  SiTelegram, SiDiscord, SiWhatsapp,
  SiInstagram, SiFacebook, SiX, SiThreads, SiYoutube,
  SiGooglemaps, SiMapbox, SiGmail, SiMessenger, SiTiktok,
  SiAnthropic, SiGooglegemini, SiOllama, SiDeepseek, SiOpenrouter,
} from "react-icons/si";
import { TbBrandSlack, TbBrandTwilio } from "react-icons/tb";

const PAYMENT_ICONS: Record<string, any> = {
  stripe: SiStripe,
  paypal: SiPaypal,
  mercadopago: SiMercadopago,
  nowpayments: SiBitcoin,
};

const PAYMENT_COLORS: Record<string, string> = {
  stripe: "#635BFF",
  paypal: "#003087",
  mercadopago: "#009EE3",
  nowpayments: "#6C3EC1",
};

const REACT_ICONS: Record<string, any> = {
  SiTelegram, SiDiscord, SiWhatsapp,
  SiInstagram, SiFacebook, SiX, SiThreads, SiYoutube,
  SiGooglemaps, SiMapbox, SiGmail, SiMessenger, SiTiktok,
  TbBrandSlack, TbBrandTwilio,
};

const ICON_COLORS: Record<string, string> = {
  telegram: "#26A5E4",
  discord: "#5865F2",
  slack: "#4A154B",
  twilio: "#F22F46",
  whatsapp: "#25D366",
  whatsapp_business: "#25D366",
  instagram: "#E4405F",
  facebook: "#1877F2",
  twitter: "#000000",
  threads: "#000000",
  youtube: "#FF0000",
  google_maps: "#4285F4",
  mapbox: "#4264FB",
  gmail: "#EA4335",
  messenger: "#00B2FF",
  tiktok: "#000000",
};

const AI_PROVIDER_ICONS: Record<string, any> = {
  openai: Brain,
  anthropic: SiAnthropic,
  gemini: SiGooglegemini,
  openrouter: SiOpenrouter,
  ollama: SiOllama,
  groq: Zap,
  deepseek: SiDeepseek,
  custom: Plug,
};

const AI_PROVIDER_COLORS: Record<string, string> = {
  openai: "#10a37f",
  anthropic: "#d4a574",
  gemini: "#4285f4",
  openrouter: "#6366f1",
  ollama: "#ffffff",
  groq: "#f55036",
  deepseek: "#4d6bfe",
  custom: "#71717a",
};

const AI_PROVIDERS_LIST = [
  { id: "openai", label: "OpenAI", models: ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini", "gpt-4.1", "o3-mini"] },
  { id: "anthropic", label: "Anthropic", models: ["claude-sonnet-4-20250514", "claude-3-5-haiku-20241022"] },
  { id: "gemini", label: "Google Gemini", models: ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-2.5-pro"] },
  { id: "openrouter", label: "OpenRouter", models: ["openai/gpt-4o-mini", "openai/gpt-4o", "anthropic/claude-3.5-sonnet", "deepseek/deepseek-chat"] },
  { id: "ollama", label: "Ollama (Local)", models: ["llama3.1", "mistral", "codellama", "phi3"] },
  { id: "groq", label: "Groq", models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"] },
  { id: "deepseek", label: "DeepSeek", models: ["deepseek-chat", "deepseek-reasoner"] },
  { id: "custom", label: "Custom OpenAI-Compatible", models: [] },
];

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
  config: { id: string; label: string; icon: string; fields: { key: string; label: string; placeholder: string; secret?: boolean }[]; docsUrl?: string } | null;
}

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

export default function IntegrationsPanel({ storeId, userEmail }: { storeId: string; userEmail?: string }) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [testing, setTesting] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentIntegrations, setPaymentIntegrations] = useState<PaymentIntegration[]>([]);
  const [paymentLoading, setPaymentLoading] = useState(true);
  const [paymentSaving, setPaymentSaving] = useState<string | null>(null);
  const [expandedPayment, setExpandedPayment] = useState<string | null>(null);
  const [paymentForm, setPaymentForm] = useState<Record<string, Record<string, string>>>({});
  const [aiProvider, setAiProvider] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(true);
  const [aiSaving, setAiSaving] = useState(false);
  const [aiProviderId, setAiProviderId] = useState("openai");
  const [aiApiKey, setAiApiKey] = useState("");
  const [aiBaseUrl, setAiBaseUrl] = useState("");
  const [aiModel, setAiModel] = useState("");

  useEffect(() => {
    fetchIntegrations();
    fetchPaymentIntegrations();
    fetchAIProvider();
  }, [storeId]);

  const fetchAIProvider = async () => {
    setAiLoading(true);
    try {
      const res = await fetch(`/api/stores/${storeId}/ai-provider`);
      const data = await res.json();
      if (data.aiProvider) {
        setAiProvider(data.aiProvider);
        setAiProviderId(data.aiProvider.provider || "openai");
        setAiModel(data.aiProvider.model || "");
        setAiBaseUrl(data.aiProvider.baseUrl || "");
      }
    } catch {}
    setAiLoading(false);
  };

  const saveAIProvider = async () => {
    setAiSaving(true);
    try {
      const providerConfig = AI_PROVIDERS_LIST.find(p => p.id === aiProviderId);
      const res = await fetch(`/api/stores/${storeId}/ai-provider`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId,
          provider: aiProviderId,
          apiKey: aiApiKey,
          baseUrl: aiBaseUrl || (aiProviderId === "ollama" ? "http://localhost:11434/v1" : ""),
          model: aiModel || providerConfig?.models?.[0] || "",
        }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "Error al guardar", "error"); return; }
      showToast("Proveedor de IA configurado correctamente", "success");
      setAiApiKey("");
      await fetchAIProvider();
    } catch {
      showToast("Error de conexión", "error");
    } finally {
      setAiSaving(false);
    }
  };

  const toggleAIProvider = async (enabled: boolean) => {
    try {
      await fetch(`/api/stores/${storeId}/ai-provider`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, enabled }),
      });
      await fetchAIProvider();
    } catch {}
  };

  const deleteAIProvider = async () => {
    try {
      await fetch(`/api/stores/${storeId}/ai-provider?storeId=${storeId}`, { method: "DELETE" });
      setAiProvider(null);
      showToast("Proveedor de IA desconectado", "success");
    } catch {}
  };

  const fetchPaymentIntegrations = async () => {
    setPaymentLoading(true);
    try {
      const res = await fetch(`/api/stores/${storeId}/payment-integrations`);
      const data = await res.json();
      setPaymentIntegrations(data.integrations || []);
    } catch {}
    setPaymentLoading(false);
  };

  const fetchIntegrations = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/integrations?storeId=${storeId}`);
      const data = await res.json();
      if (data.success) setIntegrations(data.integrations);
    } catch {
      showToast(t("integrations.error_load"), "error");
    } finally {
      setLoading(false);
    }
  };

  const getConfig = (platform: string) => {
    return integrations.find(i => i.platform === platform);
  };

  const saveIntegration = async (platform: string) => {
    setSaving(platform);
    try {
      const res = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, platform, credentials: formData }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || t("integrations.error_save"), "error"); return; }
      showToast(t("integrations.configured").replace("{platform}", PLATFORM_INFO[platform]?.label || ""), "success");
      await fetchIntegrations();
    } catch {
      showToast(t("integrations.error_connection"), "error");
    } finally {
      setSaving(null);
    }
  };

  const deleteIntegration = async (platform: string) => {
    try {
      const res = await fetch(`/api/integrations?storeId=${storeId}&platform=${platform}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || t("integrations.error_delete"), "error"); return; }
      showToast(t("integrations.deleted").replace("{platform}", PLATFORM_INFO[platform]?.label || ""), "success");
      await fetchIntegrations();
    } catch {
      showToast(t("integrations.error_connection"), "error");
    }
  };

  const toggleEnabled = async (platform: string, current: boolean) => {
    try {
      const res = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, platform, credentials: formData, enabled: !current }),
      });
      if (!res.ok) { showToast(t("integrations.error_toggle"), "error"); return; }
      await fetchIntegrations();
    } catch {
      showToast(t("integrations.error_connection"), "error");
    }
  };

  const savePaymentProvider = async (provider: string) => {
    setPaymentSaving(provider);
    try {
      const creds = paymentForm[provider] || {};
      const res = await fetch(`/api/stores/${storeId}/payment-integrations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, provider, credentials: creds }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "Error al guardar", "error"); return; }
      showToast(`${provider} conectado correctamente`, "success");
      setExpandedPayment(null);
      await fetchPaymentIntegrations();
    } catch {
      showToast("Error de conexión", "error");
    } finally {
      setPaymentSaving(null);
    }
  };

  const togglePaymentDefault = async (provider: string) => {
    try {
      await fetch(`/api/stores/${storeId}/payment-integrations`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, provider, isDefault: true }),
      });
      await fetchPaymentIntegrations();
    } catch {}
  };

  const togglePaymentEnabled = async (provider: string, current: boolean) => {
    try {
      await fetch(`/api/stores/${storeId}/payment-integrations`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, provider, enabled: !current }),
      });
      await fetchPaymentIntegrations();
    } catch {}
  };

  const deletePaymentProvider = async (provider: string) => {
    try {
      await fetch(`/api/stores/${storeId}/payment-integrations?provider=${provider}`, { method: "DELETE" });
      showToast(`${provider} desconectado`, "success");
      await fetchPaymentIntegrations();
    } catch {}
  };

  const testConnection = async (platform: string) => {
    setTesting(platform);
    try {
      const existing = getConfig(platform);
      const creds: Record<string, string> = {};
      const platformInfo = PLATFORM_INFO[platform];
      if (platformInfo) {
        for (const field of platformInfo.fields) {
          creds[field.key] = formData[field.key] ?? existing?.credentials?.[field.key] ?? "";
        }
      }
      const res = await fetch("/api/integrations/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, credentials: creds }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(t("integrations.test_success").replace("{platform}", PLATFORM_INFO[platform]?.label || ""), "success");
      } else {
        showToast(t("integrations.test_error").replace("{platform}", PLATFORM_INFO[platform]?.label || "").replace("{error}", data.error || "Error"), "error");
      }
    } catch {
      showToast(t("integrations.error_connection"), "error");
    } finally {
      setTesting(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <h3 className="text-2xl max-[400px]:text-xl font-black italic text-zinc-950 uppercase tracking-tighter">
          <Plug className="w-6 h-6 max-[400px]:w-5 max-[400px]:h-5 inline mr-3 text-red-600" />{t("integrations.title")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-40 bg-zinc-50 rounded-[2rem] animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h3 className="text-2xl max-[400px]:text-xl font-black italic text-zinc-950 uppercase tracking-tighter">
        <Plug className="w-6 h-6 max-[400px]:w-5 max-[400px]:h-5 inline mr-3 text-red-600" />{t("integrations.title")}
      </h3>
      <p className="text-xs font-medium text-zinc-400 italic -mt-4">
        Configura los proveedores de pago de tu empresa y las integraciones con tus servicios favoritos.
      </p>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
        <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          placeholder={t("integrations.search_placeholder")}
          className="w-full bg-zinc-50 pl-11 pr-4 py-3 rounded-2xl border border-zinc-100 outline-none font-medium text-sm focus:bg-white focus:border-red-200 transition-all" />
      </div>

      {/* PAYMENT PROVIDERS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-black italic text-zinc-950 uppercase tracking-tight">Proveedores de Pago</h4>
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest italic">Conecta Stripe, PayPal, Mercado Pago o NOWPayments</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {["stripe", "paypal", "mercadopago", "nowpayments"].map((provider) => {
            const pi = paymentIntegrations.find(p => p.provider === provider);
            const Icon = PAYMENT_ICONS[provider] || SiBitcoin;
            const isExpanded = expandedPayment === provider;
            const fields = PAYMENT_FIELDS[provider] || [];

            return (
              <div key={provider}
                className={`bg-white p-5 rounded-[2rem] border shadow-sm transition-all ${
                  pi?.enabled ? "border-green-200 ring-1 ring-green-100" : "border-zinc-100"
                }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl" style={{ backgroundColor: pi?.enabled ? PAYMENT_COLORS[provider] + "15" : "#f4f4f5" }}>
                      <Icon className="w-4 h-4" style={{ color: pi?.enabled ? PAYMENT_COLORS[provider] : "#a1a1aa" }} />
                    </div>
                    <div>
                      <p className="text-sm font-black italic text-zinc-950 uppercase tracking-tighter">{provider === "mercadopago" ? "Mercado Pago" : provider === "nowpayments" ? "NOWPayments" : provider}</p>
                      {pi?.enabled ? (
                        <span className="text-[9px] font-bold italic uppercase text-green-500">
                          {pi.isDefault ? "Conectado (Predeterminado)" : "Conectado"}
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold italic uppercase text-zinc-300">No conectado</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {pi?.enabled && (
                      <motion.button whileTap={{ scale: 0.9 }}
                        onClick={() => togglePaymentDefault(provider)}
                        className={`p-1.5 rounded-lg transition-all ${pi.isDefault ? "bg-amber-50 text-amber-500" : "bg-zinc-50 text-zinc-300 hover:text-amber-500"}`}
                        title="Predeterminado">
                        <Star className="w-3.5 h-3.5" />
                      </motion.button>
                    )}
                    {pi?.enabled && (
                      <motion.button whileTap={{ scale: 0.9 }}
                        onClick={() => togglePaymentEnabled(provider, true)}
                        className="p-1.5 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 transition-all">
                        <X className="w-3.5 h-3.5" />
                      </motion.button>
                    )}
                  </div>
                </div>

                {pi?.enabled && !isExpanded ? (
                  <div className="flex gap-2">
                    <button onClick={() => { setExpandedPayment(provider); }}
                      className="px-4 py-2 bg-zinc-50 text-zinc-600 rounded-xl font-black text-[10px] italic hover:bg-zinc-100 transition-all">
                      Editar
                    </button>
                    <button onClick={() => deletePaymentProvider(provider)}
                      className="px-4 py-2 bg-red-50 text-red-400 rounded-xl font-black text-[10px] italic hover:bg-red-100 transition-all">
                      Desconectar
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {fields.map(field => (
                      <div key={field.key} className="space-y-1">
                        <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{field.label}</label>
                        <input type={field.secret ? "password" : "text"}
                          value={paymentForm[provider]?.[field.key] ?? pi?.hasCredentials ? "••••••••" : ""}
                          onChange={e => setPaymentForm(prev => ({ ...prev, [provider]: { ...prev[provider], [field.key]: e.target.value } }))}
                          placeholder={field.placeholder}
                          className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm" />
                      </div>
                    ))}
                    <div className="flex gap-2 pt-1">
                      <motion.button whileTap={{ scale: 0.95 }}
                        onClick={() => savePaymentProvider(provider)}
                        disabled={paymentSaving === provider}
                        className="px-5 py-2.5 bg-red-600 text-white rounded-xl font-black text-xs italic hover:bg-red-700 transition-all disabled:opacity-50 flex items-center gap-1.5">
                        {paymentSaving === provider ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                        {paymentSaving === provider ? "Guardando..." : "Conectar"}
                      </motion.button>
                      <button onClick={() => setExpandedPayment(null)}
                        className="px-4 py-2.5 bg-zinc-50 text-zinc-400 rounded-xl font-black text-xs italic hover:bg-zinc-100 transition-all">
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="w-full h-px bg-zinc-100" />

      {/* AI PROVIDER */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-black italic text-zinc-950 uppercase tracking-tight flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" /> Proveedor de IA
            </h4>
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest italic">
              Configura tu propia API de inteligencia artificial para el agente
            </p>
          </div>
        </div>

        {aiProvider?.enabled ? (
          <div className="bg-white p-5 rounded-[2rem] border border-green-200 ring-1 ring-green-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl" style={{ backgroundColor: (AI_PROVIDER_COLORS[aiProvider.provider] || "#71717a") + "15" }}>
                  {(() => { const I = AI_PROVIDER_ICONS[aiProvider.provider]; return I ? <I className="w-4 h-4" style={{ color: AI_PROVIDER_COLORS[aiProvider.provider] }} /> : <Brain className="w-4 h-4" />; })()}
                </div>
                <div>
                  <p className="text-sm font-black italic text-zinc-950 uppercase tracking-tighter">
                    {AI_PROVIDERS_LIST.find(p => p.id === aiProvider.provider)?.label || aiProvider.provider}
                  </p>
                  <span className="text-[9px] font-bold italic uppercase text-green-500">
                    Activo — Modelo: {aiProvider.model}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <motion.button whileTap={{ scale: 0.9 }}
                  onClick={() => toggleAIProvider(false)}
                  className="p-1.5 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 transition-all"
                  title="Desactivar">
                  <X className="w-3.5 h-3.5" />
                </motion.button>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setAiProvider(null); }}
                className="px-4 py-2 bg-zinc-50 text-zinc-600 rounded-xl font-black text-[10px] italic hover:bg-zinc-100 transition-all">
                Cambiar proveedor
              </button>
              <button onClick={deleteAIProvider}
                className="px-4 py-2 bg-red-50 text-red-400 rounded-xl font-black text-[10px] italic hover:bg-red-100 transition-all">
                Desconectar
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white p-5 rounded-[2rem] border border-zinc-100 shadow-sm space-y-4">
            <p className="text-[10px] font-bold text-zinc-400 italic">
              Elige un proveedor para que tu agente IA funcione con tu propia API key.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {AI_PROVIDERS_LIST.map(p => {
                const I = AI_PROVIDER_ICONS[p.id];
                return (
                  <button key={p.id} onClick={() => { setAiProviderId(p.id); setAiModel(p.models[0] || ""); setAiBaseUrl(p.id === "ollama" ? "http://localhost:11434/v1" : ""); }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      aiProviderId === p.id ? "border-red-200 bg-red-50 ring-1 ring-red-100" : "border-zinc-100 hover:bg-zinc-50"
                    }`}>
                    <div className="flex items-center gap-2 mb-1">
                      {I && <I className="w-3.5 h-3.5" style={{ color: AI_PROVIDER_COLORS[p.id] }} />}
                      <span className="text-[10px] font-black italic text-zinc-700 uppercase">{p.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="space-y-3">
              {aiProviderId !== "ollama" && (
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">API Key</label>
                  <input type="password" value={aiApiKey} onChange={e => setAiApiKey(e.target.value)}
                    placeholder="Tu API key del proveedor"
                    className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm" />
                </div>
              )}
              {(aiProviderId === "ollama" || aiProviderId === "custom") && (
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Base URL</label>
                  <input type="text" value={aiBaseUrl} onChange={e => setAiBaseUrl(e.target.value)}
                    placeholder={aiProviderId === "ollama" ? "http://localhost:11434/v1" : "https://tu-servidor.com/v1"}
                    className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm" />
                </div>
              )}
              <div className="space-y-1">
                <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Modelo</label>
                {(() => {
                  const pc = AI_PROVIDERS_LIST.find(p => p.id === aiProviderId);
                  if (pc && pc.models.length > 0) {
                    return (
                      <select value={aiModel} onChange={e => setAiModel(e.target.value)}
                        className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm">
                        {pc.models.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    );
                  }
                  return (
                    <input type="text" value={aiModel} onChange={e => setAiModel(e.target.value)}
                      placeholder="nombre-del-modelo"
                      className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm" />
                  );
                })()}
              </div>
              <motion.button whileTap={{ scale: 0.95 }}
                onClick={saveAIProvider} disabled={aiSaving || (!aiApiKey && aiProviderId !== "ollama")}
                className="px-5 py-2.5 bg-purple-600 text-white rounded-xl font-black text-xs italic hover:bg-purple-700 transition-all disabled:opacity-50 flex items-center gap-1.5">
                {aiSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                {aiSaving ? "Guardando..." : "Conectar proveedor de IA"}
              </motion.button>
            </div>
          </div>
        )}
      </div>

      <div className="w-full h-px bg-zinc-100" />

      {/* OTHER INTEGRATIONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(PLATFORM_INFO).filter(([platform, info]) =>
          !searchQuery || platform.toLowerCase().includes(searchQuery.toLowerCase()) ||
          info.label.toLowerCase().includes(searchQuery.toLowerCase())
        ).map(([platform, info]) => {
          const existing = getConfig(platform);
          const Icon = REACT_ICONS[info.icon] || Plug;
          const iconColor = ICON_COLORS[platform] || "#71717a";

          return (
            <div key={platform}
              className={`bg-white p-6 rounded-[2.5rem] border shadow-sm transition-all ${
                existing?.enabled ? "border-green-200 ring-1 ring-green-100" : "border-zinc-100"
              }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${existing?.enabled ? "bg-green-50" : "bg-zinc-50"}`}>
                    <Icon className="w-5 h-5" style={{ color: existing?.enabled ? iconColor : "#a1a1aa" }} />
                  </div>
                  <div>
                    <p className="text-sm font-black italic text-zinc-950 uppercase tracking-tighter">{info.label}</p>
                    {existing && (
                      <span className={`text-[9px] font-bold italic uppercase ${existing.enabled ? "text-green-500" : "text-zinc-300"}`}>
                        {existing.enabled ? t("integrations.connected") : t("integrations.disconnected")}
                      </span>
                    )}
                  </div>
                </div>
                {existing && (
                  <div className="flex items-center gap-1.5">
                    <motion.button whileTap={{ scale: 0.9 }}
                      onClick={() => toggleEnabled(platform, existing.enabled)}
                      className={`p-2 rounded-lg transition-all ${
                        existing.enabled ? "bg-green-50 text-green-600" : "bg-zinc-50 text-zinc-300"
                      }`}>
                      {existing.enabled ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    </motion.button>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {info.fields.map(field => (
                  <div key={field.key} className="space-y-1">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{field.label}</label>
                    <input type={field.secret ? "password" : "text"}
                      value={formData[field.key] ?? existing?.credentials?.[field.key] ?? ""}
                      onChange={e => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm" />
                  </div>
                ))}
                <div className="flex gap-2 pt-2 flex-wrap">
                  <motion.button whileTap={{ scale: 0.95 }}
                    onClick={() => saveIntegration(platform)} disabled={saving === platform}
                    className="px-5 py-2.5 bg-red-600 text-white rounded-xl font-black text-xs italic hover:bg-red-700 transition-all disabled:opacity-50 flex items-center gap-1.5">
                    {saving === platform ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                    {saving === platform ? t("integrations.saving") : t("integrations.save")}
                  </motion.button>
                  {existing && (
                    <>
                      <motion.button whileTap={{ scale: 0.95 }}
                        onClick={() => testConnection(platform)} disabled={testing === platform}
                        className="px-4 py-2.5 bg-zinc-100 text-zinc-600 rounded-xl font-black text-xs italic hover:bg-zinc-200 transition-all disabled:opacity-50 flex items-center gap-1.5">
                        {testing === platform ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                        {t("integrations.test")}
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.95 }}
                        onClick={() => toggleEnabled(platform, existing.enabled)}
                        className={`px-4 py-2.5 rounded-xl font-black text-xs italic transition-all flex items-center gap-1.5 ${
                          existing.enabled ? "bg-rose-50 text-rose-600 hover:bg-rose-100" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                        }`}>
                        {existing.enabled ? <X className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                        {existing.enabled ? t("integrations.disconnect") : t("integrations.connect")}
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.9 }}
                        onClick={() => deleteIntegration(platform)}
                        className="p-2.5 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </motion.button>
                    </>
                  )}
                  {info.docs && (
                    <a href={info.docs} target="_blank" rel="noopener noreferrer"
                      className="px-4 py-2.5 bg-zinc-50 text-zinc-400 rounded-xl font-black text-xs italic hover:bg-zinc-100 transition-all flex items-center gap-1.5">
                      <ExternalLink className="w-3 h-3" /> {t("integrations.guide")}
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {searchQuery && Object.entries(PLATFORM_INFO).filter(([platform, info]) =>
          platform.toLowerCase().includes(searchQuery.toLowerCase()) ||
          info.label.toLowerCase().includes(searchQuery.toLowerCase())
        ).length === 0 && (
          <div className="col-span-full text-center py-12">
            <Plug className="w-8 h-8 text-zinc-200 mx-auto mb-3" />
            <p className="text-sm font-medium text-zinc-300 italic">{t("biz.no_search_results").replace("{query}", searchQuery)}</p>
          </div>
        )}
      </div>
    </div>
  );
}
