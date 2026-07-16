"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useToast } from "@/components/ui/Toast";
import {
  Plus, X, Loader2, Scissors, Phone, Mail, ToggleLeft, ToggleRight, Trash2, Edit,
} from "lucide-react";

interface Barber {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  photoUrl?: string;
  specialties: string[];
  bio?: string;
  active: boolean;
  schedule?: Record<string, { start: string; end: string; enabled: boolean }>;
  createdAt: string;
}

interface Props {
  storeId: string;
}

const DAYS_OF_WEEK = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const EMPTY_FORM = {
  name: "", phone: "", email: "", photoUrl: "", specialties: "", bio: "",
  schedule: {} as Record<string, { start: string; end: string; enabled: boolean }>,
};

export default function BarbersPanel({ storeId }: Props) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBarber, setEditingBarber] = useState<Barber | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchBarbers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/barbershop/${storeId}/barbers`);
      const data = await res.json();
      setBarbers(data.barbers || []);
    } catch {
      showToast(t("barbershop.error_loading"), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBarbers(); }, [storeId]);

  const openAdd = () => {
    setEditingBarber(null);
    const sched: Record<string, { start: string; end: string; enabled: boolean }> = {};
    DAYS_OF_WEEK.forEach(d => { sched[d] = { start: "09:00", end: "18:00", enabled: d !== "sunday" }; });
    setForm({ ...EMPTY_FORM, schedule: sched });
    setShowModal(true);
  };

  const openEdit = (barber: Barber) => {
    setEditingBarber(barber);
    const sched = barber.schedule || {};
    DAYS_OF_WEEK.forEach(d => {
      if (!sched[d]) sched[d] = { start: "09:00", end: "18:00", enabled: false };
    });
    setForm({
      name: barber.name,
      phone: barber.phone,
      email: barber.email || "",
      photoUrl: barber.photoUrl || "",
      specialties: (barber.specialties || []).join(", "),
      bio: barber.bio || "",
      schedule: sched,
    });
    setShowModal(true);
  };

  const saveBarber = async () => {
    if (!form.name || !form.phone) return;
    try {
      const body = {
        name: form.name,
        phone: form.phone,
        email: form.email || undefined,
        photoUrl: form.photoUrl || undefined,
        specialties: form.specialties.split(",").map(s => s.trim()).filter(Boolean),
        bio: form.bio || undefined,
        schedule: form.schedule,
      };
      const method = editingBarber ? "PUT" : "POST";
      const url = editingBarber
        ? `/api/barbershop/${storeId}/barbers/${editingBarber._id}`
        : `/api/barbershop/${storeId}/barbers`;
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (editingBarber) {
        setBarbers(prev => prev.map(b => b._id === editingBarber._id ? { ...b, ...data.barber || data } : b));
      } else {
        setBarbers(prev => [data.barber || data, ...prev]);
      }
      setShowModal(false);
      showToast(t("barbershop.barber_saved"), "success");
    } catch {
      showToast(t("barbershop.error_saving"), "error");
    }
  };

  const toggleActive = async (barber: Barber) => {
    try {
      const res = await fetch(`/api/barbershop/${storeId}/barbers/${barber._id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !barber.active }),
      });
      const data = await res.json();
      setBarbers(prev => prev.map(b => b._id === barber._id ? { ...b, active: !barber.active, ...data.barber || {} } : b));
    } catch {
      showToast(t("barbershop.error_saving"), "error");
    }
  };

  const deleteBarber = async (id: string) => {
    try {
      await fetch(`/api/barbershop/${storeId}/barbers/${id}`, { method: "DELETE" });
      setBarbers(prev => prev.filter(b => b._id !== id));
      setConfirmDelete(null);
      showToast(t("barbershop.barber_deleted"), "success");
    } catch {
      showToast(t("barbershop.error_saving"), "error");
    }
  };

  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  const updateScheduleDay = (day: string, field: string, value: string | boolean) => {
    setForm(prev => ({
      ...prev,
      schedule: { ...prev.schedule, [day]: { ...prev.schedule[day], [field]: value } },
    }));
  };

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 text-zinc-300 animate-spin" /></div>;
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="max-[400px]:text-xl text-2xl font-black italic text-zinc-950 uppercase tracking-tighter">{t("barbershop.barbers")}</h3>
        <motion.button whileTap={{ scale: 0.95 }} onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-red-600 text-white rounded-xl text-[10px] md:text-xs font-black italic hover:bg-red-700 transition-all shadow-xl shadow-red-100">
          <Plus className="w-3.5 h-3.5" /> {t("barbershop.new_barber")}
        </motion.button>
      </div>

      {barbers.length === 0 ? (
        <div className="py-16 text-center italic font-black uppercase tracking-widest text-zinc-200">{t("barbershop.no_barbers")}</div>
      ) : (
        <div className="grid gap-3">
          {barbers.map(barber => (
            <motion.div key={barber._id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-4 md:p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {barber.photoUrl ? (
                    <img src={barber.photoUrl} alt={barber.name} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                      <span className="text-xs font-black text-red-600 italic">{getInitials(barber.name)}</span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-black italic text-zinc-950 truncate">{barber.name}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                      {barber.phone && <span className="text-[9px] text-zinc-400 font-bold italic flex items-center gap-1"><Phone className="w-2.5 h-2.5" />{barber.phone}</span>}
                      {barber.email && <span className="text-[9px] text-zinc-400 font-bold italic flex items-center gap-1"><Mail className="w-2.5 h-2.5" />{barber.email}</span>}
                    </div>
                    {barber.specialties && barber.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {barber.specialties.map(s => (
                          <span key={s} className="px-1.5 py-0.5 bg-zinc-50 text-zinc-500 rounded-md text-[8px] font-black italic">{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <span className={cn("text-[8px] font-black italic px-2 py-0.5 rounded-full uppercase shrink-0",
                  barber.active ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500")}>
                  {barber.active ? t("barbershop.active") : t("barbershop.inactive")}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => toggleActive(barber)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-zinc-50 text-zinc-500 rounded-lg text-[9px] font-black italic hover:bg-zinc-100 transition-all">
                  {barber.active ? <ToggleRight className="w-3 h-3 text-emerald-500" /> : <ToggleLeft className="w-3 h-3 text-zinc-300" />}
                  {barber.active ? t("barbershop.inactive") : t("barbershop.active")}
                </motion.button>
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => openEdit(barber)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-zinc-50 text-zinc-500 rounded-lg text-[9px] font-black italic hover:bg-zinc-100 transition-all">
                  <Edit className="w-3 h-3" /> {t("barbershop.edit_barber")}
                </motion.button>
                {confirmDelete === barber._id ? (
                  <div className="flex items-center gap-1.5">
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => deleteBarber(barber._id)}
                      className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-[9px] font-black italic">{t("barbershop.save")}</motion.button>
                    <button onClick={() => setConfirmDelete(null)} className="text-[9px] font-black italic text-zinc-400">{t("barbershop.cancel")}</button>
                  </div>
                ) : (
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => setConfirmDelete(barber._id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-500 rounded-lg text-[9px] font-black italic hover:bg-red-100 transition-all">
                    <Trash2 className="w-3 h-3" />
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
                <h4 className="text-sm font-black italic uppercase tracking-tighter">{editingBarber ? t("barbershop.edit_barber") : t("barbershop.new_barber")}</h4>
                <button onClick={() => setShowModal(false)} className="p-1 hover:bg-zinc-50 rounded-lg"><X className="w-4 h-4 text-zinc-400" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1">{t("barbershop.barber_name")}</label>
                  <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-red-200 transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1">{t("barbershop.phone")}</label>
                    <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                      className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-red-200 transition-all" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1">{t("barbershop.email")}</label>
                    <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                      className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-red-200 transition-all" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1">{t("barbershop.photo_url")}</label>
                  <input type="text" value={form.photoUrl} onChange={e => setForm({ ...form, photoUrl: e.target.value })}
                    className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-red-200 transition-all" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1">{t("barbershop.specialties")}</label>
                  <input type="text" value={form.specialties} onChange={e => setForm({ ...form, specialties: e.target.value })}
                    placeholder={t("barbershop.specialties_placeholder")}
                    className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-red-200 transition-all" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1">{t("barbershop.bio")}</label>
                  <textarea value={form.bio} rows={2} onChange={e => setForm({ ...form, bio: e.target.value })}
                    className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-red-200 transition-all resize-none" />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1">{t("barbershop.schedule")}</label>
                  <div className="space-y-1.5">
                    {DAYS_OF_WEEK.map(day => (
                      <div key={day} className="flex items-center gap-2">
                        <button type="button" onClick={() => updateScheduleDay(day, "enabled", !form.schedule[day]?.enabled)}
                          className={cn("w-5 h-5 rounded-md flex items-center justify-center border transition-all text-[8px] font-black italic shrink-0",
                            form.schedule[day]?.enabled ? "bg-emerald-500 text-white border-emerald-500" : "bg-zinc-50 border-zinc-200 text-zinc-300")}>
                          {form.schedule[day]?.enabled ? "✓" : ""}
                        </button>
                        <span className="text-[10px] font-bold italic text-zinc-500 w-20 shrink-0 capitalize">{day}</span>
                        {form.schedule[day]?.enabled && (
                          <div className="flex items-center gap-1">
                            <input type="time" value={form.schedule[day]?.start || "09:00"}
                              onChange={e => updateScheduleDay(day, "start", e.target.value)}
                              className="bg-zinc-50 px-2 py-1 rounded-lg border border-zinc-100 outline-none text-[10px] font-medium" />
                            <span className="text-[9px] text-zinc-300 font-bold">—</span>
                            <input type="time" value={form.schedule[day]?.end || "18:00"}
                              onChange={e => updateScheduleDay(day, "end", e.target.value)}
                              className="bg-zinc-50 px-2 py-1 rounded-lg border border-zinc-100 outline-none text-[10px] font-medium" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <motion.button whileTap={{ scale: 0.97 }} onClick={saveBarber} disabled={!form.name || !form.phone}
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
