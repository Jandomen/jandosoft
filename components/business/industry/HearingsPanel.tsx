"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit3, X, Calendar, Gavel } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useToast } from "@/components/ui/Toast";
import type { IHearing } from "@/lib/models/Store";
import QRButton from "@/components/business/QRButton";

interface Props { storeId: string | number; onSaveStore?: (storeId: string | number, data: any) => void; store?: any; }

export default function HearingsPanel({ storeId, onSaveStore, store }: Props) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [items, setItems] = useState<IHearing[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<IHearing | null>(null);
  const [form, setForm] = useState({ caseNumber: "", date: "", court: "", judge: "", notes: "", time: "", room: "", hearingType: "", duration: "60", outcome: "" });

  useEffect(() => { if (store?.hearings) setItems(store.hearings); }, [store, store?.hearings]);

  const save = (data: IHearing[]) => { setItems(data); if (onSaveStore) Promise.resolve(onSaveStore(storeId, { hearings: data })); };

  const addItem = () => {
    if (!form.caseNumber || !form.date) return;
    if (editing) {
      save(items.map(i => i.id === editing.id ? { ...i, caseNumber: form.caseNumber, date: form.date, court: form.court, judge: form.judge, notes: form.notes, time: form.time, room: form.room, hearingType: form.hearingType, duration: Number(form.duration), outcome: form.outcome } : i));
    } else {
      save([...items, { id: Date.now(), caseNumber: form.caseNumber, date: form.date, court: form.court, judge: form.judge, notes: form.notes, time: form.time, room: form.room, hearingType: form.hearingType, duration: Number(form.duration), outcome: form.outcome }]);
    }
    setForm({ caseNumber: "", date: "", court: "", judge: "", notes: "", time: "", room: "", hearingType: "", duration: "60", outcome: "" });
    setShowModal(false); setEditing(null);
  };

  const deleteItem = (id: number) => save(items.filter(i => i.id !== id));
  const openNew = () => { setEditing(null); setForm({ caseNumber: "", date: "", court: "", judge: "", notes: "", time: "", room: "", hearingType: "", duration: "60", outcome: "" }); setShowModal(true); };
  const openEdit = (item: IHearing) => { setEditing(item); setForm({ caseNumber: item.caseNumber, date: item.date, court: item.court, judge: item.judge, notes: item.notes, time: item.time || "", room: item.room || "", hearingType: item.hearingType || "", duration: String(item.duration ?? "60"), outcome: item.outcome || "" }); setShowModal(true); };

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3 md:gap-4">
        <h3 className="max-[400px]:text-xl text-2xl font-black italic text-zinc-950 uppercase tracking-tighter">{t("category.hearings")} <span className="text-red-600">({items.length})</span></h3>
        <motion.button whileTap={{ scale: 0.95 }} onClick={openNew} className="px-5 md:px-6 py-2.5 md:py-3 bg-red-600 text-white rounded-2xl font-black text-[10px] md:text-xs italic hover:bg-red-700 transition-all shadow-xl flex items-center gap-2">
          <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" /> {t("industry.hearings.add")}
        </motion.button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {items.map(item => (
          <div key={item.id} className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-zinc-100 shadow-sm p-5 md:p-6 space-y-4 hover:shadow-lg hover:border-zinc-200 transition-all group">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h4 className="font-black italic text-zinc-950 text-sm md:text-base leading-tight truncate">{item.caseNumber}</h4>
                <p className="text-[11px] md:text-xs text-zinc-400 font-medium italic mt-1">{item.court}{item.judge ? ` — ${t("industry.hearings.judge_label")}: ${item.judge}` : ""}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <QRButton url={`${typeof window !== "undefined" ? window.location.origin : ""}/s/${store?.slug || "store"}?item=hearings|${item.id}`} label={item.caseNumber} />
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => openEdit(item)} className="p-1.5 md:p-2 text-zinc-300 hover:text-blue-500 transition-all"><Edit3 className="w-3.5 h-3.5 md:w-4 md:h-4" /></motion.button>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => deleteItem(item.id)} className="p-1.5 md:p-2 text-zinc-300 hover:text-rose-500 transition-all"><Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" /></motion.button>
              </div>
            </div>
            <div className="flex items-center gap-3 text-[8px] md:text-[9px] font-bold text-zinc-400 uppercase italic">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {item.date || "—"}</span>
              <span className="flex items-center gap-1"><Gavel className="w-3 h-3" /> {item.judge || "—"}</span>
            </div>
            <div className="flex items-center gap-2 text-[8px] font-bold text-zinc-400 uppercase italic flex-wrap mt-1">
              {item.time && <span>{t("industry.hearings.time_label")}: {item.time}</span>}
              {item.room && <span>{t("industry.hearings.room_label")}: {item.room}</span>}
              {item.hearingType && <span>{t("industry.hearings.type_label")}: {item.hearingType}</span>}
              {item.outcome && <span>{t("industry.hearings.outcome_label")}: {item.outcome}</span>}
            </div>
            {item.notes && <p className="text-[11px] md:text-xs text-zinc-400 font-medium italic line-clamp-2">{item.notes}</p>}
          </div>
        ))}
        {items.length === 0 && <div className="col-span-full py-16 text-center italic font-black uppercase tracking-widest text-zinc-200">{t("industry.hearings.empty")}</div>}
      </div>
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4" onClick={() => { setShowModal(false); setEditing(null); }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full max-w-md bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-4xl relative" onClick={e => e.stopPropagation()}>
              <button onClick={() => { setShowModal(false); setEditing(null); }} className="absolute top-4 md:top-6 right-4 md:right-6 p-2 hover:bg-zinc-50 rounded-xl"><X className="w-4 h-4 md:w-5 md:h-5 text-zinc-400" /></button>
              <h3 className="text-xl md:text-2xl font-black italic text-zinc-950 mb-4 md:mb-6 uppercase tracking-tighter">{editing ? t("industry.hearings.edit_title") : t("industry.hearings.new_title")}</h3>
              <div className="space-y-3 md:space-y-4">
                <input type="text" placeholder={t("industry.hearings.case_number_placeholder")} value={form.caseNumber} onChange={e => setForm({...form, caseNumber: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm" />
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.hearings.date_label")}</label>
                    <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm" />
                  </div>
                  <input type="text" placeholder={t("industry.hearings.court_placeholder")} value={form.court} onChange={e => setForm({...form, court: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm" />
                </div>
                <input type="text" placeholder={t("industry.hearings.judge_placeholder")} value={form.judge} onChange={e => setForm({...form, judge: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm" />
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.hearings.time_label")}</label>
                    <input type="time" value={form.time} onChange={e => setForm({...form, time: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.hearings.room_label")}</label>
                    <input type="text" placeholder={t("industry.hearings.room_placeholder")} value={form.room} onChange={e => setForm({...form, room: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.hearings.type_label")}</label>
                    <input type="text" placeholder={t("industry.hearings.type_placeholder")} value={form.hearingType} onChange={e => setForm({...form, hearingType: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.hearings.duration_label")}</label>
                    <input type="number" placeholder="60" value={form.duration} onChange={e => setForm({...form, duration: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm" />
                  </div>
                </div>
                <input type="text" placeholder={t("industry.hearings.outcome_placeholder")} value={form.outcome} onChange={e => setForm({...form, outcome: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm" />
                <textarea placeholder={t("industry.hearings.notes_placeholder")} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm resize-none" />
                <button onClick={addItem} disabled={!form.caseNumber || !form.date} className="w-full py-5 bg-red-600 text-white rounded-2xl font-black italic hover:bg-red-700 transition-all shadow-xl disabled:opacity-50">
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
