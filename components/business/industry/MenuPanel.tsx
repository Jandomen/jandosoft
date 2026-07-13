"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit3, X, Clock, UtensilsCrossed } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useToast } from "@/components/ui/Toast";
import type { IMenuItem } from "@/lib/models/Store";
import QRButton from "@/components/business/QRButton";

interface Props {
  storeId: string | number;
  onSaveStore?: (storeId: string | number, data: any) => void;
  store?: any;
}

export default function MenuPanel({ storeId, onSaveStore, store }: Props) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [items, setItems] = useState<IMenuItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<IMenuItem | null>(null);
  const [form, setForm] = useState({ name: "", desc: "", price: "", category: "general", imageUrl: "", ingredients: "", calories: "", dietaryInfo: "", featured: false, preparationTime: "" });

  useEffect(() => {
    if (store?.menuItems) setItems(store.menuItems);
  }, [store, store?.menuItems]);

  const save = (data: IMenuItem[]) => {
    setItems(data);
    if (onSaveStore) Promise.resolve(onSaveStore(storeId, { menuItems: data }));
  };

  const addItem = () => {
    if (!form.name || !form.price) return;
    const price = parseFloat(form.price);
    if (editing) {
      save(items.map(i => i.id === editing.id ? { ...i, name: form.name, desc: form.desc, price, category: form.category, imageUrl: form.imageUrl, ingredients: form.ingredients, calories: Number(form.calories), dietaryInfo: form.dietaryInfo, featured: form.featured, preparationTime: Number(form.preparationTime) } : i));
    } else {
      save([...items, { id: Date.now(), name: form.name, desc: form.desc, price, category: form.category, imageUrl: form.imageUrl, ingredients: form.ingredients, calories: Number(form.calories), dietaryInfo: form.dietaryInfo, featured: form.featured, preparationTime: Number(form.preparationTime) }]);
    }
    setForm({ name: "", desc: "", price: "", category: "general", imageUrl: "", ingredients: "", calories: "", dietaryInfo: "", featured: false, preparationTime: "" });
    setShowModal(false);
    setEditing(null);
  };

  const deleteItem = (id: number) => save(items.filter(i => i.id !== id));

  const openNew = () => { setEditing(null); setForm({ name: "", desc: "", price: "", category: "general", imageUrl: "", ingredients: "", calories: "", dietaryInfo: "", featured: false, preparationTime: "" }); setShowModal(true); };
  const openEdit = (item: IMenuItem) => { setEditing(item); setForm({ name: item.name, desc: item.desc, price: String(item.price), category: item.category, imageUrl: item.imageUrl, ingredients: item.ingredients || "", calories: String(item.calories || ""), dietaryInfo: item.dietaryInfo || "", featured: item.featured || false, preparationTime: String(item.preparationTime || "") }); setShowModal(true); };

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3 md:gap-4">
        <h3 className="max-[400px]:text-xl text-2xl font-black italic text-zinc-950 uppercase tracking-tighter">{t("category.menu")} <span className="text-red-600">({items.length})</span></h3>
        <motion.button whileTap={{ scale: 0.95 }} onClick={openNew} className="px-5 md:px-6 py-2.5 md:py-3 bg-red-600 text-white rounded-2xl font-black text-[10px] md:text-xs italic hover:bg-red-700 transition-all shadow-xl flex items-center gap-2">
          <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" /> {t("industry.menu.add")}
        </motion.button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {items.map(item => (
          <div key={item.id} className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-zinc-100 shadow-sm p-5 md:p-6 space-y-4 hover:shadow-lg hover:border-zinc-200 transition-all group">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h4 className="font-black italic text-zinc-950 text-sm md:text-base leading-tight truncate">{item.name}</h4>
                {item.desc && <p className="text-[11px] md:text-xs text-zinc-400 font-medium italic mt-1 line-clamp-2">{item.desc}</p>}
                <span className="text-[9px] font-bold text-zinc-400 uppercase italic mt-1 block">{t("industry.menu.cat_" + (item.category || "general").toLowerCase().replace(/\s+/g, '_')) || item.category}</span>
              </div>
              <span className="text-lg md:text-xl font-black italic text-red-600 shrink-0 whitespace-nowrap">${item.price}</span>
            </div>
            {item.ingredients && <p className="text-[10px] text-zinc-400 font-medium italic">{t("industry.menu.ingredients_label")}: {item.ingredients}</p>}
            <div className="flex items-center gap-2 text-[8px] font-bold text-zinc-400 uppercase italic flex-wrap">
              {item.calories > 0 && <span>{item.calories} {t("industry.menu.cal_label")}</span>}
              {item.preparationTime > 0 && <span>⏱ {item.preparationTime}min</span>}
              {item.dietaryInfo && <span className="text-emerald-600">{item.dietaryInfo}</span>}
              {item.featured && <span className="text-amber-600">{t("industry.menu.featured_label")}</span>}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[8px] md:text-[9px] font-bold text-zinc-400 uppercase italic">
                  <UtensilsCrossed className="w-3 h-3 md:w-3.5 md:h-3.5" /> {t("industry.menu.cat_" + (item.category || "general").toLowerCase().replace(/\s+/g, '_')) || item.category}
              </div>
              <div className="flex items-center gap-1">
                <QRButton url={`${typeof window !== "undefined" ? window.location.origin : ""}/s/${store?.slug || "store"}?item=menu|${item.id}`} label={item.name} />
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => openEdit(item)} className="p-1.5 md:p-2 text-zinc-300 hover:text-blue-500 transition-all"><Edit3 className="w-3.5 h-3.5 md:w-4 md:h-4" /></motion.button>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => deleteItem(item.id)} className="p-1.5 md:p-2 text-zinc-300 hover:text-rose-500 transition-all"><Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" /></motion.button>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="col-span-full py-16 text-center italic font-black uppercase tracking-widest text-zinc-200">{t("industry.menu.empty")}</div>}
      </div>
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4" onClick={() => { setShowModal(false); setEditing(null); }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full max-w-md bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-4xl relative" onClick={e => e.stopPropagation()}>
              <button onClick={() => { setShowModal(false); setEditing(null); }} className="absolute top-4 md:top-6 right-4 md:right-6 p-2 hover:bg-zinc-50 rounded-xl"><X className="w-4 h-4 md:w-5 md:h-5 text-zinc-400" /></button>
              <h3 className="text-xl md:text-2xl font-black italic text-zinc-950 mb-4 md:mb-6 uppercase tracking-tighter">{editing ? t("industry.menu.edit_title") : t("industry.menu.new_title")}</h3>
              <div className="space-y-3 md:space-y-4">
                <input type="text" placeholder={t("industry.menu.name_placeholder")} value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm" />
                <textarea placeholder={t("industry.menu.desc_placeholder")} value={form.desc} onChange={e => setForm({...form, desc: e.target.value})} rows={2} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm resize-none" />
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.menu.price_label")}</label>
                    <input type="number" step="0.01" placeholder="0.00" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.menu.category_label")}</label>
                    <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm">
                      <option value="entradas">{t("industry.menu.cat_entradas")}</option>
                      <option value="platos_fuertes">{t("industry.menu.cat_platos_fuertes")}</option>
                      <option value="postres">{t("industry.menu.cat_postres")}</option>
                      <option value="bebidas">{t("industry.menu.cat_bebidas")}</option>
                      <option value="general">{t("industry.menu.cat_general")}</option>
                    </select>
                  </div>
                </div>
                <input type="text" placeholder={t("industry.menu.image_url_placeholder")} value={form.imageUrl} onChange={e => setForm({...form, imageUrl: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm" />
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.menu.calories_label")}</label>
                    <input type="number" placeholder={t("industry.menu.calories_placeholder")} value={form.calories} onChange={e => setForm({...form, calories: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.menu.prep_time_label")}</label>
                    <input type="number" placeholder={t("industry.menu.prep_time_placeholder")} value={form.preparationTime} onChange={e => setForm({...form, preparationTime: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm" />
                  </div>
                </div>
                <textarea placeholder={t("industry.menu.ingredients_placeholder")} value={form.ingredients} onChange={e => setForm({...form, ingredients: e.target.value})} rows={2} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm resize-none" />
                <input type="text" placeholder={t("industry.menu.dietary_placeholder")} value={form.dietaryInfo} onChange={e => setForm({...form, dietaryInfo: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm" />
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="featured" checked={form.featured} onChange={e => setForm({...form, featured: e.target.checked})} className="w-4 h-4 rounded border-zinc-300 text-red-600 focus:ring-red-500" />
                  <label htmlFor="featured" className="text-[9px] font-black text-zinc-400 uppercase italic tracking-widest">{t("industry.menu.featured_label")}</label>
                </div>
                <button onClick={addItem} disabled={!form.name || !form.price} className="w-full py-5 bg-red-600 text-white rounded-2xl font-black italic hover:bg-red-700 transition-all shadow-xl disabled:opacity-50">
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
