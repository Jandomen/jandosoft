"use client";

import { useState, useEffect, useCallback } from "react";
import { Shield, Heart, AlertTriangle, CheckCircle2, XCircle, Send, Users, Clock, TrendingUp, Zap, Filter, Settings, BarChart3, Loader2, ChevronDown, ChevronRight, Eye, MousePointerClick, Mail, MessageSquare, Info, RefreshCw, Play, Pause } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";

interface HealthScore {
  score: number;
  level: string;
  label: string;
  icon: string;
  breakdown: { sendFrequency: number; audienceSize: number; bounceHistory: number; unsubscribeHistory: number; engagement: number };
  factors: string[];
}

interface ReputationMetrics {
  totalSent30d: number;
  totalBounced30d: number;
  totalUnsubscribed30d: number;
  totalComplaints30d: number;
  bounceRate: number;
  unsubscribeRate: number;
  complaintRate: number;
  domainHealth: string;
}

interface Segment {
  segment: string;
  label: string;
  count: number;
}

interface Recommendation {
  id: string;
  type: string;
  priority: string;
  title: string;
  description: string;
  impact: string;
  autoFixAvailable: boolean;
}

interface SimulationResult {
  totalRecipients: number;
  excludedRecipients: number;
  excludedBreakdown: { bounced: number; unsubscribed: number; noContact: number; cooldown: number; invalidEmail: number; invalidPhone: number };
  batches: { totalRecipients: number; batchSize: number; batchDelaySeconds: number; estimatedBatches: number; estimatedDurationMinutes: number };
  risk: string;
  healthScore: HealthScore;
  estimatedCost: { email: number; sms: number; whatsapp: number };
  estimatedDuration: string;
  nextExecution: Date;
  recommendations: Recommendation[];
}

interface DailyLimit {
  allowed: boolean;
  sentToday: number;
  limit: number;
  remaining: number;
}

interface Props {
  storeId: string;
  onApplySegment?: (segment: string) => void;
}

