"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useToast } from "@/components/ui/Toast";
import { useStoreSocket } from "@/lib/socket-client";
import {
  Bell, Loader2, CheckCircle2, Clock, AlertTriangle,
} from "lucide-react";

interface WaiterCall {
  _id: string;
  tableNumber: number;
  message: string;
  status: string;
  createdAt: string;
}

interface Props {
  storeId: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-red-100 text-red-700 border-red-200",
  acknowledged: "bg-amber-100 text-amber-700 border-amber-200",
  resolved: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export default function WaiterCallsPanel({ storeId }: Props) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [calls, setCalls] = useState<WaiterCall[]>([]);
  const [loading, setLoading] = useState(true);
  const prevPendingCount = useRef(0);

  const fetchCalls = useCallback(async () => {
    try {
      const res = await fetch(`/api/restaurant/${storeId}/waiter-calls`);
      const data = await res.json();
      const latest = data.calls || [];
      const newPending = latest.filter((c: WaiterCall) => c.status === "pending").length;
      if (prevPendingCount.current > 0 && newPending > prevPendingCount.current) {
        showToast(t("restaurant.new_waiter_call"), "info");
      }
      prevPendingCount.current = newPending;
      setCalls(latest);
    } catch {} finally {
      setLoading(false);
    }
  }, [storeId, showToast, t]);

  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

  useStoreSocket(storeId, (event, data) => {
    if (event === "new-waiter-call" || event === "waiter-call-updated") {
      fetchCalls();
      if (event === "new-waiter-call") {
        showToast(t("restaurant.new_waiter_call"), "info");
      }
    }
  });

  const acknowledgeCall = async (id: string) => {
    try {
      await fetch(`/api/restaurant/${storeId}/waiter-calls/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "acknowledged" }),
      });
      setCalls(prev => prev.map(c => c._id === id ? { ...c, status: "acknowledged" } : c));
      showToast(t("restaurant.call_acknowledged"), "success");
    } catch {
      showToast(t("restaurant.error_saving"), "error");
    }
  };

  const resolveCall = async (id: string) => {
    try {
      await fetch(`/api/restaurant/${storeId}/waiter-calls/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "resolved" }),
      });
      setCalls(prev => prev.filter(c => c._id !== id));
      showToast(t("restaurant.call_resolved"), "success");
    } catch {
      showToast(t("restaurant.error_saving"), "error");
    }
  };

  const getTimeSince = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t("restaurant.just_now");
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m`;
  };

  const activeCalls = calls.filter(c => c.status !== "resolved");
  const pendingCalls = activeCalls.filter(c => c.status === "pending");
  const resolvedCalls = calls.filter(c => c.status === "resolved");

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 text-zinc-300 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <h3 className="max-[400px]:text-xl text-2xl font-black italic text-zinc-950 uppercase tracking-tighter flex items-center gap-2">
        <Bell className="w-5 h-5 text-red-600" /> {t("restaurant.waiter_calls")}
        {pendingCalls.length > 0 && (
          <span className="px-2 py-0.5 bg-red-500 text-white rounded-full text-[9px] font-black animate-pulse">{pendingCalls.length}</span>
        )}
      </h3>

      {pendingCalls.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-black italic text-red-600 uppercase tracking-tight flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /> {t("restaurant.pending_calls")} ({pendingCalls.length})
          </h4>
          <div className="grid gap-3">
            {pendingCalls.map(call => (
              <motion.div key={call._id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="bg-red-50 rounded-2xl border-2 border-red-200 p-4 md:p-5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shrink-0" />
                    <div>
                      <p className="text-sm font-black italic text-zinc-950">{t("restaurant.table")} #{call.tableNumber}</p>
                      {call.message && <p className="text-[10px] text-zinc-500 italic mt-0.5">{call.message}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[9px] font-bold text-red-400 italic shrink-0">
                    <Clock className="w-3 h-3" /> {getTimeSince(call.createdAt)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => acknowledgeCall(call._id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-amber-500 text-white rounded-xl text-[10px] font-black italic hover:bg-amber-600 transition-all shadow-sm">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {t("restaurant.acknowledge")}
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => resolveCall(call._id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-500 text-white rounded-xl text-[10px] font-black italic hover:bg-emerald-600 transition-all shadow-sm">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {t("restaurant.resolve")}
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {activeCalls.filter(c => c.status === "acknowledged").length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-black italic text-amber-600 uppercase tracking-tight">{t("restaurant.acknowledged")}</h4>
          <div className="grid gap-2">
            {activeCalls.filter(c => c.status === "acknowledged").map(call => (
              <div key={call._id} className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-100">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-black italic text-zinc-950">{t("restaurant.table")} #{call.tableNumber}</span>
                  {call.message && <span className="text-[9px] text-zinc-400 italic truncate">{call.message}</span>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[9px] font-bold text-amber-400 italic">{getTimeSince(call.createdAt)}</span>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => resolveCall(call._id)}
                    className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-[9px] font-black italic hover:bg-emerald-600 transition-all">
                    {t("restaurant.resolve")}
                  </motion.button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeCalls.length === 0 && (
        <div className="py-16 text-center italic font-black uppercase tracking-widest text-zinc-200 flex flex-col items-center gap-3">
          <Bell className="w-10 h-10 text-zinc-200" />
          {t("restaurant.no_active_calls")}
        </div>
      )}
    </div>
  );
}
