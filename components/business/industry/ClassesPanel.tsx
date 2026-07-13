"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit3, X, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useToast } from "@/components/ui/Toast";
import type { IClass } from "@/lib/models/Store";
import QRButton from "@/components/business/QRButton";

interface Props { storeId: string | number; onSaveStore?: (storeId: string | number, data: any) => void; store?: any; }

export default function ClassesPanel({ storeId, onSaveStore, store }: Props) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [items, setItems] = useState<IClass[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<IClass | null>(null);
  const [form, setForm] = useState({ name: "", course: "", teacher: "", schedule: "", capacity: "", price: "", enrolled: "", room: "", startDate: "", endDate: "", recurring: "" });

  useEffect(() => { if (store?.classes) setItems(store.classes); }, [store, store?.classes]);

  const save = (data: IClass[]) => { setItems(data); if (onSaveStore) Promise.resolve(onSaveStore(storeId, { classes: data })); };

  const addItem = () => {
    if (!form.name) return;
    const capacity = parseInt(form.capacity) || 0;
    if (editing) {
      save(items.map(i => i.id === editing.id ? { ...i, name: form.name, course: form.course, teacher: form.teacher, schedule: form.schedule, capacity, price: Number(form.price), enrolled: Number(form.enrolled), room: form.room, startDate: form.startDate, endDate: form.endDate, recurring: form.recurring } : i));
    } else {
      save([...items, { id: Date.now(), name: form.name, course: form.course, teacher: form.teacher, schedule: form.schedule, capacity, price: Number(form.price), enrolled: Number(form.enrolled), room: form.room, startDate: form.startDate, endDate: form.endDate, recurring: form.recurring }]);
    }
    setForm({ name: "", course: "", teacher: "", schedule: "", capacity: "", price: "", enrolled: "", room: "", startDate: "", endDate: "", recurring: "" });
    setShowModal(false); setEditing(null);
  };

  const deleteItem = (id: number) => save(items.filter(i => i.id !== id));
  const openNew = () => { setEditing(null); setForm({ name: "", course: "", teacher: "", schedule: "", capacity: "", price: "", enrolled: "", room: "", startDate: "", endDate: "", recurring: "" }); setShowModal(true); };
  const openEdit = (item: IClass) => { setEditing(item); setForm({ name: item.name, course: item.course, teacher: item.teacher, schedule: item.schedule, capacity: String(item.capacity), price: String(item.price || ""), enrolled: String(item.enrolled || ""), room: item.room || "", startDate: item.startDate || "", endDate: item.endDate || "", recurring: item.recurring || "" }); setShowModal(true); };

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3 md:gap-4">
        <h3 className="max-[400px]:text-xl text-2xl font-black italic text-zinc-950 uppercase tracking-tighter">{t("category.classes")} <span className="text-red-600">({items.length})</span></h3>
        <motion.button whileTap={{ scale: 0.95 }} onClick={openNew} className="px-5 md:px-6 py-2.5 md:py-3 bg-red-600 text-white rounded-2xl font-black text-[10px] md:text-xs italic hover:bg-red-700 transition-all shadow-xl flex items-center gap-2">
          <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" /> {t("industry.classes.add")}
        </motion.button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {items.map(item => (
          <div key={item.id} className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-zinc-100 shadow-sm p-5 md:p-6 space-y-4 hover:shadow-lg hover:border-zinc-200 transition-all group">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h4 className="font-black italic text-zinc-950 text-sm md:text-base leading-tight truncate">{item.name}</h4>
                <p className="text-[11px] md:text-xs text-zinc-400 font-medium italic mt-1">{item.course}{item.teacher ? ` — ${item.teacher}` : ""}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <QRButton url={`${typeof window !== "undefined" ? window.location.origin : ""}/s/${store?.slug || "store"}?item=classes|${item.id}`} label={item.name} />
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => openEdit(item)} className="p-1.5 md:p-2 text-zinc-300 hover:text-blue-500 transition-all"><Edit3 className="w-3.5 h-3.5 md:w-4 md:h-4" /></motion.button>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => deleteItem(item.id)} className="p-1.5 md:p-2 text-zinc-300 hover:text-rose-500 transition-all"><Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" /></motion.button>
              </div>
            </div>
            <div className="flex items-center gap-3 text-[8px] md:text-[9px] font-bold text-zinc-400 uppercase italic">
              <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {t("industry.classes.capacity_label")}: {item.capacity}</span>
              <span>{item.schedule}</span>
            </div>
            <div className="flex items-center gap-2 text-[8px] font-bold text-zinc-400 uppercase italic flex-wrap mt-1">
              {item.price > 0 && <span>{t("industry.classes.price_label")}: ${item.price}</span>}
              {item.enrolled > 0 && <span>{t("industry.classes.enrolled_label")}: {item.enrolled}/{item.capacity}</span>}
              {item.room && <span>{t("industry.classes.room_label")}: {item.room}</span>}
              {item.recurring && <span>{t("industry.classes.recurring_label")}: {item.recurring}</span>}
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="col-span-full py-16 text-center italic font-black uppercase tracking-widest text-zinc-200">{t("industry.classes.empty")}</div>}
      </div>
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4" onClick={() => { setShowModal(false); setEditing(null); }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full max-w-md bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-4xl relative" onClick={e => e.stopPropagation()}>
              <button onClick={() => { setShowModal(false); setEditing(null); }} className="absolute top-4 md:top-6 right-4 md:right-6 p-2 hover:bg-zinc-50 rounded-xl"><X className="w-4 h-4 md:w-5 md:h-5 text-zinc-400" /></button>
              <h3 className="text-xl md:text-2xl font-black italic text-zinc-950 mb-4 md:mb-6 uppercase tracking-tighter">{editing ? t("industry.classes.edit_title") : t("industry.classes.new_title")}</h3>
              <div className="space-y-3 md:space-y-4">
                <input type="text" placeholder={t("industry.classes.name_placeholder")} value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm" />
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder={t("industry.classes.course_placeholder")} value={form.course} onChange={e => setForm({...form, course: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm" />
                  <input type="text" placeholder={t("industry.classes.teacher_placeholder")} value={form.teacher} onChange={e => setForm({...form, teacher: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm" />
                </div>
                <input type="text" placeholder={t("industry.classes.schedule_placeholder")} value={form.schedule} onChange={e => setForm({...form, schedule: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm" />
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.classes.capacity_field_label")}</label>
                  <input type="number" placeholder="30" value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.classes.price_label")}</label>
                    <input type="number" placeholder="0" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.classes.room_label")}</label>
                    <input type="text" placeholder={t("industry.classes.room_placeholder")} value={form.room} onChange={e => setForm({...form, room: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.classes.start_date_label")}</label>
                    <input type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.classes.end_date_label")}</label>
                    <input type="date" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.classes.recurring_label")}</label>
                  <select value={form.recurring} onChange={e => setForm({...form, recurring: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm">
                    <option value="">{t("industry.classes.recurring_none")}</option>
                    <option value="daily">{t("industry.classes.recurring_daily")}</option>
                    <option value="weekly">{t("industry.classes.recurring_weekly")}</option>
                    <option value="biweekly">{t("industry.classes.recurring_biweekly")}</option>
                    <option value="monthly">{t("industry.classes.recurring_monthly")}</option>
                  </select>
                </div>
                <button onClick={addItem} disabled={!form.name} className="w-full py-5 bg-red-600 text-white rounded-2xl font-black italic hover:bg-red-700 transition-all shadow-xl disabled:opacity-50">
                  {editing ? t("industry.update") : t("industry.save")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
