"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit3, X, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useToast } from "@/components/ui/Toast";
import type { ITestimonial } from "@/lib/models/Store";
import QRButton from "@/components/business/QRButton";

interface Props { storeId: string | number; onSaveStore?: (storeId: string | number, data: any) => void; store?: any; }

export default function TestimonialsPanel({ storeId, onSaveStore, store }: Props) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [items, setItems] = useState<ITestimonial[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ITestimonial | null>(null);
  const [form, setForm] = useState({ clientName: "", text: "", rating: "5", date: "", company: "", position: "", avatar: "", approved: true, featured: false });

  useEffect(() => { if (store?.testimonials) setItems(store.testimonials); }, [store, store?.testimonials]);

  const save = (data: ITestimonial[]) => { setItems(data); if (onSaveStore) Promise.resolve(onSaveStore(storeId, { testimonials: data })); };

  const addItem = () => {
    if (!form.clientName || !form.text) return;
    const rating = parseInt(form.rating) || 5;
    if (editing) {
      save(items.map(i => i.id === editing.id ? { ...i, clientName: form.clientName, text: form.text, rating, date: form.date, company: form.company, position: form.position, avatar: form.avatar, approved: form.approved, featured: form.featured } : i));
    } else {
      save([...items, { id: Date.now(), clientName: form.clientName, text: form.text, rating, date: form.date, company: form.company, position: form.position, avatar: form.avatar, approved: form.approved, featured: form.featured }]);
    }
    setForm({ clientName: "", text: "", rating: "5", date: "", company: "", position: "", avatar: "", approved: true, featured: false });
    setShowModal(false); setEditing(null);
  };

  const deleteItem = (id: number) => save(items.filter(i => i.id !== id));
  const openNew = () => { setEditing(null); setForm({ clientName: "", text: "", rating: "5", date: "", company: "", position: "", avatar: "", approved: true, featured: false }); setShowModal(true); };
  const openEdit = (item: ITestimonial) => { setEditing(item); setForm({ clientName: item.clientName, text: item.text, rating: String(item.rating), date: item.date || "", company: item.company || "", position: item.position || "", avatar: item.avatar || "", approved: item.approved !== undefined ? item.approved : true, featured: item.featured || false }); setShowModal(true); };

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3 md:gap-4">
        <h3 className="max-[400px]:text-xl text-2xl font-black italic text-zinc-950 uppercase tracking-tighter">{t("category.testimonials")} <span className="text-red-600">({items.length})</span></h3>
        <motion.button whileTap={{ scale: 0.95 }} onClick={openNew} className="px-5 md:px-6 py-2.5 md:py-3 bg-red-600 text-white rounded-2xl font-black text-[10px] md:text-xs italic hover:bg-red-700 transition-all shadow-xl flex items-center gap-2">
          <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" /> {t("industry.testimonials.add")}
        </motion.button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {items.map(item => (
          <div key={item.id} className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-zinc-100 shadow-sm p-5 md:p-6 space-y-4 hover:shadow-lg hover:border-zinc-200 transition-all group">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h4 className="font-black italic text-zinc-950 text-sm md:text-base leading-tight truncate">{item.clientName}</h4>
                <div className="flex items-center gap-0.5 mt-1">
                  {[1,2,3,4,5].map(n => <Star key={n} className={`w-3 h-3 ${n <= item.rating ? "text-yellow-400 fill-yellow-400" : "text-zinc-200"}`} />)}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <QRButton url={`${typeof window !== "undefined" ? window.location.origin : ""}/s/${store?.slug || "store"}?item=testimonials|${item.id}`} label={item.clientName} />
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => openEdit(item)} className="p-1.5 md:p-2 text-zinc-300 hover:text-blue-500 transition-all"><Edit3 className="w-3.5 h-3.5 md:w-4 md:h-4" /></motion.button>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => deleteItem(item.id)} className="p-1.5 md:p-2 text-zinc-300 hover:text-rose-500 transition-all"><Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" /></motion.button>
                </div>
                <div className="flex items-center gap-2 text-[8px] font-bold text-zinc-400 uppercase italic flex-wrap mt-1">
                  {item.company && <span>{t("industry.testimonials.company_label")}: {item.company}</span>}
                  {item.position && <span>{t("industry.testimonials.position_label")}: {item.position}</span>}
                  {item.date && <span>{t("industry.testimonials.date_label")}: {item.date}</span>}
                  {item.featured && <span className="text-amber-600">{t("industry.testimonials.featured_label")}</span>}
                </div>
              </div>
              <p className="text-[11px] md:text-xs text-zinc-500 font-medium italic leading-relaxed">"{item.text}"</p>
          </div>
        ))}
        {items.length === 0 && <div className="col-span-full py-16 text-center italic font-black uppercase tracking-widest text-zinc-200">{t("industry.testimonials.empty")}</div>}
      </div>
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4" onClick={() => { setShowModal(false); setEditing(null); }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full max-w-md bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-4xl relative" onClick={e => e.stopPropagation()}>
              <button onClick={() => { setShowModal(false); setEditing(null); }} className="absolute top-4 md:top-6 right-4 md:right-6 p-2 hover:bg-zinc-50 rounded-xl"><X className="w-4 h-4 md:w-5 md:h-5 text-zinc-400" /></button>
              <h3 className="text-xl md:text-2xl font-black italic text-zinc-950 mb-4 md:mb-6 uppercase tracking-tighter">{editing ? t("industry.testimonials.edit_title") : t("industry.testimonials.new_title")}</h3>
              <div className="space-y-3 md:space-y-4">
                <input type="text" placeholder={t("industry.testimonials.client_name_placeholder")} value={form.clientName} onChange={e => setForm({...form, clientName: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm" />
                <textarea placeholder={t("industry.testimonials.text_placeholder")} value={form.text} onChange={e => setForm({...form, text: e.target.value})} rows={3} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm resize-none" />
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.testimonials.rating_label")}</label>
                  <select value={form.rating} onChange={e => setForm({...form, rating: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm">
                    {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} {"★"}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.testimonials.company_label")}</label>
                    <input type="text" placeholder={t("industry.testimonials.company_placeholder")} value={form.company} onChange={e => setForm({...form, company: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.testimonials.position_label")}</label>
                    <input type="text" placeholder={t("industry.testimonials.position_placeholder")} value={form.position} onChange={e => setForm({...form, position: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.testimonials.date_label")}</label>
                    <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.testimonials.avatar_label")}</label>
                    <input type="text" placeholder={t("industry.testimonials.avatar_placeholder")} value={form.avatar} onChange={e => setForm({...form, avatar: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm" />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.approved} onChange={e => setForm({...form, approved: e.target.checked})} className="w-4 h-4 rounded border-zinc-300 text-red-600 focus:ring-red-500" />
                    <span className="text-[9px] font-black text-zinc-400 uppercase italic tracking-widest">{t("industry.testimonials.approved_label")}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.featured} onChange={e => setForm({...form, featured: e.target.checked})} className="w-4 h-4 rounded border-zinc-300 text-red-600 focus:ring-red-500" />
                    <span className="text-[9px] font-black text-zinc-400 uppercase italic tracking-widest">{t("industry.testimonials.featured_label")}</span>
                  </label>
                </div>
                <button onClick={addItem} disabled={!form.clientName || !form.text} className="w-full py-5 bg-red-600 text-white rounded-2xl font-black italic hover:bg-red-700 transition-all shadow-xl disabled:opacity-50">
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
