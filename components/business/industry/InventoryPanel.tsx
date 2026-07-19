"use client";

import React, { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Edit3, X, Package } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useToast } from "@/components/ui/Toast";
import type { IInventoryItem } from "@/lib/models/Store";
import QRButton from "@/components/business/QRButton";

interface Props { storeId: string | number; onSaveStore?: (storeId: string | number, data: any) => void; store?: any; }

export default function InventoryPanel({ storeId, onSaveStore, store }: Props) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [items, setItems] = useState<IInventoryItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<IInventoryItem | null>(null);
  const [form, setForm] = useState({ name: "", quantity: "", price: "", supplier: "", category: "", sku: "", minStock: "", location: "", expirationDate: "", unit: "pcs", description: "" });

  useEffect(() => {
    if (store?.inventoryItems) {
      setItems(store.inventoryItems);
    }
  }, [store, store?.inventoryItems]);

  const save = (data: IInventoryItem[]) => { setItems(data); if (onSaveStore) Promise.resolve(onSaveStore(storeId, { inventoryItems: data })); };

  const addItem = () => {
    if (!form.name) return;
    const quantity = parseInt(form.quantity) || 0;
    const price = parseFloat(form.price) || 0;
    if (editing) {
      save(items.map(i => i.id === editing.id ? { ...i, name: form.name, quantity, price, supplier: form.supplier, category: form.category, sku: form.sku, minStock: parseInt(form.minStock) || 0, location: form.location, expirationDate: form.expirationDate, unit: form.unit, description: form.description } : i));
    } else {
      save([...items, { id: Date.now(), name: form.name, quantity, price, supplier: form.supplier, category: form.category, sku: form.sku, minStock: parseInt(form.minStock) || 0, location: form.location, expirationDate: form.expirationDate, unit: form.unit, description: form.description }]);
    }
    setForm({ name: "", quantity: "", price: "", supplier: "", category: "", sku: "", minStock: "", location: "", expirationDate: "", unit: "pcs", description: "" });
    setShowModal(false); setEditing(null);
  };

  const deleteItem = (id: number) => save(items.filter(i => i.id !== id));
  const openNew = () => { setEditing(null); setForm({ name: "", quantity: "", price: "", supplier: "", category: "", sku: "", minStock: "", location: "", expirationDate: "", unit: "pcs", description: "" }); setShowModal(true); };
  const openEdit = (item: IInventoryItem) => { setEditing(item); setForm({ name: item.name, quantity: String(item.quantity), price: String(item.price), supplier: item.supplier || "", category: item.category || "", sku: item.sku || "", minStock: String(item.minStock || ""), location: item.location || "", expirationDate: item.expirationDate || "", unit: item.unit || "pcs", description: item.description || "" }); setShowModal(true); };

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3 md:gap-4">
        <h3 className="max-[400px]:text-xl text-2xl font-black italic text-zinc-950 uppercase tracking-tighter">{t("category.inventory")} <span className="text-red-600">({items.length})</span></h3>
        <motion.button whileTap={{ scale: 0.95 }} onClick={openNew} className="px-5 md:px-6 py-2.5 md:py-3 bg-red-600 text-white rounded-2xl font-black text-[10px] md:text-xs italic hover:bg-red-700 transition-all shadow-xl flex items-center gap-2">
          <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" /> {t("industry.inventory.add")}
        </motion.button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {items.map(item => (
          <div key={item.id} className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-zinc-100 shadow-sm p-5 md:p-6 space-y-4 hover:shadow-lg hover:border-zinc-200 transition-all group">
            <div className="flex items-start justify-between gap-2 md:gap-3">
              <div className="min-w-0 flex-1">
                <h4 className="font-black italic text-zinc-950 text-sm md:text-base leading-tight truncate">{item.name}</h4>
                {item.supplier && <p className="text-[9px] font-bold text-zinc-400 uppercase italic">{t("industry.inventory.supplier_label")}: {item.supplier}</p>}
              </div>
              <span className="text-lg md:text-xl font-black italic text-red-600 shrink-0 whitespace-nowrap">${item.price}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[8px] md:text-[9px] font-bold text-zinc-400 uppercase italic">
                <Package className="w-3 h-3 md:w-3.5 md:h-3.5" /> {t("industry.inventory.stock_label")}: {item.quantity}
              </div>
              <div className="flex items-center gap-1">
                <QRButton url={`${typeof window !== "undefined" ? window.location.origin : ""}/s/${store?.slug || "store"}?item=inventory|${item.id}`} label={item.name} />
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => openEdit(item)} className="p-1.5 md:p-2 text-zinc-300 hover:text-blue-500 transition-all"><Edit3 className="w-3.5 h-3.5 md:w-4 md:h-4" /></motion.button>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => deleteItem(item.id)} className="p-1.5 md:p-2 text-zinc-300 hover:text-rose-500 transition-all"><Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" /></motion.button>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[8px] font-bold text-zinc-400 uppercase italic flex-wrap mt-1">
              {item.sku && <span>{t("industry.inventory.sku_label")}: {item.sku}</span>}
              {item.category && <span>{t("industry.inventory.category_label")}: {item.category}</span>}
              {item.location && <span>{t("industry.inventory.location_label")}: {item.location}</span>}
              {item.minStock > 0 && <span className={item.quantity <= item.minStock ? "text-red-500" : ""}>{t("industry.inventory.min_stock_label")}: {item.minStock}</span>}
              {item.expirationDate && <span>{t("industry.inventory.expiry_label")}: {item.expirationDate}</span>}
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="col-span-full py-16 text-center italic font-black uppercase tracking-widest text-zinc-200">{t("industry.inventory.empty")}</div>}
      </div>
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4" onClick={() => { setShowModal(false); setEditing(null); }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full max-w-md bg-white rounded-[2rem] md:rounded-[3rem] p-4 md:p-8 shadow-4xl relative" onClick={e => e.stopPropagation()}>
              <button onClick={() => { setShowModal(false); setEditing(null); }} className="absolute top-4 md:top-6 right-4 md:right-6 p-2 hover:bg-zinc-50 rounded-xl"><X className="w-4 h-4 md:w-5 md:h-5 text-zinc-400" /></button>
              <h3 className="text-lg md:text-2xl font-black italic text-zinc-950 mb-4 md:mb-6 uppercase tracking-tighter">{editing ? t("industry.inventory.edit_title") : t("industry.inventory.new_title")}</h3>
              <div className="space-y-3 md:space-y-4">
                <input type="text" placeholder={t("industry.inventory.name_placeholder")} value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.inventory.quantity_label")}</label>
                    <input type="number" placeholder="0" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.inventory.price_label")}</label>
                    <input type="number" step="0.01" placeholder="0.00" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                  </div>
                </div>
                <input type="text" placeholder={t("industry.inventory.supplier_placeholder")} value={form.supplier} onChange={e => setForm({...form, supplier: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.inventory.sku_label")}</label>
                    <input type="text" placeholder={t("industry.inventory.sku_placeholder")} value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.inventory.category_label")}</label>
                    <input type="text" placeholder={t("industry.inventory.category_placeholder")} value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.inventory.min_stock_label")}</label>
                    <input type="number" placeholder="5" value={form.minStock} onChange={e => setForm({...form, minStock: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.inventory.unit_label")}</label>
                    <input type="text" placeholder="pcs, kg, l" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.inventory.location_label")}</label>
                    <input type="text" placeholder={t("industry.inventory.location_placeholder")} value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.inventory.expiry_label")}</label>
                    <input type="date" value={form.expirationDate} onChange={e => setForm({...form, expirationDate: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                  </div>
                </div>
                <textarea placeholder={t("industry.inventory.desc_placeholder")} value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm resize-none" />
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
