"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useToast } from "@/components/ui/Toast";
import {
  Plus, X, Loader2, Calendar, Phone, Users, Clock,
  CheckCircle2, XCircle, AlertTriangle,
} from "lucide-react";

interface Reservation {
  _id: string;
  customerName: string;
  phone: string;
  email?: string;
  date: string;
  time: string;
  partySize: number;
  tableNumber?: number;
  status: string;
  notes?: string;
}

interface Props {
  storeId: string;
  category?: string;
}

const RESTAURANT_TABS = ["all", "pending", "confirmed", "seated", "completed", "cancelled"] as const;
const GENERIC_TABS = ["all", "pending", "confirmed", "completed", "cancelled"] as const;
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  seated: "bg-emerald-100 text-emerald-700",
  completed: "bg-zinc-100 text-zinc-500",
  cancelled: "bg-red-100 text-red-600",
};

const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => {
  const h = Math.floor(i / 2) + 11;
  const m = i % 2 === 0 ? "00" : "30";
  return `${h > 23 ? h - 24 : h}:${m}`;
}).filter(t => { const h = parseInt(t.split(":")[0]); return h >= 11 && h <= 23; });

export default function ReservationsPanel({ storeId, category = "restaurant" }: Props) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const isRestaurant = category === "restaurant" || category === "catering" || category === "coffee_shop" || category === "bakery";
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split("T")[0]);
  const [showModal, setShowModal] = useState(false);
  const [tables, setTables] = useState<any[]>([]);
  const [form, setForm] = useState({
    customerName: "", phone: "", email: "", date: new Date().toISOString().split("T")[0],
    time: "09:00", partySize: "2", tableNumber: "", notes: "",
  });
  const [conflict, setConflict] = useState(false);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/restaurant/${storeId}/reservations`);
      const data = await res.json();
      setReservations(data.reservations || []);
    } catch {
      showToast(t("restaurant.error_loading"), "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchTables = async () => {
    if (!isRestaurant) return;
    try {
      const res = await fetch(`/api/restaurant/${storeId}`);
      const data = await res.json();
      setTables(data.tables || []);
    } catch {}
  };

  useEffect(() => { fetchReservations(); fetchTables(); }, [storeId]);

  useEffect(() => {
    const sameSlot = reservations.filter(r =>
      r.date === form.date && r.time === form.time &&
      r.status !== "cancelled" && r.status !== "completed"
    );
    setConflict(sameSlot.length > 0);
  }, [form.date, form.time, reservations]);

  const filtered = reservations.filter(r => {
    if (activeTab !== "all" && r.status !== activeTab) return false;
    if (dateFilter && r.date !== dateFilter) return false;
    return true;
  });

  const STATUS_TABS = isRestaurant ? RESTAURANT_TABS : GENERIC_TABS;
  const tabCounts = STATUS_TABS.reduce((acc, tab) => {
    acc[tab] = tab === "all"
      ? reservations.filter(r => !dateFilter || r.date === dateFilter).length
      : reservations.filter(r => r.status === tab && (!dateFilter || r.date === dateFilter)).length;
    return acc;
  }, {} as Record<string, number>);

  const createReservation = async () => {
    if (!form.customerName || (isRestaurant && !form.phone)) return;
    try {
      const res = await fetch(`/api/restaurant/${storeId}/reservations`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.customerName, phone: form.phone, email: form.email,
          date: form.date, time: form.time, partySize: isRestaurant ? (parseInt(form.partySize) || 2) : 1,
          tableNumber: isRestaurant && form.tableNumber ? parseInt(form.tableNumber) : undefined,
          notes: form.notes,
        }),
      });
      const data = await res.json();
      setReservations(prev => [data.reservation || data, ...prev]);
      setShowModal(false);
      setForm({ customerName: "", phone: "", email: "", date: new Date().toISOString().split("T")[0], time: isRestaurant ? "19:00" : "09:00", partySize: "2", tableNumber: "", notes: "" });
      showToast(t("restaurant.reservation_created"), "success");
    } catch {
      showToast(t("restaurant.error_saving"), "error");
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await fetch(`/api/restaurant/${storeId}/reservations/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setReservations(prev => prev.map(r => r._id === id ? { ...r, status } : r));
      showToast(t("restaurant.status_updated"), "success");
    } catch {
      showToast(t("restaurant.error_saving"), "error");
    }
  };

  const availableTables = tables.filter(t => t.status === "free");

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="max-[400px]:text-xl text-2xl font-black italic text-zinc-950 uppercase tracking-tighter">{t("restaurant.reservations")}</h3>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-zinc-50 rounded-xl border border-zinc-100 px-3 py-2">
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
              className="bg-transparent outline-none text-xs font-medium" />
          </div>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-red-600 text-white rounded-xl text-[10px] md:text-xs font-black italic hover:bg-red-700 transition-all shadow-xl shadow-red-100">
            <Plus className="w-3.5 h-3.5" /> {t("restaurant.new_reservation")}
          </motion.button>
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
        {STATUS_TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={cn("flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black italic whitespace-nowrap transition-all",
              activeTab === tab ? "bg-red-600 text-white shadow-md" : "bg-zinc-50 text-zinc-500 hover:bg-zinc-100")}>
            {t(`restaurant.tab_${tab}`)}
            <span className={cn("px-1.5 py-0.5 rounded-full text-[8px]", activeTab === tab ? "bg-white/20" : "bg-zinc-200 text-zinc-500")}>
              {tabCounts[tab]}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 text-zinc-300 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center italic font-black uppercase tracking-widest text-zinc-200">{t("restaurant.no_reservations")}</div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(res => (
            <motion.div key={res._id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-4 md:p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-black italic text-zinc-950 truncate">{res.customerName}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                    {res.phone && <span className="text-[9px] text-zinc-400 font-bold italic flex items-center gap-1"><Phone className="w-2.5 h-2.5" />{res.phone}</span>}
                    {isRestaurant && <span className="text-[9px] text-zinc-400 font-bold italic flex items-center gap-1"><Users className="w-2.5 h-2.5" />{res.partySize}</span>}
                    <span className="text-[9px] text-zinc-400 font-bold italic flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{res.date} {res.time}</span>
                    {isRestaurant && res.tableNumber && <span className="text-[9px] text-zinc-400 font-bold italic">{t("restaurant.table")} {res.tableNumber}</span>}
                  </div>
                  {res.notes && <p className="text-[9px] text-zinc-300 italic mt-1">{res.notes}</p>}
                </div>
                <span className={cn("text-[8px] font-black italic px-2 py-0.5 rounded-full uppercase shrink-0", STATUS_COLORS[res.status])}>
                  {t(`restaurant.status_${res.status}`)}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {res.status === "pending" && (
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => updateStatus(res._id, "confirmed")}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[9px] font-black italic hover:bg-blue-700 transition-all">
                    <CheckCircle2 className="w-3 h-3" /> {t("restaurant.confirm")}
                  </motion.button>
                )}
                {res.status === "confirmed" && (
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => updateStatus(res._id, "seated")}
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-[9px] font-black italic hover:bg-emerald-700 transition-all">
                    <CheckCircle2 className="w-3 h-3" /> {t("restaurant.seat")}
                  </motion.button>
                )}
                {res.status === "seated" && (
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => updateStatus(res._id, "completed")}
                    className="flex items-center gap-1 px-3 py-1.5 bg-zinc-600 text-white rounded-lg text-[9px] font-black italic hover:bg-zinc-700 transition-all">
                    {t("restaurant.complete")}
                  </motion.button>
                )}
                {["pending", "confirmed"].includes(res.status) && (
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => updateStatus(res._id, "cancelled")}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-[9px] font-black italic hover:bg-red-100 transition-all">
                    <XCircle className="w-3 h-3" /> {t("restaurant.cancel")}
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
                <h4 className="text-sm font-black italic uppercase tracking-tighter">{t("restaurant.new_reservation")}</h4>
                <button onClick={() => setShowModal(false)} className="p-1 hover:bg-zinc-50 rounded-lg"><X className="w-4 h-4 text-zinc-400" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1">{t("restaurant.customer_name")}</label>
                  <input type="text" value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })}
                    className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-red-200 transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1">{t("restaurant.phone")}{isRestaurant ? "" : " (opcional)"}</label>
                    <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                      className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-red-200 transition-all" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1">{t("restaurant.email")}</label>
                    <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                      className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-red-200 transition-all" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1">{t("restaurant.date")}</label>
                    <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                      className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-red-200 transition-all" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1">{t("restaurant.time")}</label>
                    <select value={form.time} onChange={e => setForm({ ...form, time: e.target.value })}
                      className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-red-200 transition-all">
                      {TIME_SLOTS.map(slot => <option key={slot} value={slot}>{slot}</option>)}
                    </select>
                  </div>
                  {isRestaurant && (
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1">{t("restaurant.party_size")}</label>
                      <input type="number" min="1" value={form.partySize} onChange={e => setForm({ ...form, partySize: e.target.value })}
                        className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-red-200 transition-all" />
                    </div>
                  )}
                </div>

                {conflict && (
                  <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[10px] font-bold text-amber-700 italic">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {t("restaurant.time_slot_busy")}
                  </div>
                )}

                {isRestaurant && (
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1">{t("restaurant.assign_table")}</label>
                    <select value={form.tableNumber} onChange={e => setForm({ ...form, tableNumber: e.target.value })}
                      className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-red-200 transition-all">
                      <option value="">{t("restaurant.no_table")}</option>
                      {availableTables.map(tb => (
                        <option key={tb.id || tb._id} value={tb.number}>{t("restaurant.table")} {tb.number} ({tb.capacity} {t("restaurant.people")})</option>
                      ))}
                    </select>
                  </div>
                )}

                <textarea placeholder={t("restaurant.notes")} value={form.notes} rows={2}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-red-200 transition-all resize-none" />

                <motion.button whileTap={{ scale: 0.97 }} onClick={createReservation} disabled={!form.customerName || (isRestaurant && !form.phone)}
                  className="w-full py-4 bg-red-600 text-white rounded-2xl font-black italic hover:bg-red-700 transition-all shadow-xl disabled:opacity-50">
                  {t("restaurant.create_reservation")}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
