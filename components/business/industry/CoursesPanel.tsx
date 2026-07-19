"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit3, X, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useToast } from "@/components/ui/Toast";
import type { ICourse } from "@/lib/models/Store";
import QRButton from "@/components/business/QRButton";

interface Props { storeId: string | number; onSaveStore?: (storeId: string | number, data: any) => void; store?: any; }

export default function CoursesPanel({ storeId, onSaveStore, store }: Props) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [items, setItems] = useState<ICourse[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ICourse | null>(null);
  const [form, setForm] = useState({ name: "", desc: "", price: "", durationWeeks: "", schedule: "", instructor: "", maxStudents: "", level: "beginner", startDate: "", imageUrl: "" });

  useEffect(() => { if (store?.courses) setItems(store.courses); }, [store, store?.courses]);

  const save = (data: ICourse[]) => { setItems(data); if (onSaveStore) Promise.resolve(onSaveStore(storeId, { courses: data })); };

  const addItem = () => {
    if (!form.name || !form.price) return;
    const price = parseFloat(form.price);
    const durationWeeks = parseInt(form.durationWeeks) || 0;
    if (editing) {
      save(items.map(i => i.id === editing.id ? { ...i, name: form.name, desc: form.desc, price, durationWeeks, schedule: form.schedule, instructor: form.instructor, maxStudents: Number(form.maxStudents), level: form.level, startDate: form.startDate, imageUrl: form.imageUrl } : i));
    } else {
      save([...items, { id: Date.now(), name: form.name, desc: form.desc, price, durationWeeks, schedule: form.schedule, instructor: form.instructor, maxStudents: Number(form.maxStudents), level: form.level, startDate: form.startDate, imageUrl: form.imageUrl }]);
    }
    setForm({ name: "", desc: "", price: "", durationWeeks: "", schedule: "", instructor: "", maxStudents: "", level: "beginner", startDate: "", imageUrl: "" });
    setShowModal(false); setEditing(null);
  };

  const deleteItem = (id: number) => save(items.filter(i => i.id !== id));
  const openNew = () => { setEditing(null); setForm({ name: "", desc: "", price: "", durationWeeks: "", schedule: "", instructor: "", maxStudents: "", level: "beginner", startDate: "", imageUrl: "" }); setShowModal(true); };
  const openEdit = (item: ICourse) => { setEditing(item); setForm({ name: item.name, desc: item.desc, price: String(item.price), durationWeeks: String(item.durationWeeks), schedule: item.schedule, instructor: item.instructor || "", maxStudents: String(item.maxStudents || ""), level: item.level || "beginner", startDate: item.startDate || "", imageUrl: item.imageUrl || "" }); setShowModal(true); };

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3 md:gap-4">
        <h3 className="max-[400px]:text-xl text-2xl font-black italic text-zinc-950 uppercase tracking-tighter">{t("category.courses")} <span className="text-red-600">({items.length})</span></h3>
        <motion.button whileTap={{ scale: 0.95 }} onClick={openNew} className="px-5 md:px-6 py-2.5 md:py-3 bg-red-600 text-white rounded-2xl font-black text-[10px] md:text-xs italic hover:bg-red-700 transition-all shadow-xl flex items-center gap-2">
          <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" /> {t("industry.courses.add")}
        </motion.button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {items.map(item => (
          <div key={item.id} className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-zinc-100 shadow-sm p-5 md:p-6 space-y-4 hover:shadow-lg hover:border-zinc-200 transition-all group">
            <div className="flex items-start justify-between gap-2 md:gap-3">
              <div className="min-w-0 flex-1">
                <h4 className="font-black italic text-zinc-950 text-sm md:text-base leading-tight truncate">{item.name}</h4>
                {item.desc && <p className="text-[11px] md:text-xs text-zinc-400 font-medium italic mt-1 line-clamp-2">{item.desc}</p>}
              </div>
              <span className="text-lg md:text-xl font-black italic text-red-600 shrink-0 whitespace-nowrap">${item.price}</span>
            </div>
            <div className="flex items-center gap-2 text-[8px] font-bold text-zinc-400 uppercase italic flex-wrap">
              {item.instructor && <span>{t("industry.courses.instructor_label")}: {item.instructor}</span>}
              {item.level && <span>{t("industry.courses.level_" + item.level)}</span>}
              {item.maxStudents > 0 && <span>{t("industry.courses.max_students_label")}: {item.maxStudents}</span>}
              {item.startDate && <span>{t("industry.courses.start_label")}: {item.startDate}</span>}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-[8px] md:text-[9px] font-bold text-zinc-400 uppercase italic">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {item.durationWeeks} {t("industry.courses.weeks")}</span>
                <span>{item.schedule}</span>
              </div>
              <div className="flex items-center gap-1">
                <QRButton url={`${typeof window !== "undefined" ? window.location.origin : ""}/s/${store?.slug || "store"}?item=courses|${item.id}`} label={item.name} />
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => openEdit(item)} className="p-1.5 md:p-2 text-zinc-300 hover:text-blue-500 transition-all"><Edit3 className="w-3.5 h-3.5 md:w-4 md:h-4" /></motion.button>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => deleteItem(item.id)} className="p-1.5 md:p-2 text-zinc-300 hover:text-rose-500 transition-all"><Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" /></motion.button>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="col-span-full py-16 text-center italic font-black uppercase tracking-widest text-zinc-200">{t("industry.courses.empty")}</div>}
      </div>
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4" onClick={() => { setShowModal(false); setEditing(null); }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full max-w-md bg-white rounded-[2rem] md:rounded-[3rem] p-4 md:p-8 shadow-4xl relative" onClick={e => e.stopPropagation()}>
              <button onClick={() => { setShowModal(false); setEditing(null); }} className="absolute top-4 md:top-6 right-4 md:right-6 p-2 hover:bg-zinc-50 rounded-xl"><X className="w-4 h-4 md:w-5 md:h-5 text-zinc-400" /></button>
              <h3 className="text-lg md:text-2xl font-black italic text-zinc-950 mb-4 md:mb-6 uppercase tracking-tighter">{editing ? t("industry.courses.edit_title") : t("industry.courses.new_title")}</h3>
              <div className="space-y-3 md:space-y-4">
                <input type="text" placeholder={t("industry.courses.name_placeholder")} value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                <textarea placeholder={t("industry.courses.desc_placeholder")} value={form.desc} onChange={e => setForm({...form, desc: e.target.value})} rows={2} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm resize-none" />
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.courses.price_label")}</label>
                    <input type="number" step="0.01" placeholder="0.00" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.courses.duration_label")}</label>
                    <input type="number" placeholder="8" value={form.durationWeeks} onChange={e => setForm({...form, durationWeeks: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                  </div>
                </div>
                <input type="text" placeholder={t("industry.courses.schedule_placeholder")} value={form.schedule} onChange={e => setForm({...form, schedule: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.courses.instructor_label")}</label>
                    <input type="text" placeholder={t("industry.courses.instructor_placeholder")} value={form.instructor} onChange={e => setForm({...form, instructor: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.courses.level_label")}</label>
                    <select value={form.level} onChange={e => setForm({...form, level: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm">
                      <option value="beginner">{t("industry.courses.level_beginner")}</option>
                      <option value="intermediate">{t("industry.courses.level_intermediate")}</option>
                      <option value="advanced">{t("industry.courses.level_advanced")}</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.courses.max_students_label")}</label>
                    <input type="number" placeholder="30" value={form.maxStudents} onChange={e => setForm({...form, maxStudents: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.courses.start_label")}</label>
                    <input type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                  </div>
                </div>
                <input type="text" placeholder={t("industry.courses.image_url_placeholder")} value={form.imageUrl} onChange={e => setForm({...form, imageUrl: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                <button onClick={addItem} disabled={!form.name || !form.price} className="w-full py-3 md:py-4 bg-red-600 text-white rounded-2xl font-black italic hover:bg-red-700 transition-all shadow-xl disabled:opacity-50">
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
