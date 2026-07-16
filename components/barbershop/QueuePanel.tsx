"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useToast } from "@/components/ui/Toast";
import {
  Plus, X, Loader2, Users, Clock, PlayCircle, CheckCircle2, XCircle, Scissors,
} from "lucide-react";

interface QueueEntry {
  _id: string;
  position: number;
  customerName: string;
  phone?: string;
  serviceRequested: string;
  preferredBarber?: string;
  status: string;
  notes?: string;
  checkInTime: string;
}

interface Barber {
  _id: string;
  name: string;
  active?: boolean;
}

interface Props {
  storeId: string;
}

const STATUS_STYLES: Record<string, string> = {
  waiting: "bg-amber-100 text-amber-700",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-600",
};

const EMPTY_FORM = { customerName: "", phone: "", serviceRequested: "", preferredBarber: "", notes: "" };

export default function QueuePanel({ storeId }: Props) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [entries, setEntries] = useState<QueueEntry[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [queueRes, barbersRes] = await Promise.all([
        fetch(`/api/barbershop/${storeId}/queue`),
        fetch(`/api/barbershop/${storeId}/barbers`),
      ]);
      const queueData = await queueRes.json();
      const barbersData = await barbersRes.json();
      setEntries(queueData.entries || []);
      setBarbers(barbersData.barbers || []);
    } catch {
      showToast(t("barbershop.error_loading"), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [storeId]);

  const addToQueue = async () => {
    if (!form.customerName || !form.serviceRequested) return;
    try {
      const res = await fetch(`/api/barbershop/${storeId}/queue`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.customerName,
          phone: form.phone || undefined,
          serviceRequested: form.serviceRequested,
          preferredBarber: form.preferredBarber || undefined,
          notes: form.notes || undefined,
        }),
      });
      const data = await res.json();
      setEntries(prev => [...prev, data.entry || data].sort((a, b) => a.position - b.position));
      setForm(EMPTY_FORM);
      setShowModal(false);
      showToast(t("barbershop.customer_added"), "success");
    } catch {
      showToast(t("barbershop.error_saving"), "error");
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/barbershop/${storeId}/queue/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (status === "completed" || status === "cancelled") {
        setEntries(prev => prev.filter(e => e._id !== id));
      } else {
        setEntries(prev => prev.map(e => e._id === id ? { ...e, status, ...data.entry || {} } : e));
      }
      showToast(t("barbershop.status_updated"), "success");
    } catch {
      showToast(t("barbershop.error_saving"), "error");
    }
  };

  const sorted = [...entries].sort((a, b) => a.position - b.position);
  const waitingCount = entries.filter(e => e.status === "waiting").length;
  const currentServing = entries.find(e => e.status === "in_progress");

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 text-zinc-300 animate-spin" /></div>;
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="max-[400px]:text-xl text-2xl font-black italic text-zinc-950 uppercase tracking-tighter flex items-center gap-2">
          {t("barbershop.queue")}
          {waitingCount > 0 && (
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black italic">{waitingCount} {t("barbershop.waiting_count")}</span>
          )}
        </h3>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setForm(EMPTY_FORM); setShowModal(true); }}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-red-600 text-white rounded-xl text-[10px] md:text-xs font-black italic hover:bg-red-700 transition-all shadow-xl shadow-red-100">
          <Plus className="w-3.5 h-3.5" /> {t("barbershop.add_to_queue")}
        </motion.button>
      </div>

      {currentServing && (
        <div className="bg-blue-50 rounded-[2rem] border border-blue-100 p-5 flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-xl"><PlayCircle className="w-5 h-5 text-blue-600" /></div>
          <div>
            <p className="text-[9px] font-black text-blue-500 uppercase italic">{t("barbershop.now_serving")}</p>
            <p className="text-sm font-black italic text-blue-900">{currentServing.customerName}</p>
            <p className="text-[10px] text-blue-400 font-bold italic">{currentServing.serviceRequested}</p>
          </div>
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="py-16 text-center italic font-black uppercase tracking-widest text-zinc-200">{t("barbershop.no_queue")}</div>
      ) : (
        <div className="grid gap-3">
          {sorted.map(entry => (
            <motion.div key={entry._id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-4 md:p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-zinc-300 italic">#{entry.position}</span>
                    <p className="text-sm font-black italic text-zinc-950 truncate">{entry.customerName}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                    {entry.phone && <span className="text-[9px] text-zinc-400 font-bold italic">{entry.phone}</span>}
                    <span className="text-[9px] text-zinc-400 font-bold italic flex items-center gap-1">
                      <Scissors className="w-2.5 h-2.5" /> {entry.serviceRequested}
                    </span>
                    {entry.preferredBarber && (
                      <span className="text-[9px] text-zinc-400 font-bold italic">→ {barbers.find(b => b._id === entry.preferredBarber)?.name || entry.preferredBarber}</span>
                    )}
                    <span className="text-[9px] text-zinc-300 font-bold italic flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" /> {new Date(entry.checkInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  {entry.notes && <p className="text-[9px] text-zinc-300 italic mt-1">{entry.notes}</p>}
                </div>
                <span className={cn("text-[8px] font-black italic px-2 py-0.5 rounded-full uppercase shrink-0", STATUS_STYLES[entry.status] || "bg-zinc-100 text-zinc-500")}>
                  {t(`barbershop.status_${entry.status}`)}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {entry.status === "waiting" && (
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => updateStatus(entry._id, "in_progress")}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[9px] font-black italic hover:bg-blue-700 transition-all">
                    <PlayCircle className="w-3 h-3" /> {t("barbershop.start_service")}
                  </motion.button>
                )}
                {entry.status === "in_progress" && (
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => updateStatus(entry._id, "completed")}
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-[9px] font-black italic hover:bg-emerald-700 transition-all">
                    <CheckCircle2 className="w-3 h-3" /> {t("barbershop.complete_service")}
                  </motion.button>
                )}
                {["waiting", "in_progress"].includes(entry.status) && (
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => updateStatus(entry._id, "cancelled")}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-[9px] font-black italic hover:bg-red-100 transition-all">
                    <XCircle className="w-3 h-3" /> {t("barbershop.cancel_service")}
                  </motion.button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-[2rem] w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between p-5 border-b border-zinc-100">
                <h4 className="text-sm font-black italic uppercase tracking-tighter">{t("barbershop.add_to_queue")}</h4>
                <button onClick={() => setShowModal(false)} className="p-1 hover:bg-zinc-50 rounded-lg"><X className="w-4 h-4 text-zinc-400" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1">{t("barbershop.customer_name")}</label>
                  <input type="text" value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })}
                    className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-red-200 transition-all" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1">{t("barbershop.customer_phone")}</label>
                  <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-red-200 transition-all" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1">{t("barbershop.service_requested")}</label>
                  <input type="text" value={form.serviceRequested} onChange={e => setForm({ ...form, serviceRequested: e.target.value })}
                    className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-red-200 transition-all" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1">{t("barbershop.preferred_barber")}</label>
                  <select value={form.preferredBarber} onChange={e => setForm({ ...form, preferredBarber: e.target.value })}
                    className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-red-200 transition-all">
                    <option value="">{t("barbershop.no_preferred")}</option>
                    {barbers.filter(b => b.active !== false).map(b => (
                      <option key={b._id} value={b._id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1">{t("barbershop.notes")}</label>
                  <textarea value={form.notes} rows={2} onChange={e => setForm({ ...form, notes: e.target.value })}
                    className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-red-200 transition-all resize-none" />
                </div>
                <motion.button whileTap={{ scale: 0.97 }} onClick={addToQueue} disabled={!form.customerName || !form.serviceRequested}
                  className="w-full py-4 bg-red-600 text-white rounded-2xl font-black italic hover:bg-red-700 transition-all shadow-xl disabled:opacity-50">
                  {t("barbershop.add_to_queue")}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
