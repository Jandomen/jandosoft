"use client";

import { useState, useEffect } from "react";
import { Puzzle, Plus, Trash2, CheckCircle2, XCircle, RefreshCw, Key, Sliders, Activity, Copy, Eye, EyeOff, Gauge } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import { PLATFORMS, type PlatformId } from "./PlatformIcons";

interface IntegrationData {
  _id: string;
  platform: string;
  label: string;
  apiKey: string;
  tier: "developer" | "production";
  status: "verified" | "pending" | "invalid";
  config: { rateLimit: number; dailyCap: number; monthlyCap: number };
  usage: { today: number; thisMonth: number; total: number };
  lastVerified: string | null;
}

export default function IntegrationsPanel({ storeId }: { storeId: string | number }) {
  const { showToast } = useToast();
  const [integrations, setIntegrations] = useState<IntegrationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await fetch(`/api/integrations/${storeId}`);
      const data = await res.json();
      if (data.integrations) setIntegrations(data.integrations);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [storeId]);

  const addOrUpdate = async (platform: string, apiKey: string, tier: string, config?: any) => {
    const exists = integrations.find(i => i.platform === platform);
    const res = await fetch(`/api/integrations/${storeId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform, apiKey, tier, config }),
    });
    const data = await res.json();
    if (!res.ok) { showToast(data.error || "Error al guardar", "error"); return; }
    await load();
    showToast(exists ? "API key actualizada" : "API key agregada", "success");
  };

  const remove = async (id: string) => {
    const res = await fetch(`/api/integrations/${storeId}/${id}`, { method: "DELETE" });
    if (!res.ok) { showToast("Error al eliminar", "error"); return; }
    await load();
    showToast("Integración eliminada", "success");
  };

  const verify = async (id: string) => {
    setVerifying(id);
    const res = await fetch(`/api/integrations/${storeId}/${id}/verify`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) { showToast(data.error || "Error al verificar", "error"); setVerifying(null); return; }
    await load();
    setVerifying(null);
    if (data.status === "verified") showToast("API key verificada correctamente", "success");
    else showToast("API key inválida - revisa la llave", "error");
  };

  const updateConfig = async (id: string, config: any) => {
    const res = await fetch(`/api/integrations/${storeId}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config }),
    });
    if (!res.ok) { showToast("Error al actualizar configuración", "error"); return; }
    await load();
    showToast("Límites actualizados", "success");
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <h3 className="text-2xl max-[400px]:text-xl font-black italic text-zinc-950 uppercase tracking-tighter"><Puzzle className="w-6 h-6 max-[400px]:w-5 max-[400px]:h-5 inline mr-3 text-red-600" />Integraciones</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-[400px]:gap-5 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-44 max-[400px]:h-44 h-48 bg-zinc-50 rounded-[2rem] animate-pulse" />)}
        </div>
      </div>
    );
  }

  const configuredPlatforms = new Set(integrations.map(i => i.platform));

  return (
    <div className="space-y-6 max-[400px]:space-y-6 space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl max-[400px]:text-xl font-black italic text-zinc-950 uppercase tracking-tighter">
          <Puzzle className="w-6 h-6 max-[400px]:w-5 max-[400px]:h-5 inline mr-3 text-red-600" />Integraciones
          <span className="text-zinc-400 text-sm max-[400px]:text-sm text-base ml-3">{integrations.length} conectadas</span>
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-[400px]:gap-5 gap-6">
        {PLATFORMS.map(platform => {
          const integration = integrations.find(i => i.platform === platform.id);
          return (
            <IntegrationCard
              key={platform.id}
              platform={platform}
              integration={integration || null}
              editing={editing === platform.id}
              verifying={verifying === integration?._id}
              onStartEdit={() => setEditing(platform.id)}
              onCancelEdit={() => setEditing(null)}
              onSave={(apiKey, tier, config) => { addOrUpdate(platform.id, apiKey, tier, config); setEditing(null); }}
              onDelete={() => integration && remove(integration._id)}
              onVerify={() => integration && verify(integration._id)}
              onUpdateConfig={(config) => integration && updateConfig(integration._id, config)}
            />
          );
        })}
      </div>
    </div>
  );
}

