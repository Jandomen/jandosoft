"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit3, X, FileText, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useToast } from "@/components/ui/Toast";
import type { IDocument } from "@/lib/models/Store";
import QRButton from "@/components/business/QRButton";

interface Props { storeId: string | number; onSaveStore?: (storeId: string | number, data: any) => void; store?: any; }

export default function DocumentsPanel({ storeId, onSaveStore, store }: Props) {
  const { t } = useLanguage();
  const TYPES = [t("industry.documents.type_contract"), t("industry.documents.type_invoice"), t("industry.documents.type_report"), t("industry.documents.type_legal"), t("industry.documents.type_other")];
  const { showToast } = useToast();
  const [items, setItems] = useState<IDocument[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<IDocument | null>(null);
  const [form, setForm] = useState({ name: "", fileUrl: "", type: "General", desc: "", uploadDate: "", tags: "", size: "", version: "1.0", expiryDate: "", signed: false });

  useEffect(() => { if (store?.documents) setItems(store.documents); }, [store, store?.documents]);

  const save = (data: IDocument[]) => { setItems(data); if (onSaveStore) Promise.resolve(onSaveStore(storeId, { documents: data })); };

  const addItem = () => {
    if (!form.name || !form.fileUrl) return;
    if (editing) {
      save(items.map(i => i.id === editing.id ? { ...i, name: form.name, fileUrl: form.fileUrl, type: form.type, desc: form.desc, uploadDate: form.uploadDate, tags: form.tags, size: parseInt(form.size) || 0, version: form.version, expiryDate: form.expiryDate, signed: form.signed } : i));
    } else {
      save([...items, { id: Date.now(), name: form.name, fileUrl: form.fileUrl, type: form.type, desc: form.desc, uploadDate: form.uploadDate, tags: form.tags, size: parseInt(form.size) || 0, version: form.version, expiryDate: form.expiryDate, signed: form.signed }]);
    }
    setForm({ name: "", fileUrl: "", type: "General", desc: "", uploadDate: "", tags: "", size: "", version: "1.0", expiryDate: "", signed: false });
    setShowModal(false); setEditing(null);
  };

  const deleteItem = (id: number) => save(items.filter(i => i.id !== id));
  const openNew = () => { setEditing(null); setForm({ name: "", fileUrl: "", type: "General", desc: "", uploadDate: "", tags: "", size: "", version: "1.0", expiryDate: "", signed: false }); setShowModal(true); };
  const openEdit = (item: IDocument) => { setEditing(item); setForm({ name: item.name, fileUrl: item.fileUrl, type: item.type, desc: item.desc || "", uploadDate: item.uploadDate || "", tags: item.tags || "", size: String(item.size || ""), version: item.version || "1.0", expiryDate: item.expiryDate || "", signed: item.signed || false }); setShowModal(true); };

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3 md:gap-4">
        <h3 className="max-[400px]:text-xl text-2xl font-black italic text-zinc-950 uppercase tracking-tighter">{t("category.documents")} <span className="text-red-600">({items.length})</span></h3>
        <motion.button whileTap={{ scale: 0.95 }} onClick={openNew} className="px-5 md:px-6 py-2.5 md:py-3 bg-red-600 text-white rounded-2xl font-black text-[10px] md:text-xs italic hover:bg-red-700 transition-all shadow-xl flex items-center gap-2">
          <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" /> {t("industry.documents.add")}
        </motion.button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {items.map(item => (
          <div key={item.id} className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-zinc-100 shadow-sm p-5 md:p-6 space-y-4 hover:shadow-lg hover:border-zinc-200 transition-all group">
            <div className="flex items-start justify-between gap-2 md:gap-3">
              <div className="min-w-0 flex-1">
                <h4 className="font-black italic text-zinc-950 text-sm md:text-base leading-tight truncate flex items-center gap-2">
                  <FileText className="w-4 h-4 text-zinc-400 shrink-0" /> {item.name}
                </h4>
                <span className="text-[9px] font-bold text-zinc-400 uppercase italic">{item.type}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <motion.a whileTap={{ scale: 0.9 }} href={item.fileUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 md:p-2 text-zinc-300 hover:text-green-500 transition-all"><ExternalLink className="w-3.5 h-3.5 md:w-4 md:h-4" /></motion.a>
                <QRButton url={`${typeof window !== "undefined" ? window.location.origin : ""}/s/${store?.slug || "store"}?item=documents|${item.id}`} label={item.name} />
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => openEdit(item)} className="p-1.5 md:p-2 text-zinc-300 hover:text-blue-500 transition-all"><Edit3 className="w-3.5 h-3.5 md:w-4 md:h-4" /></motion.button>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => deleteItem(item.id)} className="p-1.5 md:p-2 text-zinc-300 hover:text-rose-500 transition-all"><Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" /></motion.button>
              </div>
            </div>
            {item.desc && <p className="text-[11px] md:text-xs text-zinc-400 font-medium italic line-clamp-2">{item.desc}</p>}
            <div className="flex items-center gap-2 text-[8px] font-bold text-zinc-400 uppercase italic flex-wrap mt-1">
              {item.tags && <span>{t("industry.documents.tags_label")}: {item.tags}</span>}
              {item.version && <span>{t("industry.documents.version_label")}: v{item.version}</span>}
              {item.size > 0 && <span>{t("industry.documents.size_label")}: {item.size}KB</span>}
              {item.expiryDate && <span>{t("industry.documents.expiry_label")}: {item.expiryDate}</span>}
              {item.signed && <span className="text-emerald-600">{t("industry.documents.signed_label")}</span>}
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="col-span-full py-16 text-center italic font-black uppercase tracking-widest text-zinc-200">{t("industry.documents.empty")}</div>}
      </div>
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4" onClick={() => { setShowModal(false); setEditing(null); }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full max-w-md bg-white rounded-[2rem] md:rounded-[3rem] p-4 md:p-8 shadow-4xl relative" onClick={e => e.stopPropagation()}>
              <button onClick={() => { setShowModal(false); setEditing(null); }} className="absolute top-4 md:top-6 right-4 md:right-6 p-2 hover:bg-zinc-50 rounded-xl"><X className="w-4 h-4 md:w-5 md:h-5 text-zinc-400" /></button>
              <h3 className="text-lg md:text-2xl font-black italic text-zinc-950 mb-4 md:mb-6 uppercase tracking-tighter">{editing ? t("industry.documents.edit_title") : t("industry.documents.new_title")}</h3>
              <div className="space-y-3 md:space-y-4">
                <input type="text" placeholder={t("industry.documents.name_placeholder")} value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                <input type="text" placeholder={t("industry.documents.url_placeholder")} value={form.fileUrl} onChange={e => setForm({...form, fileUrl: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.documents.type_label")}</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm">
                    {TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <textarea placeholder={t("industry.documents.desc_placeholder")} value={form.desc} onChange={e => setForm({...form, desc: e.target.value})} rows={2} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm resize-none" />
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.documents.version_label")}</label>
                    <input type="text" placeholder="1.0" value={form.version} onChange={e => setForm({...form, version: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.documents.size_label")}</label>
                    <input type="number" placeholder="0" value={form.size} onChange={e => setForm({...form, size: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.documents.upload_date_label")}</label>
                    <input type="date" value={form.uploadDate} onChange={e => setForm({...form, uploadDate: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.documents.expiry_label")}</label>
                    <input type="date" value={form.expiryDate} onChange={e => setForm({...form, expiryDate: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                  </div>
                </div>
                <input type="text" placeholder={t("industry.documents.tags_placeholder")} value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.signed} onChange={e => setForm({...form, signed: e.target.checked})} className="w-4 h-4 rounded border-zinc-300 text-red-600 focus:ring-red-500" />
                  <span className="text-[9px] font-black text-zinc-400 uppercase italic tracking-widest">{t("industry.documents.signed_label")}</span>
                </label>
                <button onClick={addItem} disabled={!form.name || !form.fileUrl} className="w-full py-3 md:py-4 bg-red-600 text-white rounded-2xl font-black italic hover:bg-red-700 transition-all shadow-xl disabled:opacity-50">
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
