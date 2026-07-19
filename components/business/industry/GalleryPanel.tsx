"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit3, X, Image } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useToast } from "@/components/ui/Toast";
import type { IGalleryItem } from "@/lib/models/Store";
import QRButton from "@/components/business/QRButton";

interface Props { storeId: string | number; onSaveStore?: (storeId: string | number, data: any) => void; store?: any; }

export default function GalleryPanel({ storeId, onSaveStore, store }: Props) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [items, setItems] = useState<IGalleryItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<IGalleryItem | null>(null);
  const [form, setForm] = useState({ title: "", imageUrl: "", desc: "", altText: "", category: "", featured: false, date: "" });

  useEffect(() => { if (store?.galleryItems) setItems(store.galleryItems); }, [store, store?.galleryItems]);

  const save = (data: IGalleryItem[]) => { setItems(data); if (onSaveStore) Promise.resolve(onSaveStore(storeId, { galleryItems: data })); };

  const addItem = () => {
    if (!form.title || !form.imageUrl) return;
    if (editing) {
      save(items.map(i => i.id === editing.id ? { ...i, title: form.title, imageUrl: form.imageUrl, desc: form.desc, altText: form.altText, category: form.category, featured: form.featured, date: form.date } : i));
    } else {
      save([...items, { id: Date.now(), title: form.title, imageUrl: form.imageUrl, desc: form.desc, altText: form.altText, category: form.category, featured: form.featured, date: form.date }]);
    }
    setForm({ title: "", imageUrl: "", desc: "", altText: "", category: "", featured: false, date: "" });
    setShowModal(false); setEditing(null);
  };

  const deleteItem = (id: number) => save(items.filter(i => i.id !== id));
  const openNew = () => { setEditing(null); setForm({ title: "", imageUrl: "", desc: "", altText: "", category: "", featured: false, date: "" }); setShowModal(true); };
  const openEdit = (item: IGalleryItem) => { setEditing(item); setForm({ title: item.title, imageUrl: item.imageUrl, desc: item.desc || "", altText: item.altText || "", category: item.category || "", featured: item.featured || false, date: item.date || "" }); setShowModal(true); };

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3 md:gap-4">
        <h3 className="max-[400px]:text-xl text-2xl font-black italic text-zinc-950 uppercase tracking-tighter">{t("category.gallery")} <span className="text-red-600">({items.length})</span></h3>
        <motion.button whileTap={{ scale: 0.95 }} onClick={openNew} className="px-5 md:px-6 py-2.5 md:py-3 bg-red-600 text-white rounded-2xl font-black text-[10px] md:text-xs italic hover:bg-red-700 transition-all shadow-xl flex items-center gap-2">
          <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" /> {t("industry.gallery.add")}
        </motion.button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {items.map(item => (
          <div key={item.id} className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-zinc-100 shadow-sm overflow-hidden hover:shadow-lg hover:border-zinc-200 transition-all group">
            {item.imageUrl && <img src={item.imageUrl} alt={item.title} className="w-full h-48 object-cover" />}
            <div className="p-4 md:p-5 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-black italic text-zinc-950 text-sm leading-tight truncate">{item.title}</h4>
                <div className="flex items-center gap-1 shrink-0">
                  <QRButton url={`${typeof window !== "undefined" ? window.location.origin : ""}/s/${store?.slug || "store"}?item=gallery|${item.id}`} label={item.title} />
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => openEdit(item)} className="p-1 text-zinc-300 hover:text-blue-500 transition-all"><Edit3 className="w-3 h-3" /></motion.button>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => deleteItem(item.id)} className="p-1 text-zinc-300 hover:text-rose-500 transition-all"><Trash2 className="w-3 h-3" /></motion.button>
                </div>
              </div>
              {item.desc && <p className="text-[10px] text-zinc-400 font-medium italic line-clamp-2">{item.desc}</p>}
              <div className="flex items-center gap-2 text-[8px] font-bold text-zinc-400 uppercase italic flex-wrap">
                {item.category && <span>{t("industry.gallery.category_label")}: {item.category}</span>}
                {item.date && <span>{t("industry.gallery.date_label")}: {item.date}</span>}
                {item.featured && <span className="text-amber-600">{t("industry.gallery.featured_label")}</span>}
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="col-span-full py-16 text-center italic font-black uppercase tracking-widest text-zinc-200">{t("industry.gallery.empty")}</div>}
      </div>
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4" onClick={() => { setShowModal(false); setEditing(null); }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full max-w-md bg-white rounded-[2rem] md:rounded-[3rem] p-4 md:p-8 shadow-4xl relative" onClick={e => e.stopPropagation()}>
              <button onClick={() => { setShowModal(false); setEditing(null); }} className="absolute top-4 md:top-6 right-4 md:right-6 p-2 hover:bg-zinc-50 rounded-xl"><X className="w-4 h-4 md:w-5 md:h-5 text-zinc-400" /></button>
              <h3 className="text-lg md:text-2xl font-black italic text-zinc-950 mb-4 md:mb-6 uppercase tracking-tighter">{editing ? t("industry.gallery.edit_title") : t("industry.gallery.new_title")}</h3>
              <div className="space-y-3 md:space-y-4">
                <input type="text" placeholder={t("industry.gallery.title_placeholder")} value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                <input type="text" placeholder={t("industry.gallery.url_placeholder")} value={form.imageUrl} onChange={e => setForm({...form, imageUrl: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                <textarea placeholder={t("industry.gallery.desc_placeholder")} value={form.desc} onChange={e => setForm({...form, desc: e.target.value})} rows={2} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm resize-none" />
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.gallery.alt_text_label")}</label>
                    <input type="text" placeholder={t("industry.gallery.alt_text_placeholder")} value={form.altText} onChange={e => setForm({...form, altText: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.gallery.category_label")}</label>
                    <input type="text" placeholder={t("industry.gallery.category_placeholder")} value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.gallery.date_label")}</label>
                    <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                  </div>
                  <div className="space-y-1.5 flex items-end pb-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.featured} onChange={e => setForm({...form, featured: e.target.checked})} className="w-4 h-4 rounded border-zinc-300 text-red-600 focus:ring-red-500" />
                      <span className="text-[9px] font-black text-zinc-400 uppercase italic tracking-widest">{t("industry.gallery.featured_label")}</span>
                    </label>
                  </div>
                </div>
                <button onClick={addItem} disabled={!form.title || !form.imageUrl} className="w-full py-3 md:py-4 bg-red-600 text-white rounded-2xl font-black italic hover:bg-red-700 transition-all shadow-xl disabled:opacity-50">
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
