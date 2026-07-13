"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Mail, Send, Settings, BarChart3, Loader, CheckCircle, XCircle,
  Save, Eye, EyeOff, Megaphone, RefreshCw, Search,
} from "lucide-react";

type EmailSubTab = "settings" | "campaigns" | "metrics";

interface EmailSettingsData {
  fromEmail: string;
  fromName: string;
  welcomeEnabled: boolean;
  passwordResetEnabled: boolean;
  invoiceEnabled: boolean;
  appointmentReminderEnabled: boolean;
  paymentConfirmationEnabled: boolean;
  orderConfirmationEnabled: boolean;
  newClientNotificationEnabled: boolean;
  paymentReceivedNotificationEnabled: boolean;
  [key: string]: boolean | string;
}

interface CustomerData {
  _id: string;
  name: string;
  email: string;
  phone: string;
}

interface EmailLogData {
  _id: string;
  subject: string;
  to: string;
  status: string;
  createdAt: string;
}

interface MetricsData {
  totalSent: number;
  totalFailed: number;
  totalOpened: number;
  totalEmails: number;
  openRate: string;
}

export default function EmailAdminSection() {
  const [subTab, setSubTab] = useState<EmailSubTab>("metrics");

  return (
    <motion.div key="email" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 md:space-y-10">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-red-600 rounded-xl text-white">
          <Mail className="w-5 h-5" />
        </div>
        <div>
          <h3 className="max-[400px]:text-2xl text-3xl font-black italic text-zinc-950 uppercase">Correo <span className="text-red-600">Inteligente</span></h3>
          <p className="text-[9px] md:text-[10px] font-bold text-zinc-400 uppercase tracking-widest italic">Correo · Automatización · Campañas</p>
          <p className="text-[8px] font-wallpoet tracking-[0.2em] text-red-600 uppercase mt-0.5">JANDOSOFT</p>
        </div>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {[
          { id: "metrics" as const, icon: BarChart3, label: "Métricas" },
          { id: "settings" as const, icon: Settings, label: "Configuración" },
          { id: "campaigns" as const, icon: Megaphone, label: "Campañas" },
        ].map((t) => (
          <motion.button
            key={t.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSubTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[9px] font-black italic transition-all ${
              subTab === t.id
                ? "bg-red-600 text-white shadow-md"
                : "bg-zinc-50 text-zinc-500 hover:bg-zinc-100"
            }`}
          >
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </motion.button>
        ))}
      </div>

      {subTab === "settings" && <EmailSettingsForm />}
      {subTab === "campaigns" && <EmailCampaignsForm />}
      {subTab === "metrics" && <EmailMetricsPanel />}
    </motion.div>
  );
}

function EmailSettingsForm() {
  const [settings, setSettings] = useState<EmailSettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message?: string } | null>(null);

  useEffect(() => {
    fetch("/api/email/settings")
      .then((r) => r.json())
      .then((d: { success: boolean; settings: EmailSettingsData }) => { if (d.success) setSettings(d.settings); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/email/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const d = await res.json();
      if (d.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!testEmail) return;
    setTestSending(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/email/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testEmail }),
      });
      const d = await res.json();
      setTestResult({ success: d.success, message: d.error || "Correo de prueba enviado" });
    } catch {
      setTestResult({ success: false, message: "Error de conexión" });
    } finally {
      setTestSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader className="w-5 h-5 animate-spin text-zinc-300" />
      </div>
    );
  }

  const toggles = [
    { key: "welcomeEnabled", label: "Bienvenida al registrarse" },
    { key: "passwordResetEnabled", label: "Recuperación de contraseña" },
    { key: "invoiceEnabled", label: "Factura generada" },
    { key: "appointmentReminderEnabled", label: "Recordatorio de cita" },
    { key: "paymentConfirmationEnabled", label: "Confirmación de pago" },
    { key: "orderConfirmationEnabled", label: "Confirmación de pedido" },
    { key: "newClientNotificationEnabled", label: "Notificación de nuevo cliente" },
    { key: "paymentReceivedNotificationEnabled", label: "Notificación de pago recibido" },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-zinc-50 rounded-2xl p-5 md:p-6 border border-zinc-100 space-y-4">
        <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest italic">Remitente</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Correo remitente</label>
            <input
              value={settings?.fromEmail || ""}
              onChange={(e) => setSettings({ ...settings, fromEmail: e.target.value } as EmailSettingsData)}
              className="w-full h-12 bg-white border border-zinc-100 rounded-xl px-4 text-xs font-medium outline-none focus:ring-2 focus:ring-red-600/50 italic"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Nombre remitente</label>
            <input
              value={settings?.fromName || ""}
              onChange={(e) => setSettings({ ...settings, fromName: e.target.value } as EmailSettingsData)}
              className="w-full h-12 bg-white border border-zinc-100 rounded-xl px-4 text-xs font-medium outline-none focus:ring-2 focus:ring-red-600/50 italic"
            />
          </div>
        </div>
      </div>

      <div className="bg-zinc-50 rounded-2xl p-5 md:p-6 border border-zinc-100 space-y-4">
        <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest italic">Correos Automáticos</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {toggles.map((t) => (
            <label key={t.key} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-zinc-100 cursor-pointer hover:border-red-200 transition-all">
              <input
                type="checkbox"
                checked={settings?.[t.key] === true}
                onChange={(e) => setSettings({ ...settings, [t.key]: e.target.checked } as unknown as EmailSettingsData)}
                className="w-4 h-4 rounded accent-red-600"
              />
              <span className="text-[10px] font-black italic text-zinc-600">{t.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-3 bg-red-600 text-white rounded-xl font-black italic text-[10px] hover:bg-red-700 transition-all shadow-lg shadow-red-100 flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" /> {saving ? "GUARDANDO..." : "GUARDAR CONFIGURACIÓN"}
        </motion.button>
        {saved && (
          <span className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-[9px] font-black italic">
            <CheckCircle className="w-3 h-3" /> Configuración guardada
          </span>
        )}
      </div>

      <div className="bg-zinc-50 rounded-2xl p-5 md:p-6 border border-zinc-100 space-y-4">
        <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest italic">Correo de Prueba</h4>
        <div className="flex gap-3 items-start">
          <div className="flex-1 space-y-1.5">
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              className="w-full h-12 bg-white border border-zinc-100 rounded-xl px-4 text-xs font-medium outline-none focus:ring-2 focus:ring-red-600/50 italic"
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleTest}
            disabled={testSending || !testEmail}
            className="px-5 py-3 bg-zinc-950 text-white rounded-xl font-black italic text-[10px] hover:bg-zinc-800 transition-all flex items-center gap-2 disabled:opacity-50 shrink-0"
          >
            {testSending ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            ENVIAR PRUEBA
          </motion.button>
        </div>
        {testResult && (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[9px] font-black italic ${
            testResult.success ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600"
          }`}>
            {testResult.success ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
            {testResult.message}
          </div>
        )}
      </div>
    </div>
  );
}

function EmailCampaignsForm() {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null);
  const [search, setSearch] = useState("");
  const [singleEmail, setSingleEmail] = useState("");

  useEffect(() => {
    fetch("/api/admin/email-customers")
      .then((r) => r.json())
      .then((d: { customers: CustomerData[] }) => { if (d.customers) setCustomers(d.customers); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = customers.filter(
    (c) => c.email && c.name?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((c) => c._id));
    }
  };

  const handleSend = async () => {
    if (!subject || !content) return;
    if (!singleEmail && selectedIds.length === 0) return;
    setSending(true);
    setResult(null);
    try {
      if (singleEmail) {
        const res = await fetch("/api/email/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to: singleEmail, subject, content }),
        });
        const d = await res.json();
        if (d.success) setResult({ sent: 1, failed: 0 });
        else setResult({ sent: 0, failed: 1 });
      } else {
        const res = await fetch("/api/email/campaigns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ customerIds: selectedIds, subject, content }),
        });
        const d = await res.json();
        if (d.success) setResult(d.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-zinc-50 rounded-2xl p-5 md:p-6 border border-zinc-100 space-y-4">
        <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest italic">Compose</h4>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Asunto</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ej: Oferta especial para ti"
              className="w-full h-12 bg-white border border-zinc-100 rounded-xl px-4 text-xs font-medium outline-none focus:ring-2 focus:ring-red-600/50 italic"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Contenido (HTML permitido)</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escribe el contenido de tu campaña..."
              rows={8}
              className="w-full bg-white border border-zinc-100 rounded-xl p-4 text-xs font-medium outline-none focus:ring-2 focus:ring-red-600/50 italic resize-y"
            />
          </div>
        </div>
      </div>

      <div className="bg-zinc-50 rounded-2xl p-5 md:p-6 border border-zinc-100 space-y-4">
        <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest italic">Enviar a un correo</h4>
        <input
          type="email"
          value={singleEmail}
          onChange={(e) => { setSingleEmail(e.target.value); if (e.target.value) setSelectedIds([]); }}
          placeholder="correo@ejemplo.com (deja vacío para usar clientes)"
          className="w-full h-12 bg-white border border-zinc-100 rounded-xl px-4 text-xs font-medium outline-none focus:ring-2 focus:ring-red-600/50 italic"
        />
      </div>

      <div className="bg-zinc-50 rounded-2xl p-5 md:p-6 border border-zinc-100 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest italic">
            Clientes ({filtered.length})
          </h4>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-300" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="w-40 h-9 bg-white border border-zinc-100 rounded-xl pl-9 pr-3 text-[9px] font-medium outline-none focus:ring-2 focus:ring-red-600/50 italic"
              />
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={toggleAll}
              className="px-3 py-2 bg-white border border-zinc-100 rounded-xl text-[8px] font-black italic text-zinc-500 hover:bg-zinc-50 transition-all"
            >
              {selectedIds.length === filtered.length ? "DESELECCIONAR" : "SELECCIONAR TODOS"}
            </motion.button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="w-5 h-5 animate-spin text-zinc-300" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center italic font-black uppercase tracking-widest text-zinc-200 text-[10px]">Sin clientes</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
            {filtered.map((c) => (
              <label
                key={c._id}
                className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedIds.includes(c._id)
                    ? "bg-red-50 border-red-200"
                    : "bg-white border-zinc-100 hover:border-zinc-200"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(c._id)}
                  onChange={() => {
                    setSelectedIds((prev) =>
                      prev.includes(c._id)
                        ? prev.filter((id) => id !== c._id)
                        : [...prev, c._id]
                    );
                  }}
                  className="w-4 h-4 rounded accent-red-600"
                />
                <div className="min-w-0">
                  <p className="text-[10px] font-black italic text-zinc-950 truncate">{c.name}</p>
                  <p className="text-[8px] font-medium text-zinc-400 truncate">{c.email}</p>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleSend}
          disabled={sending || (!singleEmail && selectedIds.length === 0) || !subject || !content}
          className="px-6 py-3 bg-red-600 text-white rounded-xl font-black italic text-[10px] hover:bg-red-700 transition-all shadow-lg shadow-red-100 flex items-center gap-2 disabled:opacity-50"
        >
          {sending ? (
            <Loader className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
          {sending ? "ENVIANDO..." : `ENVIAR A ${selectedIds.length} CLIENTE(S)`}
        </motion.button>

        {result && (
          <div className="flex items-center gap-3 px-4 py-2 bg-emerald-50 rounded-xl">
            <span className="text-[9px] font-black italic text-emerald-700">
              <CheckCircle className="w-3 h-3 inline mr-1" />
              {result.sent} enviados
            </span>
            {result.failed > 0 && (
              <span className="text-[9px] font-black italic text-rose-600">
                <XCircle className="w-3 h-3 inline mr-1" />
                {result.failed} fallidos
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EmailMetricsPanel() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [logs, setLogs] = useState<EmailLogData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    try {
      const [mRes, lRes] = await Promise.all([
        fetch("/api/email/metrics"),
        fetch("/api/email/logs?limit=10"),
      ]);
      const m = await mRes.json();
      const l = await lRes.json();
      if (m.success) setMetrics(m.metrics);
      if (l.success) setLogs(l.logs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMetrics(); }, [fetchMetrics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader className="w-5 h-5 animate-spin text-zinc-300" />
      </div>
    );
  }

  const cards = [
    { label: "Enviados", value: metrics?.totalSent ?? 0, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Fallidos", value: metrics?.totalFailed ?? 0, color: "text-rose-600", bg: "bg-rose-50" },
    { label: "Tasa de apertura", value: metrics?.openRate ?? "0.0%", color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Totales", value: metrics?.totalEmails ?? 0, color: "text-zinc-950", bg: "bg-zinc-50" },
  ];

  const statusIcon = (status: string) => {
    switch (status) {
      case "sent": return <CheckCircle className="w-3 h-3 text-emerald-500" />;
      case "failed": return <XCircle className="w-3 h-3 text-rose-500" />;
      case "opened": return <Eye className="w-3 h-3 text-blue-500" />;
      case "clicked": return <EyeOff className="w-3 h-3 text-purple-500" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {cards.map((card) => (
          <div key={card.label} className={`${card.bg} rounded-2xl p-4 md:p-5 border border-zinc-100`}>
            <p className="text-[8px] font-black text-zinc-400 uppercase italic tracking-widest">{card.label}</p>
            <p className={`text-xl md:text-2xl font-black italic mt-1 ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-zinc-50 rounded-2xl p-5 md:p-6 border border-zinc-100 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest italic">Últimos Correos</h4>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={fetchMetrics}
            className="p-2 bg-white border border-zinc-100 rounded-xl hover:bg-zinc-50 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5 text-zinc-400" />
          </motion.button>
        </div>

        {logs.length === 0 ? (
          <div className="py-8 text-center italic font-black uppercase tracking-widest text-zinc-200 text-[10px]">Sin actividad</div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log._id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-zinc-100">
                <div className="flex items-center gap-3 min-w-0">
                  {statusIcon(log.status)}
                  <div className="min-w-0">
                    <p className="text-[10px] font-black italic text-zinc-950 truncate">{log.subject}</p>
                    <p className="text-[8px] font-medium text-zinc-400">{log.to}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-[8px] font-black italic uppercase ${
                    log.status === "sent" ? "text-emerald-600" :
                    log.status === "failed" ? "text-rose-600" :
                    log.status === "opened" ? "text-blue-600" : "text-purple-600"
                  }`}>{log.status}</span>
                  <p className="text-[7px] text-zinc-300 font-medium">
                    {new Date(log.createdAt).toLocaleString("es", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
