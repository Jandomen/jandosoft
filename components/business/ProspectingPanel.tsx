"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, MapPin, Clock, Zap, Loader2, Settings, Play, Power, Mail, MessageSquare, Phone, RefreshCw, CheckCircle2, XCircle, BarChart3 } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useToast } from "@/components/ui/Toast";

export default function ProspectingPanel({ storeId }: { storeId: string }) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [cfg, setCfg] = useState<any>({
    enabled: false,
    location: "",
    category: "restaurant",
    customKeyword: "",
    radius: 2000,
    maxResults: 10,
    intervalHours: 24,
    autoOutreach: true,
    outreachChannel: "email",
    lastRunAt: null,
  });

  const CATEGORIES = [
    { keyword: "restaurant", label: "Restaurante" },
    { keyword: "store", label: "Tienda" },
    { keyword: "doctor", label: "Clínica" },
    { keyword: "beauty_salon", label: "Belleza" },
    { keyword: "gym", label: "Gym" },
    { keyword: "school", label: "Escuela" },
    { keyword: "lawyer", label: "Abogado" },
    { keyword: "auto_repair", label: "Taller" },
  ];

  const [progress, setProgress] = useState<any>({ tasks: [], customers: 0, appointments: 0 });
  const [progressLoading, setProgressLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/stores/${storeId}/prospecting`);
      const data = await res.json();
      if (data.prospectingConfig) setCfg({ ...cfg, ...data.prospectingConfig });
    } catch {} finally { setLoading(false); }
  };

  const loadProgress = async () => {
    try {
      setProgressLoading(true);
      const [tasksRes, custRes, apptRes] = await Promise.all([
        fetch(`/api/scheduler/tasks`).then(r => r.json()).catch(() => ({ tasks: [] })),
        fetch(`/api/customers?storeId=${storeId}`).then(r => r.json()).catch(() => ({ customers: [] })),
        fetch(`/api/appointments?storeId=${storeId}&limit=50`).then(r => r.json()).catch(() => ({ appointments: [] })),
      ]);
      const prospectTasks = (tasksRes.tasks || []).filter((t: any) => t.type?.startsWith("prospect") || t.payload?.storeId === storeId);
      const prospectCustomers = (custRes.customers || []).filter((c: any) => (c.tags || []).includes("prospecting") || c.source === "ai");
      setProgress({ tasks: prospectTasks.slice(0, 8), customers: prospectCustomers.length, appointments: (apptRes.appointments || []).length, allTasks: tasksRes.tasks || [] });
    } catch {} finally { setProgressLoading(false); }
  };

  useEffect(() => { load(); loadProgress(); }, [storeId]);

  const save = async () => {
    if (cfg.enabled && !cfg.location.trim()) {
      showToast("Location es requerido", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/stores/${storeId}/prospecting`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cfg),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCfg(data.prospectingConfig);
      showToast(data.message || "Guardado", "success");
    } catch (e: any) {
      showToast(e.message || "Error", "error");
    } finally { setSaving(false); }
  };

  const runNow = async () => {
    if (!cfg.enabled || !cfg.location.trim()) {
      showToast("Guarda primero: activa Prospecting y pon ubicación (ej: Madrid, España)", "error");
      return;
    }
    setRunning(true);
    try {
      const res = await fetch(`/api/stores/${storeId}/prospecting`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast("Prospecting encolado — corre en 1-2 min via scheduler", "success");
      loadProgress();
    } catch (e: any) {
      showToast(e.message || "Error", "error");
    } finally { setRunning(false); }
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-zinc-300" /></div>;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl text-white"><Zap className="w-5 h-5" /></div>
          <div>
            <h3 className="text-base md:text-lg font-black italic uppercase tracking-tighter text-zinc-950">Prospecting Autónomo</h3>
            <p className="text-[11px] text-zinc-500 font-medium italic">Busca clientes y los contacta solo • OSM/Google Maps → Customer → Outreach</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-full text-[9px] font-black italic border ${cfg.enabled ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-zinc-100 text-zinc-500 border-zinc-200"}`}>
            {cfg.enabled ? "ACTIVO" : "PAUSADO"}
          </span>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setCfg({ ...cfg, enabled: !cfg.enabled })} className={`p-2 rounded-xl ${cfg.enabled ? "bg-emerald-600 text-white" : "bg-zinc-200 text-zinc-600"}`}>
            <Power className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* Power banner */}
      <div className={`rounded-2xl p-4 border flex items-start gap-3 ${cfg.enabled ? "bg-violet-50 border-violet-200" : "bg-amber-50 border-amber-200"}`}>
        <Settings className={`w-4 h-4 mt-0.5 ${cfg.enabled ? "text-violet-600" : "text-amber-600"}`} />
        <div className="text-[11px] font-medium">
          <p className={cfg.enabled ? "text-violet-800" : "text-amber-800"}>
            {cfg.enabled ? "✓ Cada intervalo busca nuevos leads, los crea como Customer (tag prospecting) y les envía outreach automático + followups 24h/48h. Luego agenda recordatorios T-24h/T-1h si reservan." : "Activa para que empiece a prospectar solo. Necesitas location + categoría."}
          </p>
          {cfg.lastRunAt && <p className="text-[10px] text-zinc-500 mt-1">Última ejecución: {new Date(cfg.lastRunAt).toLocaleString()}</p>}
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-4 md:p-6 space-y-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="text-[9px] font-black text-zinc-400 uppercase italic tracking-widest ml-1">Ubicación *</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-300" />
              <input value={cfg.location} onChange={e => setCfg({ ...cfg, location: e.target.value })} placeholder="Ej: Madrid, España o Polanco, CDMX" className="w-full bg-zinc-50 pl-9 pr-3 py-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-violet-200" />
            </div>
          </div>
          <div>
            <label className="text-[9px] font-black text-zinc-400 uppercase italic tracking-widest ml-1">Categoría</label>
            <select value={cfg.category} onChange={e => setCfg({ ...cfg, category: e.target.value })} className="w-full bg-zinc-50 px-3 py-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium">
              {CATEGORIES.map(c => <option key={c.keyword} value={c.keyword}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[9px] font-black text-zinc-400 uppercase italic tracking-widest ml-1">Keyword personalizado (opcional)</label>
            <input value={cfg.customKeyword} onChange={e => setCfg({ ...cfg, customKeyword: e.target.value })} placeholder="Ej: pizzeria, barberia" className="w-full bg-zinc-50 px-3 py-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-violet-200" />
          </div>
          <div>
            <label className="text-[9px] font-black text-zinc-400 uppercase italic tracking-widest ml-1">Radio: {cfg.radius}m</label>
            <input type="range" min={500} max={5000} step={100} value={cfg.radius} onChange={e => setCfg({ ...cfg, radius: parseInt(e.target.value) })} className="w-full accent-violet-600 mt-2" />
          </div>
          <div>
            <label className="text-[9px] font-black text-zinc-400 uppercase italic tracking-widest ml-1">Max resultados: {cfg.maxResults}</label>
            <input type="range" min={1} max={20} step={1} value={cfg.maxResults} onChange={e => setCfg({ ...cfg, maxResults: parseInt(e.target.value) })} className="w-full accent-violet-600 mt-2" />
          </div>
          <div>
            <label className="text-[9px] font-black text-zinc-400 uppercase italic tracking-widest ml-1">Intervalo: cada {cfg.intervalHours}h</label>
            <input type="range" min={1} max={72} step={1} value={cfg.intervalHours} onChange={e => setCfg({ ...cfg, intervalHours: parseInt(e.target.value) })} className="w-full accent-violet-600 mt-2" />
          </div>
          <div>
            <label className="text-[9px] font-black text-zinc-400 uppercase italic tracking-widest ml-1">Canal outreach</label>
            <select value={cfg.outreachChannel} onChange={e => setCfg({ ...cfg, outreachChannel: e.target.value })} className="w-full bg-zinc-50 px-3 py-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium">
              <option value="email">Email</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="sms">SMS</option>
            </select>
          </div>
          <div className="flex items-center gap-3 pt-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={cfg.autoOutreach} onChange={e => setCfg({ ...cfg, autoOutreach: e.target.checked })} className="w-4 h-4 accent-violet-600" />
              <span className="text-xs font-bold text-zinc-700 italic">Auto outreach</span>
            </label>
            {cfg.autoOutreach ? <Mail className="w-3.5 h-3.5 text-violet-500" /> : <span className="text-[10px] text-zinc-400">Solo crea leads</span>}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <motion.button whileTap={{ scale: 0.95 }} onClick={save} disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-3 bg-violet-600 text-white rounded-xl text-xs font-black italic hover:bg-violet-700 disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings className="w-4 h-4" />} Guardar
          </motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={runNow} disabled={running || !cfg.enabled} className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-xl text-xs font-black italic hover:bg-zinc-800 disabled:opacity-50">
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} Ejecutar ahora
          </motion.button>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-4 md:p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black italic uppercase tracking-tight flex items-center gap-2"><BarChart3 className="w-4 h-4 text-violet-600" /> Progreso</h4>
          <motion.button whileTap={{ scale: 0.9 }} onClick={loadProgress} className="p-1.5 hover:bg-zinc-50 rounded-xl">
            <RefreshCw className={`w-4 h-4 text-zinc-400 ${progressLoading ? "animate-spin" : ""}`} />
          </motion.button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-violet-50 border border-violet-100 rounded-xl p-3 text-center">
            <p className="text-[9px] font-black text-violet-600 uppercase italic">Leads prospecting</p>
            <p className="text-lg font-black italic text-violet-700">{progress.customers}</p>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
            <p className="text-[9px] font-black text-amber-600 uppercase italic">Tasks</p>
            <p className="text-lg font-black italic text-amber-700">{progress.tasks?.length || 0}</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
            <p className="text-[9px] font-black text-emerald-600 uppercase italic">Citas</p>
            <p className="text-lg font-black italic text-emerald-700">{progress.appointments}</p>
          </div>
        </div>
        {progress.tasks?.length > 0 ? (
          <div className="space-y-1.5">
            {progress.tasks.map((t: any) => (
              <div key={t._id} className="flex items-center justify-between p-2.5 bg-zinc-50 rounded-xl border border-zinc-100">
                <div className="flex items-center gap-2">
                  <span className={`p-1.5 rounded-lg text-[10px] ${t.status === "done" ? "bg-emerald-100 text-emerald-600" : t.status === "failed" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"}`}>
                    {t.status === "done" ? <CheckCircle2 className="w-3.5 h-3.5" /> : t.status === "failed" ? <XCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                  </span>
                  <div>
                    <p className="text-[11px] font-black italic text-zinc-700">{t.type}</p>
                    <p className="text-[10px] text-zinc-400">{new Date(t.runAt).toLocaleString()} • {t.status}{t.error ? ` • ${t.error.slice(0, 40)}` : ""}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-zinc-400 italic text-center py-4">Sin tareas prospecting aún — guarda y ejecuta</p>
        )}
        <p className="text-[10px] text-zinc-500 italic">Detalles completos en `Clientes` (tag prospecting), `Citas` y `Tareas Programadas` (filtra prospecting). Scheduler corre vía `GET /api/scheduler/run` con `CRON_SECRET`.</p>
      </div>

      {/* How it works */}
      <div className="bg-zinc-950 text-white rounded-2xl p-4 md:p-6 space-y-3">
        <h4 className="text-xs font-black italic uppercase tracking-wider flex items-center gap-2"><Zap className="w-4 h-4 text-violet-400" /> Cómo funciona — ya está activo si está habilitado</h4>
        <ol className="space-y-2 text-[11px] font-medium text-zinc-300 leading-relaxed">
          <li><span className="text-white font-black">1. Busca:</span> OSM/Google Maps `location + keyword + radius` → `Max {cfg.maxResults}` leads con nombre/dirección/teléfono.</li>
          <li><span className="text-white font-black">2. Crea:</span> `Customer` deduplicado `phone|name+address` con `status:lead source:ai tags:[prospecting]` visible en `Clientes`.</li>
          <li><span className="text-white font-black">3. Contacta:</span> Encola `prospect_outreach` en 2min por canal elegido (template con servicio principal + link /s/slug/reservar).</li>
          <li><span className="text-white font-black">4. Persigue:</span> `prospect_followup` 24h y 48h si no hay `Appointment` (max 3).</li>
          <li><span className="text-white font-black">5. Agenda:</span> Cuando el lead reserva, crea `Appointment settingStage:appointment_set` + `ScheduledTask T-24h/T-1h + no-show rescue 30min`.</li>
        </ol>
        <p className="text-[10px] text-zinc-500 italic">Corre vía `GET /api/scheduler/run` (Bearer CRON_SECRET) — Vercel Cron cada minuto si hay tasks.</p>
      </div>
    </div>
  );
}
