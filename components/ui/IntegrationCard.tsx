"use client";

import { Loader2, Check, X } from "lucide-react";
import { motion } from "framer-motion";

export type IntegrationStatus = "connected" | "disconnected" | "coming_soon";

interface IntegrationCardProps {
  icon: any;
  iconColor: string;
  label: string;
  description?: string;
  status: IntegrationStatus;
  connectedLabel?: string;
  onClick: () => void;
  loading?: boolean;
}

const STATUS_CONFIG: Record<IntegrationStatus, { bg: string; text: string; label: string; dot: string }> = {
  connected: { bg: "bg-emerald-50", text: "text-emerald-600", label: "Conectado", dot: "bg-emerald-500" },
  disconnected: { bg: "bg-zinc-50", text: "text-zinc-400", label: "Desconectado", dot: "bg-zinc-300" },
  coming_soon: { bg: "bg-amber-50", text: "text-amber-500", label: "Próximamente", dot: "bg-amber-400" },
};

export default function IntegrationCard({ icon: Icon, iconColor, label, description, status, connectedLabel, onClick, loading }: IntegrationCardProps) {
  const st = STATUS_CONFIG[status];

  return (
    <motion.button
      whileHover={{ scale: 1.01, y: -1 }}
      whileTap={{ scale: 0.98 }}
      onClick={status === "coming_soon" ? undefined : onClick}
      disabled={loading || status === "coming_soon"}
      className={`text-left p-5 rounded-[2rem] border shadow-sm transition-all w-full group ${
        status === "connected"
          ? "border-green-200 ring-1 ring-green-100 bg-white hover:shadow-md"
          : status === "coming_soon"
            ? "border-zinc-100 bg-zinc-50 opacity-60 cursor-not-allowed"
            : "border-zinc-100 bg-white hover:border-zinc-200 hover:shadow-md"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="p-2.5 rounded-xl transition-all"
            style={{ backgroundColor: status === "connected" ? iconColor + "15" : "#f4f4f5" }}
          >
            <Icon className="w-5 h-5" style={{ color: status === "connected" ? iconColor : "#a1a1aa" }} />
          </div>
          <div>
            <p className="text-sm font-black italic text-zinc-950 uppercase tracking-tighter">{label}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
              <span className={`text-[9px] font-bold italic uppercase ${st.text}`}>
                {connectedLabel || st.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {description && (
        <p className="text-[10px] text-zinc-400 font-medium italic mb-3 line-clamp-2">{description}</p>
      )}

      <div className="flex items-center justify-end">
        {status === "connected" ? (
          <span className="px-4 py-2 bg-zinc-50 text-zinc-600 rounded-xl font-black text-[10px] italic group-hover:bg-zinc-100 transition-all flex items-center gap-1.5">
            <Check className="w-3 h-3" /> Administrar
          </span>
        ) : status === "coming_soon" ? (
          <span className="px-4 py-2 bg-zinc-50 text-zinc-300 rounded-xl font-black text-[10px] italic flex items-center gap-1.5">
            <X className="w-3 h-3" /> Próximamente
          </span>
        ) : (
          <span className="px-4 py-2 bg-red-600 text-white rounded-xl font-black text-[10px] italic group-hover:bg-red-700 transition-all flex items-center gap-1.5">
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
            Conectar
          </span>
        )}
      </div>
    </motion.button>
  );
}
