"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useToast } from "@/components/ui/Toast";
import {
  Plus, X, Loader2, Star, Calendar, Clock, DollarSign, TrendingUp,
} from "lucide-react";

interface HistoryEntry {
  _id: string;
  barberId: string;
  barberName: string;
  customerName: string;
  phone?: string;
  service: string;
  price: number;
  duration: number;
  rating: number;
  notes?: string;
  date: string;
  createdAt: string;
}

interface Barber {
  _id: string;
  name: string;
}

interface Props {
  storeId: string;
}

const EMPTY_FORM = {
  barberId: "", customerName: "", phone: "", service: "", price: "", duration: "", rating: "5", notes: "", date: new Date().toISOString().split("T")[0],
};

export default function BarberHistoryPanel({ storeId }: Props) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterBarber, setFilterBarber] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const fetchData = async () => {
    try {
      setLoading(true);
      const barbersRes = await fetch(`/api/barbershop/${storeId}/barbers`);
      const barbersData = await barbersRes.json();
      setBarbers(barbersData.barbers || []);

      const params = filterBarber !== "all" ? `?barberId=${filterBarber}` : "";
      const historyRes = await fetch(`/api/barbershop/${storeId}/history${params}`);
      const historyData = await historyRes.json();
      setHistory(historyData.history || []);
    } catch {
      showToast(t("barbershop.error_loading"), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [storeId, filterBarber]);

  const filtered = filterBarber === "all" ? history : history.filter(h => h.barberId === filterBarber);
  const totalServices = filtered.length;
  const totalRevenue = filtered.reduce((s, h) => s + (h.price || 0), 0);
  const avgRating = totalServices > 0 ? filtered.reduce((s, h) => s + (h.rating || 0), 0) / totalServices : 0;

  const addEntry = async () => {
    if (!form.barberId || !form.customerName || !form.service) return;
    try {
      const res = await fetch(`/api/barbershop/${storeId}/history`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barberId: form.barberId,
          barberName: barbers.find(b => b._id === form.barberId)?.name || "",
          customerName: form.customerName,
          phone: form.phone || undefined,
          service: form.service,
          price: parseFloat(form.price) || 0,
          duration: parseInt(form.duration) || 30,
          rating: parseInt(form.rating) || 5,
          notes: form.notes || undefined,
          date: form.date,
        }),
      });
      const data = await res.json();
      setHistory(prev => [data.entry || data, ...prev]);
      setForm(EMPTY_FORM);
      setShowModal(false);
      showToast(t("barbershop.entry_saved"), "success");
    } catch {
      showToast(t("barbershop.error_saving"), "error");
    }
  };

  const renderStars = (count: number) => (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={cn("w-3 h-3", i < count ? "fill-amber-400 text-amber-400" : "text-zinc-200")} />
      ))}
    </div>
  );

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 text-zinc-300 animate-spin" /></div>;
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="max-[400px]:text-xl text-2xl font-black italic text-zinc-950 uppercase tracking-tighter">{t("barbershop.history")}</h3>
        <div className="flex items-center gap-2">
          <select value={filterBarber} onChange={e => setFilterBarber(e.target.value)}
            className="bg-zinc-50 px-3 py-2 rounded-xl border border-zinc-100 outline-none text-xs font-medium">
            <option value="all">{t("barbershop.all_barbers")}</option>
            {barbers.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
          </select>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setForm(EMPTY_FORM); setShowModal(true); }}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-red-600 text-white rounded-xl text-[10px] md:text-xs font-black italic hover:bg-red-700 transition-all shadow-xl shadow-red-100">
            <Plus className="w-3.5 h-3.5" /> {t("barbershop.add_entry")}
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm p-6 flex flex-col items-center justify-center space-y-2">
          <div className="p-2 bg-blue-50 rounded-xl"><TrendingUp className="w-4 h-4 text-blue-500" /></div>
          <p className="text-3xl font-black italic text-zinc-950">{totalServices}</p>
          <p className="text-[9px] font-black text-zinc-400 uppercase italic">{t("barbershop.total_services")}</p>
        </div>
        <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm p-6 flex flex-col items-center justify-center space-y-2">
          <div className="p-2 bg-emerald-50 rounded-xl"><DollarSign className="w-4 h-4 text-emerald-500" /></div>
          <p className="text-3xl font-black italic text-zinc-950">${totalRevenue.toFixed(0)}</p>
          <p className="text-[9px] font-black text-zinc-400 uppercase italic">{t("barbershop.total_revenue")}</p>
        </div>
        <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm p-6 flex flex-col items-center justify-center space-y-2">
          <div className="p-2 bg-amber-50 rounded-xl"><Star className="w-4 h-4 text-amber-500 fill-amber-500" /></div>
          <p className="text-3xl font-black italic text-zinc-950">{avgRating.toFixed(1)}</p>
          <p className="text-[9px] font-black text-zinc-400 uppercase italic">{t("barbershop.avg_rating")}</p>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center italic font-black uppercase tracking-widest text-zinc-200">{t("barbershop.no_history")}</div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(entry => (
            <motion.div key={entry._id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-4 md:p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-black italic text-zinc-950">{entry.customerName}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                    <span className="text-[9px] text-zinc-400 font-bold italic flex items-center gap-1">
                      <Calendar className="w-2.5 h-2.5" /> {new Date(entry.date || entry.createdAt).toLocaleDateString()}
                    </span>
                    <span className="text-[9px] text-zinc-400 font-bold italic flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" /> {entry.duration}{t("barbershop.duration_min")}
                    </span>
                    <span className="text-[9px] text-zinc-400 font-bold italic">{entry.service}</span>
                  </div>
                  {entry.notes && <p className="text-[9px] text-zinc-300 italic mt-1">{entry.notes}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-black italic text-zinc-950">${entry.price?.toFixed(2)}</p>
                  {renderStars(entry.rating)}
                </div>
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
                <h4 className="text-sm font-black italic uppercase tracking-tighter">{t("barbershop.add_entry")}</h4>
                <button onClick={() => setShowModal(false)} className="p-1 hover:bg-zinc-50 rounded-lg"><X className="w-4 h-4 text-zinc-400" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1">{t("barbershop.barber")}</label>
                  <select value={form.barberId} onChange={e => setForm({ ...form, barberId: e.target.value })}
                    className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-red-200 transition-all">
                    <option value="">{t("barbershop.select_barber")}</option>
                    {barbers.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
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
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1">{t("barbershop.service")}</label>
                  <input type="text" value={form.service} onChange={e => setForm({ ...form, service: e.target.value })}
                    className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-red-200 transition-all" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1">{t("barbershop.price")}</label>
                    <input type="number" min="0" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                      className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-red-200 transition-all" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1">{t("barbershop.duration")}</label>
                    <div className="flex items-center gap-1">
                      <input type="number" min="0" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })}
                        className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-red-200 transition-all" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1">{t("barbershop.rating")}</label>
                    <select value={form.rating} onChange={e => setForm({ ...form, rating: e.target.value })}
                      className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-red-200 transition-all">
                      {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} ★</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1">{t("barbershop.date")}</label>
                  <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-red-200 transition-all" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1">{t("barbershop.notes")}</label>
                  <textarea value={form.notes} rows={2} onChange={e => setForm({ ...form, notes: e.target.value })}
                    className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-red-200 transition-all resize-none" />
                </div>
                <motion.button whileTap={{ scale: 0.97 }} onClick={addEntry}
                  disabled={!form.barberId || !form.customerName || !form.service}
                  className="w-full py-4 bg-red-600 text-white rounded-2xl font-black italic hover:bg-red-700 transition-all shadow-xl disabled:opacity-50">
                  {t("barbershop.save")}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
