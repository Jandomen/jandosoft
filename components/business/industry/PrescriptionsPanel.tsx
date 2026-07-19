"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit3, X, Calendar, Pill } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useToast } from "@/components/ui/Toast";
import type { IPrescription } from "@/lib/models/Store";
import QRButton from "@/components/business/QRButton";

interface Props { storeId: string | number; onSaveStore?: (storeId: string | number, data: any) => void; store?: any; }

export default function PrescriptionsPanel({ storeId, onSaveStore, store }: Props) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [items, setItems] = useState<IPrescription[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<IPrescription | null>(null);
  const [form, setForm] = useState({ patientName: "", medication: "", dosage: "", frequency: "", startDate: "", endDate: "", prescribedBy: "", pharmacy: "", refills: "0", instructions: "", strength: "" });

  useEffect(() => { if (store?.prescriptions) setItems(store.prescriptions); }, [store, store?.prescriptions]);

  const save = (data: IPrescription[]) => { setItems(data); if (onSaveStore) Promise.resolve(onSaveStore(storeId, { prescriptions: data })); };

  const addItem = () => {
    if (!form.patientName || !form.medication) return;
    if (editing) {
      save(items.map(i => i.id === editing.id ? { ...i, patientName: form.patientName, medication: form.medication, dosage: form.dosage, frequency: form.frequency, startDate: form.startDate, endDate: form.endDate, prescribedBy: form.prescribedBy, pharmacy: form.pharmacy, refills: Number(form.refills), instructions: form.instructions, strength: form.strength } : i));
    } else {
      save([...items, { id: Date.now(), patientName: form.patientName, medication: form.medication, dosage: form.dosage, frequency: form.frequency, startDate: form.startDate, endDate: form.endDate, prescribedBy: form.prescribedBy, pharmacy: form.pharmacy, refills: Number(form.refills), instructions: form.instructions, strength: form.strength }]);
    }
    setForm({ patientName: "", medication: "", dosage: "", frequency: "", startDate: "", endDate: "", prescribedBy: "", pharmacy: "", refills: "0", instructions: "", strength: "" });
    setShowModal(false); setEditing(null);
  };

  const deleteItem = (id: number) => save(items.filter(i => i.id !== id));
  const openNew = () => { setEditing(null); setForm({ patientName: "", medication: "", dosage: "", frequency: "", startDate: "", endDate: "", prescribedBy: "", pharmacy: "", refills: "0", instructions: "", strength: "" }); setShowModal(true); };
  const openEdit = (item: IPrescription) => { setEditing(item); setForm({ patientName: item.patientName, medication: item.medication, dosage: item.dosage, frequency: item.frequency, startDate: item.startDate, endDate: item.endDate, prescribedBy: item.prescribedBy || "", pharmacy: item.pharmacy || "", refills: String(item.refills || "0"), instructions: item.instructions || "", strength: item.strength || "" }); setShowModal(true); };

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3 md:gap-4">
        <h3 className="max-[400px]:text-xl text-2xl font-black italic text-zinc-950 uppercase tracking-tighter">{t("category.prescriptions")} <span className="text-red-600">({items.length})</span></h3>
        <motion.button whileTap={{ scale: 0.95 }} onClick={openNew} className="px-5 md:px-6 py-2.5 md:py-3 bg-red-600 text-white rounded-2xl font-black text-[10px] md:text-xs italic hover:bg-red-700 transition-all shadow-xl flex items-center gap-2">
          <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" /> {t("industry.prescriptions.add")}
        </motion.button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {items.map(item => (
          <div key={item.id} className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-zinc-100 shadow-sm p-5 md:p-6 space-y-4 hover:shadow-lg hover:border-zinc-200 transition-all group">
            <div className="flex items-start justify-between gap-2 md:gap-3">
              <div className="min-w-0 flex-1">
                <h4 className="font-black italic text-zinc-950 text-sm md:text-base leading-tight truncate">{item.medication}</h4>
                <p className="text-[11px] md:text-xs text-zinc-400 font-medium italic mt-1">{t("industry.prescriptions.patient_label")}: {item.patientName}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <QRButton url={`${typeof window !== "undefined" ? window.location.origin : ""}/s/${store?.slug || "store"}?item=prescriptions|${item.id}`} label={item.medication} />
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => openEdit(item)} className="p-1.5 md:p-2 text-zinc-300 hover:text-blue-500 transition-all"><Edit3 className="w-3.5 h-3.5 md:w-4 md:h-4" /></motion.button>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => deleteItem(item.id)} className="p-1.5 md:p-2 text-zinc-300 hover:text-rose-500 transition-all"><Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" /></motion.button>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 text-[8px] md:text-[9px] font-bold text-zinc-400 uppercase italic">
              <span>{t("industry.prescriptions.dosage_label")}: {item.dosage || "—"}</span>
              <span>{t("industry.prescriptions.frequency_label")}: {item.frequency || "—"}</span>
            </div>
            <div className="flex items-center gap-2 text-[8px] font-bold text-zinc-400 uppercase italic flex-wrap mt-1">
              {item.prescribedBy && <span>{t("industry.prescriptions.prescribed_by_label")}: {item.prescribedBy}</span>}
              {item.strength && <span>{t("industry.prescriptions.strength_label")}: {item.strength}</span>}
              {item.refills > 0 && <span>{t("industry.prescriptions.refills_label")}: {item.refills}</span>}
              {item.pharmacy && <span>{t("industry.prescriptions.pharmacy_label")}: {item.pharmacy}</span>}
            </div>
            <div className="flex items-center gap-3 text-[8px] md:text-[9px] font-bold text-zinc-400 uppercase italic">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {item.startDate || "—"} → {item.endDate || "—"}</span>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="col-span-full py-16 text-center italic font-black uppercase tracking-widest text-zinc-200">{t("industry.prescriptions.empty")}</div>}
      </div>
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4" onClick={() => { setShowModal(false); setEditing(null); }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full max-w-md bg-white rounded-[2rem] md:rounded-[3rem] p-4 md:p-8 shadow-4xl relative" onClick={e => e.stopPropagation()}>
              <button onClick={() => { setShowModal(false); setEditing(null); }} className="absolute top-4 md:top-6 right-4 md:right-6 p-2 hover:bg-zinc-50 rounded-xl"><X className="w-4 h-4 md:w-5 md:h-5 text-zinc-400" /></button>
              <h3 className="text-lg md:text-2xl font-black italic text-zinc-950 mb-4 md:mb-6 uppercase tracking-tighter">{editing ? t("industry.prescriptions.edit_title") : t("industry.prescriptions.new_title")}</h3>
              <div className="space-y-3 md:space-y-4">
                <input type="text" placeholder={t("industry.prescriptions.patient_name_placeholder")} value={form.patientName} onChange={e => setForm({...form, patientName: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                <input type="text" placeholder={t("industry.prescriptions.medication_placeholder")} value={form.medication} onChange={e => setForm({...form, medication: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  <input type="text" placeholder={t("industry.prescriptions.dosage_placeholder")} value={form.dosage} onChange={e => setForm({...form, dosage: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                  <input type="text" placeholder={t("industry.prescriptions.frequency_placeholder")} value={form.frequency} onChange={e => setForm({...form, frequency: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.prescriptions.start_date_label")}</label>
                    <input type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.prescriptions.end_date_label")}</label>
                    <input type="date" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.prescriptions.strength_label")}</label>
                    <input type="text" placeholder="500mg" value={form.strength} onChange={e => setForm({...form, strength: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.prescriptions.refills_label")}</label>
                    <input type="number" placeholder="0" value={form.refills} onChange={e => setForm({...form, refills: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                  </div>
                </div>
                <input type="text" placeholder={t("industry.prescriptions.prescribed_by_placeholder")} value={form.prescribedBy} onChange={e => setForm({...form, prescribedBy: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                <input type="text" placeholder={t("industry.prescriptions.pharmacy_placeholder")} value={form.pharmacy} onChange={e => setForm({...form, pharmacy: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                <textarea placeholder={t("industry.prescriptions.instructions_placeholder")} value={form.instructions} onChange={e => setForm({...form, instructions: e.target.value})} rows={2} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm resize-none" />
                <button onClick={addItem} disabled={!form.patientName || !form.medication} className="w-full py-3 md:py-4 bg-red-600 text-white rounded-2xl font-black italic hover:bg-red-700 transition-all shadow-xl disabled:opacity-50">
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