export default function CampaignProtectionPanel({ storeId, onApplySegment }: Props) {
  const { showToast } = useToast();
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null);
  const [reputation, setReputation] = useState<ReputationMetrics | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [dailyLimit, setDailyLimit] = useState<DailyLimit | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "segments" | "settings">("overview");
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [protectionOn, setProtectionOn] = useState(true);
  const [settings, setSettings] = useState({
    maxEmailsPerDay: 500,
    maxSMSPerDay: 100,
    maxWhatsAppPerDay: 200,
    customerCooldownHours: 24,
    batchSizes: { email: 50, sms: 30, whatsapp: 100 },
    batchDelaySeconds: 5,
    excludeBounced: true,
    excludeUnsubscribed: true,
    excludeNoContact: true,
    enableBatching: true,
    minHoursBetweenCampaigns: 6,
    autoExcludeInvalidPhones: true,
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [healthRes, repRes, segRes, limitRes, settingsRes] = await Promise.all([
        fetch(`/api/campaign-protection`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "health", storeId })
        }),
        fetch(`/api/campaign-protection`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "reputation", storeId })
        }),
        fetch(`/api/campaign-protection`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "segments", storeId })
        }),
        fetch(`/api/campaign-protection`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "daily-limit", storeId, channel: "email" })
        }),
        fetch(`/api/campaign-protection?storeId=${storeId}`)
      ]);

      const [healthData, repData, segData, limitData, settingsData] = await Promise.all([
        healthRes.json(),
        repRes.json(),
        segRes.json(),
        limitRes.json(),
        settingsRes.json()
      ]);

      if (healthData.success) setHealthScore(healthData.data);
      if (repData.success) setReputation(repData.data);
      if (segData.success) setSegments(segData.data);
      if (limitData.success) setDailyLimit(limitData.data);
      if (settingsData.success && settingsData.data?.settings) {
        const s = settingsData.data.settings;
        setProtectionOn(s.enabled !== false);
        setSettings(prev => ({ ...prev, ...s }));
      }
    } catch (err) {
      console.error("Failed to load protection data:", err);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const runSimulation = async (channel: string, subject: string, content: string, audience: string) => {
    setSimulating(true);
    try {
      const res = await fetch("/api/campaign-protection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "simulate", storeId, channel, subject, content, audience })
      });
      const data = await res.json();
      if (data.success) setSimulationResult(data.data);
    } catch {
      showToast("Error al simular campaña", "error");
    } finally {
      setSimulating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-red-500 animate-spin" />
        <span className="ml-2 text-sm text-zinc-400 italic">Cargando protección...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Health Score Card */}
      {healthScore && (
        <div className={cn(
          "p-4 md:p-6 rounded-2xl border shadow-sm",
          healthScore.level === "excellent" || healthScore.level === "good" ? "bg-emerald-50 border-emerald-200" :
          healthScore.level === "medium" ? "bg-amber-50 border-amber-200" :
          "bg-red-50 border-red-200"
        )}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Heart className={cn("w-5 h-5", healthScore.level === "excellent" || healthScore.level === "good" ? "text-emerald-600" : healthScore.level === "medium" ? "text-amber-600" : "text-red-600")} />
              <h4 className="text-sm font-black italic text-zinc-950 uppercase">Health Score</h4>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black italic text-zinc-950">{healthScore.score}</span>
              <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-black italic", 
                healthScore.level === "excellent" || healthScore.level === "good" ? "bg-emerald-100 text-emerald-700" :
                healthScore.level === "medium" ? "bg-amber-100 text-amber-700" :
                "bg-red-100 text-red-700"
              )}>{healthScore.icon} {healthScore.label}</span>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-1.5 mb-3">
            {[
              { key: "sendFrequency", label: "Frecuencia", value: healthScore.breakdown.sendFrequency },
              { key: "audienceSize", label: "Audiencia", value: healthScore.breakdown.audienceSize },
              { key: "bounceHistory", label: "Rebotes", value: healthScore.breakdown.bounceHistory },
              { key: "unsubscribeHistory", label: "Desuscrip.", value: healthScore.breakdown.unsubscribeHistory },
              { key: "engagement", label: "Engagement", value: healthScore.breakdown.engagement }
            ].map(f => (
              <div key={f.key} className="text-center">
                <div className="h-16 bg-white rounded-lg overflow-hidden relative mb-1">
                  <div className={cn("absolute bottom-0 w-full rounded-b-lg transition-all", 
                    f.value >= 15 ? "bg-emerald-400" : f.value >= 10 ? "bg-amber-400" : "bg-red-400"
                  )} style={{ height: `${(f.value / 20) * 100}%` }} />
                </div>
                <p className="text-[7px] font-black text-zinc-500 uppercase">{f.label}</p>
                <p className="text-[9px] font-bold text-zinc-700">{f.value}/20</p>
              </div>
            ))}
          </div>

          {healthScore.factors.length > 0 && (
            <div className="space-y-1">
              {healthScore.factors.map((f, i) => (
                <p key={i} className="text-[9px] text-zinc-600 flex items-center gap-1.5">
                  <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" /> {f}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reputation + Daily Limit Row */}
      <div className="grid grid-cols-2 gap-3">
        {reputation && (
          <div className="bg-white p-3 md:p-4 rounded-xl border border-zinc-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-zinc-600" />
              <p className="text-[9px] font-black text-zinc-400 uppercase italic">Reputación</p>
            </div>
            <p className={cn("text-lg font-black italic", 
              reputation.domainHealth === "excellent" || reputation.domainHealth === "good" ? "text-emerald-600" :
              reputation.domainHealth === "fair" ? "text-amber-600" : "text-red-600"
            )}>{reputation.domainHealth.toUpperCase()}</p>
            <div className="mt-2 space-y-0.5">
              <p className="text-[8px] text-zinc-500">Enviados 30d: <span className="font-bold">{reputation.totalSent30d}</span></p>
              <p className="text-[8px] text-zinc-500">Rebotes: <span className={cn("font-bold", reputation.bounceRate > 5 ? "text-red-600" : "")}>{reputation.bounceRate}%</span></p>
              <p className="text-[8px] text-zinc-500">Desuscrip.: <span className={cn("font-bold", reputation.unsubscribeRate > 1 ? "text-amber-600" : "")}>{reputation.unsubscribeRate}%</span></p>
            </div>
          </div>
        )}

        {dailyLimit && (
          <div className="bg-white p-3 md:p-4 rounded-xl border border-zinc-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="w-4 h-4 text-zinc-600" />
              <p className="text-[9px] font-black text-zinc-400 uppercase italic">Límite Diario</p>
            </div>
            <div className="relative h-3 bg-zinc-100 rounded-full overflow-hidden mb-2">
              <div className={cn("h-full rounded-full transition-all", dailyLimit.sentToday / dailyLimit.limit > 0.8 ? "bg-red-500" : "bg-emerald-500")} 
                style={{ width: `${Math.min(100, (dailyLimit.sentToday / dailyLimit.limit) * 100)}%` }} />
            </div>
            <p className="text-lg font-black italic text-zinc-950">{dailyLimit.remaining} <span className="text-xs text-zinc-400">restantes</span></p>
            <p className="text-[8px] text-zinc-500">{dailyLimit.sentToday}/{dailyLimit.limit} enviados hoy</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 bg-zinc-50 p-1 rounded-xl">
        {[
          { key: "overview", label: "Resumen", icon: BarChart3 },
          { key: "segments", label: "Segmentos", icon: Users },
          { key: "settings", label: "Ajustes", icon: Settings }
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as any)} className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-black italic transition-all",
            activeTab === tab.key ? "bg-white text-red-600 shadow-sm" : "text-zinc-400 hover:text-zinc-600"
          )}>
            <tab.icon className="w-3 h-3" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Segments Tab */}
      {activeTab === "segments" && (
        <div className="space-y-2">
          <p className="text-[9px] font-black text-zinc-400 uppercase italic">Segmentos disponibles</p>
          {segments.map(seg => (
            <div key={seg.segment} className="flex items-center justify-between p-3 bg-white rounded-xl border border-zinc-100 hover:border-red-200 transition-all">
              <div>
                <p className="text-xs font-black italic text-zinc-950">{seg.label}</p>
                <p className="text-[8px] text-zinc-400">{seg.count} clientes</p>
              </div>
              <button onClick={() => onApplySegment?.(seg.segment)} className="px-2.5 py-1 bg-red-50 text-red-600 rounded-lg text-[9px] font-black italic hover:bg-red-100 transition-all">
                Seleccionar
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === "settings" && (
        <div className="space-y-3">
          <div className="bg-white p-4 rounded-xl border border-zinc-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[9px] font-black text-zinc-400 uppercase italic">Protección Smart</p>
              <button onClick={() => setProtectionOn(!protectionOn)} className={cn("w-10 h-5 rounded-full transition-all relative", protectionOn ? "bg-red-500" : "bg-zinc-200")}>
                <div className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all", protectionOn ? "left-5.5" : "left-0.5")} />
              </button>
            </div>
            <p className="text-[8px] text-zinc-400">Validación automática antes de cada envío de campañas</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-zinc-100 shadow-sm space-y-3">
            <p className="text-[9px] font-black text-zinc-400 uppercase italic">Exclusiones automáticas</p>
            {[
              { key: "excludeBounced", label: "Excluir rebotados", desc: "No enviar a correos que fallaron" },
              { key: "excludeUnsubscribed", label: "Excluir desuscritos", desc: "Respetar solicitudes de baja" },
              { key: "excludeNoContact", label: "Excluir No Contactar", desc: "No enviar a lista de exclusión" },
              { key: "enableBatching", label: "Envío por lotes", desc: "Dividir envíos grandes automáticamente" },
              { key: "autoExcludeInvalidPhones", label: "Excluir teléfonos inválidos", desc: "Auto-detectar números inválidos" },
            ].map((item) => (
              <label key={item.key} className="flex items-center justify-between p-2 hover:bg-zinc-50 rounded-lg transition-all cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-zinc-950">{item.label}</p>
                  <p className="text-[8px] text-zinc-400">{item.desc}</p>
                </div>
                <button onClick={() => setSettings(s => ({ ...s, [item.key]: !(s as any)[item.key] }))} className={cn("w-9 h-5 rounded-full transition-all relative", (settings as any)[item.key] ? "bg-red-500" : "bg-zinc-200")}>
                  <div className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all", (settings as any)[item.key] ? "left-4.5" : "left-0.5")} />
                </button>
              </label>
            ))}
          </div>

          <div className="bg-white p-4 rounded-xl border border-zinc-100 shadow-sm space-y-3">
            <p className="text-[9px] font-black text-zinc-400 uppercase italic">Límites diarios</p>
            {[
              { key: "maxEmailsPerDay", label: "Email", unit: "/día" },
              { key: "maxSMSPerDay", label: "SMS", unit: "/día" },
              { key: "maxWhatsAppPerDay", label: "WhatsApp", unit: "/día" },
              { key: "customerCooldownHours", label: "Cooldown cliente", unit: "horas" },
              { key: "minHoursBetweenCampaigns", label: "Entre campañas", unit: "horas" },
              { key: "batchDelaySeconds", label: "Delay entre lotes", unit: "seg" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <p className="text-xs font-bold text-zinc-700">{item.label}</p>
                <div className="flex items-center gap-1.5">
                  <input type="number" value={(settings as any)[item.key]} onChange={e => setSettings(s => ({ ...s, [item.key]: Number(e.target.value) }))}
                    className="w-16 text-right bg-zinc-50 p-1.5 rounded-lg border border-zinc-100 text-xs font-bold outline-none focus:border-red-200 transition-all" />
                  <span className="text-[8px] text-zinc-400 w-8">{item.unit}</span>
                </div>
              </div>
            ))}
          </div>

          <button onClick={async () => {
            setSaving(true);
            try {
              const res = await fetch("/api/campaign-protection", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ storeId, settings: { ...settings, enabled: protectionOn } })
              });
              const data = await res.json();
              if (data.success) showToast("Ajustes guardados", "success");
              else showToast("Error al guardar", "error");
            } catch { showToast("Error al guardar", "error"); }
            finally { setSaving(false); }
          }} disabled={saving}
            className="w-full py-2.5 bg-red-600 text-white rounded-xl text-[10px] font-black italic hover:bg-red-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Settings className="w-3.5 h-3.5" />}
            {saving ? "Guardando..." : "Guardar Ajustes"}
          </button>
        </div>
      )}

      {/* Simulation Result */}
      {simulationResult && (
        <div className="bg-white p-4 rounded-xl border border-zinc-100 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-blue-600" />
            <p className="text-[9px] font-black text-zinc-400 uppercase italic">Simulación de Envío</p>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-emerald-50 p-2.5 rounded-lg text-center">
              <p className="text-lg font-black italic text-emerald-700">{simulationResult.totalRecipients - simulationResult.excludedRecipients}</p>
              <p className="text-[7px] font-bold text-emerald-600 uppercase">Recibirán</p>
            </div>
            <div className="bg-red-50 p-2.5 rounded-lg text-center">
              <p className="text-lg font-black italic text-red-700">{simulationResult.excludedRecipients}</p>
              <p className="text-[7px] font-bold text-red-600 uppercase">Excluidos</p>
            </div>
          </div>

          {simulationResult.excludedRecipients > 0 && (
            <div className="grid grid-cols-3 gap-1.5">
              {Object.entries(simulationResult.excludedBreakdown).filter(([_, v]) => v > 0).map(([reason, count]) => (
                <div key={reason} className="bg-zinc-50 p-1.5 rounded text-center">
                  <p className="text-xs font-bold text-zinc-700">{count}</p>
                  <p className="text-[7px] text-zinc-500 capitalize">{reason.replace(/([A-Z])/g, " $1")}</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between text-[9px] text-zinc-500">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {simulationResult.estimatedDuration}</span>
            <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> {simulationResult.batches.estimatedBatches} lotes</span>
          </div>

          {simulationResult.recommendations.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[8px] font-black text-zinc-400 uppercase italic">Recomendaciones</p>
              {simulationResult.recommendations.slice(0, 3).map(rec => (
                <div key={rec.id} className={cn("p-2 rounded-lg text-[9px]", 
                  rec.priority === "critical" ? "bg-red-50 text-red-700" :
                  rec.priority === "high" ? "bg-amber-50 text-amber-700" :
                  "bg-blue-50 text-blue-700"
                )}>
                  <p className="font-bold">{rec.title}</p>
                  <p className="opacity-80">{rec.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick Simulate Button */}
      <button onClick={() => runSimulation("email", "Test", "Test content", "all")} disabled={simulating}
        className="w-full py-2.5 bg-zinc-100 text-zinc-600 rounded-xl text-[10px] font-black italic hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
        {simulating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
        {simulating ? "Simulando..." : "Simular Envío"}
      </button>
    </div>
  );
}