function IntegrationCard({
  platform,
  integration,
  editing,
  verifying,
  onStartEdit,
  onCancelEdit,
  onSave,
  onDelete,
  onVerify,
  onUpdateConfig,
}: {
  platform: typeof PLATFORMS[number];
  integration: IntegrationData | null;
  editing: boolean;
  verifying: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: (apiKey: string, tier: string, config: any) => void;
  onDelete: () => void;
  onVerify: () => void;
  onUpdateConfig: (config: any) => void;
}) {
  const { showToast } = useToast();
  const [keyInput, setKeyInput] = useState("");
  const [tier, setTier] = useState<"developer" | "production">("developer");
  const [showKey, setShowKey] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [rateLimit, setRateLimit] = useState(integration?.config?.rateLimit || 60);
  const [dailyCap, setDailyCap] = useState(integration?.config?.dailyCap || 1000);
  const [monthlyCap, setMonthlyCap] = useState(integration?.config?.monthlyCap || 30000);

  const statusColor = integration?.status === "verified" ? "text-emerald-600 bg-emerald-50" :
    integration?.status === "invalid" ? "text-red-600 bg-red-50" :
    integration ? "text-amber-600 bg-amber-50" : "text-zinc-300 bg-zinc-50";

  const statusLabel = integration?.status === "verified" ? "Verificada" :
    integration?.status === "invalid" ? "Inválida" :
    integration ? "Pendiente" : "Sin conectar";

  const usagePercent = integration ? Math.round((integration.usage.thisMonth / integration.config.monthlyCap) * 100) : 0;

  return (
    <div className={cn("bg-white p-5 max-[400px]:p-5 p-6 rounded-[2rem] border transition-all shadow-sm", integration ? "border-zinc-100 hover:border-red-200" : "border-dashed border-zinc-200 opacity-70 hover:opacity-100")}>
      <div className="flex items-start justify-between mb-3 max-[400px]:mb-3 mb-4">
        <div className="flex items-center gap-3">
          <div className={cn("w-10 h-10 max-[400px]:w-10 max-[400px]:h-10 w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", platform.color)}>
            <platform.Icon size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-sm max-[400px]:text-xs font-black italic text-zinc-950 truncate">{platform.name}</p>
            <p className="text-[7px] max-[400px]:text-[7px] text-[8px] font-bold text-zinc-400 italic uppercase tracking-wider">{platform.desc}</p>
          </div>
        </div>
        <div className={cn("flex items-center gap-1 px-2 max-[400px]:px-2 px-2.5 py-1 rounded-lg text-[7px] max-[400px]:text-[7px] text-[8px] font-black italic uppercase shrink-0", statusColor)}>
          {integration?.status === "verified" ? <CheckCircle2 className="w-3 h-3" /> :
           integration?.status === "invalid" ? <XCircle className="w-3 h-3" /> :
           <Key className="w-3 h-3" />}
          {statusLabel}
        </div>
      </div>

      {editing && (
        <div className="space-y-3 mb-4 p-3.5 max-[400px]:p-3.5 p-4 bg-zinc-50 rounded-xl border border-zinc-100">
          <div className="space-y-1.5">
            <label className="text-[7px] max-[400px]:text-[7px] text-[8px] font-black text-zinc-400 uppercase italic tracking-widest">API Key</label>
            <div className="relative">
              <input type={showKey ? "text" : "password"} placeholder="sk-..." value={keyInput} onChange={e => setKeyInput(e.target.value)} className="w-full bg-white pr-20 pl-4 py-2.5 max-[400px]:py-2.5 py-3 rounded-xl border border-zinc-200 outline-none font-mono text-[10px] max-[400px]:text-[10px] text-xs focus:border-red-200 transition-all" />
              <button onClick={() => setShowKey(!showKey)} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-zinc-400 hover:text-zinc-950">
                {showKey ? <EyeOff className="w-3 h-3 max-[400px]:w-3 max-[400px]:h-3 w-3.5 h-3.5" /> : <Eye className="w-3 h-3 max-[400px]:w-3 max-[400px]:h-3 w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          <div className="flex flex-col max-[400px]:flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1">
              <label className="text-[7px] max-[400px]:text-[7px] text-[8px] font-black text-zinc-400 uppercase italic tracking-widest">Tier</label>
              <select value={tier} onChange={e => setTier(e.target.value as any)} className="w-full bg-white px-3 py-2.5 rounded-xl border border-zinc-200 outline-none text-[10px] max-[400px]:text-[10px] text-[11px] font-bold italic focus:border-red-200 transition-all">
                <option value="developer">Developer</option>
                <option value="production">Producción</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="text-[7px] max-[400px]:text-[7px] text-[8px] font-black text-zinc-400 uppercase italic tracking-widest">Req/min</label>
              <input type="number" value={rateLimit} onChange={e => setRateLimit(Number(e.target.value))} className="w-full bg-white px-3 py-2.5 rounded-xl border border-zinc-200 outline-none text-[10px] max-[400px]:text-[10px] text-xs font-bold focus:border-red-200 transition-all" />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => onSave(keyInput, tier, { rateLimit, dailyCap, monthlyCap })} disabled={!keyInput} className="flex-1 py-2.5 max-[400px]:py-2.5 py-3 bg-red-600 text-white rounded-xl font-black text-[8px] max-[400px]:text-[8px] text-[9px] italic hover:bg-red-700 transition-all disabled:opacity-50">
              GUARDAR
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={onCancelEdit} className="px-5 max-[400px]:px-5 px-6 py-2.5 max-[400px]:py-2.5 py-3 bg-zinc-100 text-zinc-600 rounded-xl font-black text-[8px] max-[400px]:text-[8px] text-[9px] italic hover:bg-zinc-200 transition-all">
              CANCELAR
            </motion.button>
          </div>
        </div>
      )}

      {integration && !editing && (
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 max-[400px]:gap-1.5 gap-2 p-2.5 max-[400px]:p-2.5 p-3 bg-zinc-50 rounded-xl">
            <Key className="w-3 h-3 max-[400px]:w-3 max-[400px]:h-3 w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <p className="text-[9px] max-[400px]:text-[9px] text-[10px] font-mono font-bold text-zinc-500 truncate flex-1">
              {showKey ? integration.apiKey : `${integration.apiKey.slice(0, 8)}${"•".repeat(Math.min(integration.apiKey.length - 8, 24))}`}
            </p>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowKey(!showKey)} className="p-1 text-zinc-400 hover:text-zinc-950 shrink-0">
              {showKey ? <EyeOff className="w-2.5 h-2.5 max-[400px]:w-2.5 max-[400px]:h-2.5 w-3 h-3" /> : <Eye className="w-2.5 h-2.5 max-[400px]:w-2.5 max-[400px]:h-2.5 w-3 h-3" />}
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => { navigator.clipboard.writeText(integration.apiKey); showToast("API key copiada", "success"); }} className="p-1 text-zinc-400 hover:text-zinc-950 shrink-0">
              <Copy className="w-2.5 h-2.5 max-[400px]:w-2.5 max-[400px]:h-2.5 w-3 h-3" />
            </motion.button>
          </div>

          <div className="flex items-center justify-between text-[7px] max-[400px]:text-[7px] text-[8px] font-bold text-zinc-400 italic uppercase tracking-wider">
            <span className="flex items-center gap-1"><Gauge className="w-2.5 h-2.5 max-[400px]:w-2.5 max-[400px]:h-2.5 w-3 h-3" /> Tier: {integration.tier === "developer" ? "Developer" : "Producción"}</span>
            <span className="flex items-center gap-1"><Activity className="w-2.5 h-2.5 max-[400px]:w-2.5 max-[400px]:h-2.5 w-3 h-3" /> {integration.usage.today} hoy</span>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[7px] max-[400px]:text-[7px] text-[8px] font-bold text-zinc-400 italic">
              <span>Uso mensual</span>
              <span>{integration.usage.thisMonth.toLocaleString()} / {integration.config.monthlyCap.toLocaleString()}</span>
            </div>
            <div className="h-1.5 max-[400px]:h-1.5 h-2 bg-zinc-100 rounded-full overflow-hidden">
              <div className={cn("h-full rounded-full transition-all", usagePercent > 80 ? "bg-red-500" : usagePercent > 50 ? "bg-amber-500" : "bg-emerald-500")} style={{ width: `${Math.min(usagePercent, 100)}%` }} />
            </div>
          </div>

          {showConfig && (
            <div className="p-3.5 max-[400px]:p-3.5 p-4 bg-zinc-50 rounded-xl border border-zinc-100 space-y-3">
              <p className="text-[8px] max-[400px]:text-[8px] text-[9px] font-black italic text-zinc-950 uppercase tracking-tighter">Límites</p>
              <div className="grid grid-cols-3 gap-1.5 max-[400px]:gap-1.5 gap-2">
                <div>
                  <label className="text-[6px] max-[400px]:text-[6px] text-[7px] font-black text-zinc-400 uppercase italic">Req/min</label>
                  <input type="number" value={rateLimit} onChange={e => setRateLimit(Number(e.target.value))} className="w-full bg-white px-1.5 max-[400px]:px-1.5 px-2 py-1.5 max-[400px]:py-1.5 py-2 rounded-lg border border-zinc-200 outline-none text-[9px] max-[400px]:text-[9px] text-[10px] font-bold" />
                </div>
                <div>
                  <label className="text-[6px] max-[400px]:text-[6px] text-[7px] font-black text-zinc-400 uppercase italic">Diario</label>
                  <input type="number" value={dailyCap} onChange={e => setDailyCap(Number(e.target.value))} className="w-full bg-white px-1.5 max-[400px]:px-1.5 px-2 py-1.5 max-[400px]:py-1.5 py-2 rounded-lg border border-zinc-200 outline-none text-[9px] max-[400px]:text-[9px] text-[10px] font-bold" />
                </div>
                <div>
                  <label className="text-[6px] max-[400px]:text-[6px] text-[7px] font-black text-zinc-400 uppercase italic">Mensual</label>
                  <input type="number" value={monthlyCap} onChange={e => setMonthlyCap(Number(e.target.value))} className="w-full bg-white px-1.5 max-[400px]:px-1.5 px-2 py-1.5 max-[400px]:py-1.5 py-2 rounded-lg border border-zinc-200 outline-none text-[9px] max-[400px]:text-[9px] text-[10px] font-bold" />
                </div>
              </div>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => { onUpdateConfig({ rateLimit, dailyCap, monthlyCap }); setShowConfig(false); }} className="w-full py-2 max-[400px]:py-2 py-2.5 bg-red-600 text-white rounded-xl font-black text-[7px] max-[400px]:text-[7px] text-[8px] italic hover:bg-red-700 transition-all">
                APLICAR LÍMITES
              </motion.button>
            </div>
          )}

          <div className="flex items-stretch max-[400px]:items-stretch sm:items-center gap-1.5 max-[400px]:gap-1.5 gap-2 pt-1 flex-wrap max-[400px]:flex-wrap sm:flex-nowrap">
            <motion.button whileTap={{ scale: 0.95 }} onClick={onVerify} disabled={verifying} className="flex-1 flex items-center justify-center gap-1 py-2 max-[400px]:py-2 py-2.5 bg-zinc-50 rounded-xl text-[8px] max-[400px]:text-[8px] text-[9px] font-black italic hover:bg-zinc-100 transition-all border border-zinc-100">
              <RefreshCw className={cn("w-2.5 h-2.5 max-[400px]:w-2.5 max-[400px]:h-2.5 w-3 h-3", verifying && "animate-spin")} /> {verifying ? "VERIFICANDO..." : "VERIFICAR"}
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setShowConfig(!showConfig); setRateLimit(integration.config.rateLimit); setDailyCap(integration.config.dailyCap); setMonthlyCap(integration.config.monthlyCap); }} className="flex-1 flex items-center justify-center gap-1 py-2 max-[400px]:py-2 py-2.5 bg-zinc-50 rounded-xl text-[8px] max-[400px]:text-[8px] text-[9px] font-black italic hover:bg-zinc-100 transition-all border border-zinc-100">
              <Sliders className="w-2.5 h-2.5 max-[400px]:w-2.5 max-[400px]:h-2.5 w-3 h-3" /> LÍMITES
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={onStartEdit} className="flex-1 flex items-center justify-center gap-1 py-2 max-[400px]:py-2 py-2.5 bg-red-50 text-red-600 rounded-xl text-[8px] max-[400px]:text-[8px] text-[9px] font-black italic hover:bg-red-100 transition-all border border-red-100">
              <Key className="w-2.5 h-2.5 max-[400px]:w-2.5 max-[400px]:h-2.5 w-3 h-3" /> CAMBIAR KEY
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }} onClick={onDelete} className="p-2 max-[400px]:p-2 p-2.5 text-zinc-300 hover:text-red-500 transition-all rounded-xl hover:bg-red-50">
              <Trash2 className="w-3.5 h-3.5 max-[400px]:w-3.5 max-[400px]:h-3.5 w-4 h-4" />
            </motion.button>
          </div>

          {integration.lastVerified && (
            <p className="text-[6px] max-[400px]:text-[6px] text-[7px] text-zinc-300 italic text-right">Última verificación: {new Date(integration.lastVerified).toLocaleDateString("es", { dateStyle: "short" })}</p>
          )}
        </div>
      )}

      {!integration && !editing && (
        <motion.button whileTap={{ scale: 0.95 }} onClick={onStartEdit} className="w-full py-5 max-[400px]:py-5 py-6 border-2 border-dashed border-zinc-200 rounded-2xl flex items-center justify-center gap-2 text-zinc-400 hover:text-red-600 hover:border-red-200 transition-all group">
          <Plus className="w-4 h-4 max-[400px]:w-4 max-[400px]:h-4 w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="text-[9px] max-[400px]:text-[9px] text-[10px] font-black italic uppercase">Conectar {platform.name}</span>
        </motion.button>
      )}
    </div>
  );
}
