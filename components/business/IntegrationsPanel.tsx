"use client";

import { useState, useEffect } from "react";
import { Plug, Send, MessageSquare, MessageCircle, Smartphone, Globe, Check, X, Loader2, Trash2, ExternalLink, Search, DollarSign } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/Toast";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { PLATFORM_INFO } from "@/lib/integration-platforms";

const ICONS: Record<string, any> = {
  Send, MessageSquare, MessageCircle, Smartphone, Globe,
};

interface Integration {
  _id: string;
  platform: string;
  enabled: boolean;
  credentials: Record<string, string>;
}

export default function IntegrationsPanel({ storeId, userEmail }: { storeId: string; userEmail?: string }) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [testing, setTesting] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeOnboarded, setStripeOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    fetchIntegrations();
  }, [storeId]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/stripe/account-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storeId }),
        });
        const d = await res.json();
        if (d.error) { setStripeOnboarded(null); return; }
        setStripeOnboarded(d.onboarded);
      } catch { setStripeOnboarded(null); }
    })();
  }, [storeId]);

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
    const existing = integrations.find(i => i.platform === platform);
    return existing;
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

  const handleConnectStripe = async () => {
    setStripeLoading(true);
    try {
      const res = await fetch("/api/stripe/create-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, email: userEmail }),
      });
      const data = await res.json();
      if (data.error) { showToast(data.error, "error"); return; }
      const linkRes = await fetch("/api/stripe/onboarding-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId }),
      });
      const linkData = await linkRes.json();
      if (linkData.url) window.location.href = linkData.url;
    } catch (err: any) {
      showToast(err?.message || "Error connecting Stripe", "error");
    } finally { setStripeLoading(false); }
  };

  const handleDisconnectStripe = async () => {
    setStripeLoading(true);
    try {
      const res = await fetch("/api/stripe/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId }),
      });
      const data = await res.json();
      if (data.success) {
        setStripeOnboarded(null);
        showToast("Stripe disconnected", "success");
      }
    } catch { showToast("Error disconnecting Stripe", "error"); }
    finally { setStripeLoading(false); }
  };

  const testConnection = async (platform: string) => {
    setTesting(platform);
    try {
      const existing = getConfig(platform);
      const creds: Record<string, string> = {};
      // Merge form data over existing credentials, so saved values are used if not re-typed
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
        {t("integrations.desc")}
      </p>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
        <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          placeholder={t("integrations.search_placeholder")}
          className="w-full bg-zinc-50 pl-11 pr-4 py-3 rounded-2xl border border-zinc-100 outline-none font-medium text-sm focus:bg-white focus:border-red-200 transition-all" />
      </div>

      {/* Stripe Connect card */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-zinc-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${stripeOnboarded ? "bg-green-50 text-green-600" : "bg-zinc-50 text-zinc-400"}`}>
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-black italic text-zinc-950 uppercase tracking-tighter">{t("biz.config_stripe")}</p>
              <span className={`text-[9px] font-bold italic uppercase ${stripeOnboarded ? "text-green-500" : "text-zinc-300"}`}>
                {stripeOnboarded ? t("biz.config_stripe_connected") : t("biz.config_stripe_not_connected")}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {stripeOnboarded ? (
              <button onClick={handleDisconnectStripe} disabled={stripeLoading} className="px-4 py-2.5 rounded-xl font-black text-xs italic transition-all flex items-center gap-1.5 bg-red-50 text-red-400 hover:bg-red-100 disabled:opacity-50">
                {stripeLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                {stripeLoading ? t("integrations.saving") : t("biz.config_stripe_disconnect")}
              </button>
            ) : (
              <button onClick={handleConnectStripe} disabled={stripeLoading} className="px-4 py-2.5 rounded-xl font-black text-xs italic transition-all flex items-center gap-1.5 bg-red-600 text-white hover:bg-red-700 shadow-lg disabled:opacity-50">
                {stripeLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <DollarSign className="w-3.5 h-3.5" />}
                {stripeLoading ? t("integrations.saving") : t("biz.config_stripe_connect")}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(PLATFORM_INFO).filter(([platform, info]) =>
          !searchQuery || platform.toLowerCase().includes(searchQuery.toLowerCase()) ||
          info.label.toLowerCase().includes(searchQuery.toLowerCase())
        ).map(([platform, info]) => {
          const existing = getConfig(platform);
          const Icon = ICONS[info.icon] || Plug;

          return (
            <div key={platform}
              className={`bg-white p-6 rounded-[2.5rem] border shadow-sm transition-all ${
                existing?.enabled ? "border-green-200 ring-1 ring-green-100" : "border-zinc-100"
              }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${existing?.enabled ? "bg-green-50 text-green-600" : "bg-zinc-50 text-zinc-400"}`}>
                    <Icon className="w-4 h-4" />
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
