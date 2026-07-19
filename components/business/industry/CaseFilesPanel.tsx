"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit3, X, FolderOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useToast } from "@/components/ui/Toast";
import type { ICaseFile } from "@/lib/models/Store";
import QRButton from "@/components/business/QRButton";

interface Props { storeId: string | number; onSaveStore?: (storeId: string | number, data: any) => void; store?: any; }

export default function CaseFilesPanel({ storeId, onSaveStore, store }: Props) {
  const { t } = useLanguage();
  const STATUS_LIST = [
    { value: "active", label: t("industry.case_files.status_active") },
    { value: "closed", label: t("industry.case_files.status_closed") },
    { value: "pending", label: t("industry.case_files.status_pending") },
    { value: "appeal", label: t("industry.case_files.status_appeal") },
  ];
  const { showToast } = useToast();
  const [items, setItems] = useState<ICaseFile[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ICaseFile | null>(null);
  const [form, setForm] = useState({ caseNumber: "", clientName: "", type: "", status: "active", description: "", court: "", judge: "", filingDate: "", opposingCounsel: "", outcome: "" });

  useEffect(() => { if (store?.caseFiles) setItems(store.caseFiles); }, [store, store?.caseFiles]);

  const save = (data: ICaseFile[]) => { setItems(data); if (onSaveStore) Promise.resolve(onSaveStore(storeId, { caseFiles: data })); };

  const addItem = () => {
    if (!form.caseNumber) return;
    if (editing) {
      save(items.map(i => i.id === editing.id ? { ...i, caseNumber: form.caseNumber, clientName: form.clientName, type: form.type, status: form.status, description: form.description, court: form.court, judge: form.judge, filingDate: form.filingDate, opposingCounsel: form.opposingCounsel, outcome: form.outcome } : i));
    } else {
      save([...items, { id: Date.now(), caseNumber: form.caseNumber, clientName: form.clientName, type: form.type, status: form.status, description: form.description, court: form.court, judge: form.judge, filingDate: form.filingDate, opposingCounsel: form.opposingCounsel, outcome: form.outcome }]);
    }
    setForm({ caseNumber: "", clientName: "", type: "", status: "active", description: "", court: "", judge: "", filingDate: "", opposingCounsel: "", outcome: "" });
    setShowModal(false); setEditing(null);
  };

  const deleteItem = (id: number) => save(items.filter(i => i.id !== id));
  const openNew = () => { setEditing(null); setForm({ caseNumber: "", clientName: "", type: "", status: "active", description: "", court: "", judge: "", filingDate: "", opposingCounsel: "", outcome: "" }); setShowModal(true); };
  const openEdit = (item: ICaseFile) => { setEditing(item); setForm({ caseNumber: item.caseNumber, clientName: item.clientName, type: item.type, status: item.status, description: item.description, court: item.court || "", judge: item.judge || "", filingDate: item.filingDate || "", opposingCounsel: item.opposingCounsel || "", outcome: item.outcome || "" }); setShowModal(true); };

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3 md:gap-4">
        <h3 className="max-[400px]:text-xl text-2xl font-black italic text-zinc-950 uppercase tracking-tighter">{t("category.case_files")} <span className="text-red-600">({items.length})</span></h3>
        <motion.button whileTap={{ scale: 0.95 }} onClick={openNew} className="px-5 md:px-6 py-2.5 md:py-3 bg-red-600 text-white rounded-2xl font-black text-[10px] md:text-xs italic hover:bg-red-700 transition-all shadow-xl flex items-center gap-2">
          <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" /> {t("industry.case_files.add")}
        </motion.button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {items.map(item => (
          <div key={item.id} className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-zinc-100 shadow-sm p-5 md:p-6 space-y-4 hover:shadow-lg hover:border-zinc-200 transition-all group">
            <div className="flex items-start justify-between gap-2 md:gap-3">
              <div className="min-w-0 flex-1">
                <h4 className="font-black italic text-zinc-950 text-sm md:text-base leading-tight truncate">{item.caseNumber}</h4>
                <p className="text-[11px] md:text-xs text-zinc-400 font-medium italic mt-1">{item.clientName}{item.type ? ` — ${item.type}` : ""}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black italic px-2 py-1 rounded-lg ${item.status === "active" ? "bg-green-100 text-green-700" : item.status === "closed" ? "bg-zinc-100 text-zinc-500" : "bg-yellow-100 text-yellow-700"}`}>{t("industry.case_files.status_" + item.status) || item.status}</span>
                <div className="flex items-center gap-1">
                  <QRButton url={`${typeof window !== "undefined" ? window.location.origin : ""}/s/${store?.slug || "store"}?item=casefiles|${item.id}`} label={item.caseNumber} />
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => openEdit(item)} className="p-1.5 md:p-2 text-zinc-300 hover:text-blue-500 transition-all"><Edit3 className="w-3.5 h-3.5 md:w-4 md:h-4" /></motion.button>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => deleteItem(item.id)} className="p-1.5 md:p-2 text-zinc-300 hover:text-rose-500 transition-all"><Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" /></motion.button>
                </div>
              </div>
            </div>
            {item.description && <p className="text-[11px] md:text-xs text-zinc-400 font-medium italic line-clamp-2">{item.description}</p>}
            <div className="flex items-center gap-2 text-[8px] font-bold text-zinc-400 uppercase italic flex-wrap mt-1">
              {item.court && <span>{t("industry.case_files.court_label")}: {item.court}</span>}
              {item.judge && <span>{t("industry.case_files.judge_label")}: {item.judge}</span>}
              {item.opposingCounsel && <span>{t("industry.case_files.opposing_label")}: {item.opposingCounsel}</span>}
              {item.outcome && <span>{t("industry.case_files.outcome_label")}: {item.outcome}</span>}
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="col-span-full py-16 text-center italic font-black uppercase tracking-widest text-zinc-200">{t("industry.case_files.empty")}</div>}
      </div>
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4" onClick={() => { setShowModal(false); setEditing(null); }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full max-w-md bg-white rounded-[2rem] md:rounded-[3rem] p-4 md:p-8 shadow-4xl relative" onClick={e => e.stopPropagation()}>
              <button onClick={() => { setShowModal(false); setEditing(null); }} className="absolute top-4 md:top-6 right-4 md:right-6 p-2 hover:bg-zinc-50 rounded-xl"><X className="w-4 h-4 md:w-5 md:h-5 text-zinc-400" /></button>
              <h3 className="text-lg md:text-2xl font-black italic text-zinc-950 mb-4 md:mb-6 uppercase tracking-tighter">{editing ? t("industry.case_files.edit_title") : t("industry.case_files.new_title")}</h3>
              <div className="space-y-3 md:space-y-4">
                <input type="text" placeholder={t("industry.case_files.case_number_placeholder")} value={form.caseNumber} onChange={e => setForm({...form, caseNumber: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  <input type="text" placeholder={t("industry.case_files.client_name_placeholder")} value={form.clientName} onChange={e => setForm({...form, clientName: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                  <input type="text" placeholder={t("industry.case_files.type_placeholder")} value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.case_files.status_label")}</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm">
                    {STATUS_LIST.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <textarea placeholder={t("industry.case_files.desc_placeholder")} value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm resize-none" />
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.case_files.court_label")}</label>
                    <input type="text" placeholder={t("industry.case_files.court_placeholder")} value={form.court} onChange={e => setForm({...form, court: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.case_files.judge_label")}</label>
                    <input type="text" placeholder={t("industry.case_files.judge_placeholder")} value={form.judge} onChange={e => setForm({...form, judge: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.case_files.filing_label")}</label>
                    <input type="date" value={form.filingDate} onChange={e => setForm({...form, filingDate: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.case_files.outcome_label")}</label>
                    <input type="text" placeholder={t("industry.case_files.outcome_placeholder")} value={form.outcome} onChange={e => setForm({...form, outcome: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                  </div>
                </div>
                <input type="text" placeholder={t("industry.case_files.opposing_placeholder")} value={form.opposingCounsel} onChange={e => setForm({...form, opposingCounsel: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                <button onClick={addItem} disabled={!form.caseNumber} className="w-full py-3 md:py-4 bg-red-600 text-white rounded-2xl font-black italic hover:bg-red-700 transition-all shadow-xl disabled:opacity-50">
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
