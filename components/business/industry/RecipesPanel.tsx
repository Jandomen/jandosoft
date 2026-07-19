"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit3, X, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useToast } from "@/components/ui/Toast";
import type { IRecipe } from "@/lib/models/Store";
import QRButton from "@/components/business/QRButton";

interface Props { storeId: string | number; onSaveStore?: (storeId: string | number, data: any) => void; store?: any; }

export default function RecipesPanel({ storeId, onSaveStore, store }: Props) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [items, setItems] = useState<IRecipe[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<IRecipe | null>(null);
  const [form, setForm] = useState({ name: "", ingredients: "", instructions: "", prepTime: "", cookTime: "", difficulty: "easy", servings: "", calories: "", imageUrl: "", tags: "" });

  useEffect(() => { if (store?.recipes) setItems(store.recipes); }, [store, store?.recipes]);

  const save = (data: IRecipe[]) => { setItems(data); if (onSaveStore) Promise.resolve(onSaveStore(storeId, { recipes: data })); };

  const addItem = () => {
    if (!form.name) return;
    const prepTime = parseInt(form.prepTime) || 0;
    const cookTime = parseInt(form.cookTime) || 0;
    if (editing) {
      save(items.map(i => i.id === editing.id ? { ...i, name: form.name, ingredients: form.ingredients, instructions: form.instructions, prepTime, cookTime, difficulty: form.difficulty, servings: Number(form.servings), calories: Number(form.calories), imageUrl: form.imageUrl, tags: form.tags } : i));
    } else {
      save([...items, { id: Date.now(), name: form.name, ingredients: form.ingredients, instructions: form.instructions, prepTime, cookTime, difficulty: form.difficulty, servings: Number(form.servings), calories: Number(form.calories), imageUrl: form.imageUrl, tags: form.tags }]);
    }
    setForm({ name: "", ingredients: "", instructions: "", prepTime: "", cookTime: "", difficulty: "easy", servings: "", calories: "", imageUrl: "", tags: "" });
    setShowModal(false); setEditing(null);
  };

  const deleteItem = (id: number) => save(items.filter(i => i.id !== id));
  const openNew = () => { setEditing(null); setForm({ name: "", ingredients: "", instructions: "", prepTime: "", cookTime: "", difficulty: "easy", servings: "", calories: "", imageUrl: "", tags: "" }); setShowModal(true); };
  const openEdit = (item: IRecipe) => { setEditing(item); setForm({ name: item.name, ingredients: item.ingredients, instructions: item.instructions, prepTime: String(item.prepTime), cookTime: String(item.cookTime), difficulty: item.difficulty || "easy", servings: String(item.servings || ""), calories: String(item.calories || ""), imageUrl: item.imageUrl || "", tags: item.tags || "" }); setShowModal(true); };

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3 md:gap-4">
        <h3 className="max-[400px]:text-xl text-2xl font-black italic text-zinc-950 uppercase tracking-tighter">{t("category.recipes")} <span className="text-red-600">({items.length})</span></h3>
        <motion.button whileTap={{ scale: 0.95 }} onClick={openNew} className="px-5 md:px-6 py-2.5 md:py-3 bg-red-600 text-white rounded-2xl font-black text-[10px] md:text-xs italic hover:bg-red-700 transition-all shadow-xl flex items-center gap-2">
          <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" /> {t("industry.recipes.add")}
        </motion.button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {items.map(item => (
          <div key={item.id} className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-zinc-100 shadow-sm p-5 md:p-6 space-y-4 hover:shadow-lg hover:border-zinc-200 transition-all group">
            <div className="flex items-start justify-between gap-2 md:gap-3">
              <h4 className="font-black italic text-zinc-950 text-sm md:text-base leading-tight truncate">{item.name}</h4>
              <div className="flex items-center gap-1 shrink-0">
                <QRButton url={`${typeof window !== "undefined" ? window.location.origin : ""}/s/${store?.slug || "store"}?item=recipes|${item.id}`} label={item.name} />
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => openEdit(item)} className="p-1.5 md:p-2 text-zinc-300 hover:text-blue-500 transition-all"><Edit3 className="w-3.5 h-3.5 md:w-4 md:h-4" /></motion.button>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => deleteItem(item.id)} className="p-1.5 md:p-2 text-zinc-300 hover:text-rose-500 transition-all"><Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" /></motion.button>
              </div>
            </div>
            {item.ingredients && <p className="text-[11px] md:text-xs text-zinc-400 font-medium italic line-clamp-2"><span className="text-zinc-600 font-bold">{t("industry.recipes.ingredients_label")}:</span> {item.ingredients}</p>}
            {item.instructions && <p className="text-[11px] md:text-xs text-zinc-400 font-medium italic line-clamp-2"><span className="text-zinc-600 font-bold">{t("industry.recipes.instructions_label")}:</span> {item.instructions}</p>}
            <div className="flex items-center gap-3 text-[8px] md:text-[9px] font-bold text-zinc-400 uppercase italic">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {t("industry.recipes.prep_time")}: {item.prepTime}min</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {t("industry.recipes.cook_time")}: {item.cookTime}min</span>
            </div>
            <div className="flex items-center gap-2 text-[8px] font-bold text-zinc-400 uppercase italic flex-wrap">
              {item.difficulty && <span className="text-[10px] font-bold text-zinc-400 italic capitalize">{t("industry.recipes.difficulty_label")}: {t("industry.recipes.diff_" + item.difficulty)}</span>}
              {item.servings > 0 && <span className="text-[10px] font-bold text-zinc-400 italic">{item.servings} {t("industry.recipes.servings_label")}</span>}
              {item.calories > 0 && <span className="text-[10px] font-bold text-zinc-400 italic">{item.calories} {t("industry.recipes.cal_label")}</span>}
              {item.tags && <span className="text-[10px] font-bold text-zinc-400 italic">{t("industry.recipes.tags_label")}: {item.tags}</span>}
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="col-span-full py-16 text-center italic font-black uppercase tracking-widest text-zinc-200">{t("industry.recipes.empty")}</div>}
      </div>
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4" onClick={() => { setShowModal(false); setEditing(null); }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full max-w-md bg-white rounded-[2rem] md:rounded-[3rem] p-4 md:p-8 shadow-4xl relative" onClick={e => e.stopPropagation()}>
              <button onClick={() => { setShowModal(false); setEditing(null); }} className="absolute top-4 md:top-6 right-4 md:right-6 p-2 hover:bg-zinc-50 rounded-xl"><X className="w-4 h-4 md:w-5 md:h-5 text-zinc-400" /></button>
              <h3 className="text-lg md:text-2xl font-black italic text-zinc-950 mb-4 md:mb-6 uppercase tracking-tighter">{editing ? t("industry.recipes.edit_title") : t("industry.recipes.new_title")}</h3>
              <div className="space-y-3 md:space-y-4">
                <input type="text" placeholder={t("industry.recipes.name_placeholder")} value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                <textarea placeholder={t("industry.recipes.ingredients_placeholder")} value={form.ingredients} onChange={e => setForm({...form, ingredients: e.target.value})} rows={3} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm resize-none" />
                <textarea placeholder={t("industry.recipes.instructions_placeholder")} value={form.instructions} onChange={e => setForm({...form, instructions: e.target.value})} rows={3} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm resize-none" />
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.recipes.prep_time_label")}</label>
                    <input type="number" placeholder="15" value={form.prepTime} onChange={e => setForm({...form, prepTime: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.recipes.cook_time_label")}</label>
                    <input type="number" placeholder="30" value={form.cookTime} onChange={e => setForm({...form, cookTime: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.recipes.difficulty_label")}</label>
                    <select value={form.difficulty} onChange={e => setForm({...form, difficulty: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm">
                      <option value="easy">{t("industry.recipes.diff_easy")}</option>
                      <option value="medium">{t("industry.recipes.diff_medium")}</option>
                      <option value="hard">{t("industry.recipes.diff_hard")}</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.recipes.servings_label")}</label>
                    <input type="number" placeholder="4" value={form.servings} onChange={e => setForm({...form, servings: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.recipes.calories_label")}</label>
                    <input type="number" placeholder="0" value={form.calories} onChange={e => setForm({...form, calories: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.recipes.tags_label")}</label>
                    <input type="text" placeholder={t("industry.recipes.tags_placeholder")} value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                  </div>
                </div>
                <input type="text" placeholder={t("industry.recipes.image_url_placeholder")} value={form.imageUrl} onChange={e => setForm({...form, imageUrl: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                <button onClick={addItem} disabled={!form.name} className="w-full py-3 md:py-4 bg-red-600 text-white rounded-2xl font-black italic hover:bg-red-700 transition-all shadow-xl disabled:opacity-50">
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
