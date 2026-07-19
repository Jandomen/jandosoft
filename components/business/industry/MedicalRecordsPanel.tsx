"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit3, X, Calendar, Stethoscope } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useToast } from "@/components/ui/Toast";
import type { IMedicalRecord } from "@/lib/models/Store";
import QRButton from "@/components/business/QRButton";

interface Props { storeId: string | number; onSaveStore?: (storeId: string | number, data: any) => void; store?: any; }

export default function MedicalRecordsPanel({ storeId, onSaveStore, store }: Props) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [items, setItems] = useState<IMedicalRecord[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<IMedicalRecord | null>(null);
  const [form, setForm] = useState({ patientName: "", date: "", diagnosis: "", doctor: "", notes: "", visitType: "general", symptoms: "", treatment: "", followUpDate: "", attachments: "" });

  useEffect(() => { if (store?.medicalRecords) setItems(store.medicalRecords); }, [store, store?.medicalRecords]);

  const save = (data: IMedicalRecord[]) => { setItems(data); if (onSaveStore) Promise.resolve(onSaveStore(storeId, { medicalRecords: data })); };

  const addItem = () => {
    if (!form.patientName || !form.diagnosis) return;
    if (editing) {
      save(items.map(i => i.id === editing.id ? { ...i, patientName: form.patientName, date: form.date, diagnosis: form.diagnosis, doctor: form.doctor, notes: form.notes, visitType: form.visitType, symptoms: form.symptoms, treatment: form.treatment, followUpDate: form.followUpDate, attachments: form.attachments } : i));
    } else {
      save([...items, { id: Date.now(), patientName: form.patientName, date: form.date, diagnosis: form.diagnosis, doctor: form.doctor, notes: form.notes, visitType: form.visitType, symptoms: form.symptoms, treatment: form.treatment, followUpDate: form.followUpDate, attachments: form.attachments }]);
    }
    setForm({ patientName: "", date: "", diagnosis: "", doctor: "", notes: "", visitType: "general", symptoms: "", treatment: "", followUpDate: "", attachments: "" });
    setShowModal(false); setEditing(null);
  };

  const deleteItem = (id: number) => save(items.filter(i => i.id !== id));
  const openNew = () => { setEditing(null); setForm({ patientName: "", date: "", diagnosis: "", doctor: "", notes: "", visitType: "general", symptoms: "", treatment: "", followUpDate: "", attachments: "" }); setShowModal(true); };
  const openEdit = (item: IMedicalRecord) => { setEditing(item); setForm({ patientName: item.patientName, date: item.date, diagnosis: item.diagnosis, doctor: item.doctor, notes: item.notes, visitType: item.visitType || "general", symptoms: item.symptoms || "", treatment: item.treatment || "", followUpDate: item.followUpDate || "", attachments: item.attachments || "" }); setShowModal(true); };

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3 md:gap-4">
        <h3 className="max-[400px]:text-xl text-2xl font-black italic text-zinc-950 uppercase tracking-tighter">{t("category.medical_records")} <span className="text-red-600">({items.length})</span></h3>
        <motion.button whileTap={{ scale: 0.95 }} onClick={openNew} className="px-5 md:px-6 py-2.5 md:py-3 bg-red-600 text-white rounded-2xl font-black text-[10px] md:text-xs italic hover:bg-red-700 transition-all shadow-xl flex items-center gap-2">
          <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" /> {t("industry.medical_records.add")}
        </motion.button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {items.map(item => (
          <div key={item.id} className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-zinc-100 shadow-sm p-5 md:p-6 space-y-4 hover:shadow-lg hover:border-zinc-200 transition-all group">
            <div className="flex items-start justify-between gap-2 md:gap-3">
              <div className="min-w-0 flex-1">
                <h4 className="font-black italic text-zinc-950 text-sm md:text-base leading-tight truncate">{item.patientName}</h4>
                <span className="text-[9px] font-bold text-zinc-400 uppercase italic">{item.doctor || "—"}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <QRButton url={`${typeof window !== "undefined" ? window.location.origin : ""}/s/${store?.slug || "store"}?item=medicalrecords|${item.id}`} label={item.patientName} />
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => openEdit(item)} className="p-1.5 md:p-2 text-zinc-300 hover:text-blue-500 transition-all"><Edit3 className="w-3.5 h-3.5 md:w-4 md:h-4" /></motion.button>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => deleteItem(item.id)} className="p-1.5 md:p-2 text-zinc-300 hover:text-rose-500 transition-all"><Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" /></motion.button>
              </div>
            </div>
            <p className="text-[11px] md:text-xs font-bold text-zinc-700 italic"><span className="text-zinc-400">{t("industry.medical_records.diagnosis_label")}</span> {item.diagnosis}</p>
            <div className="flex items-center gap-2 text-[8px] font-bold text-zinc-400 uppercase italic flex-wrap mt-1">
              {item.visitType && <span>{t("industry.medical_records.visit_type_label")}: {t("industry.medical_records.vtype_" + item.visitType)}</span>}
              {item.treatment && <span>{t("industry.medical_records.treatment_label")}: {item.treatment}</span>}
              {item.followUpDate && <span>{t("industry.medical_records.followup_label")}: {item.followUpDate}</span>}
            </div>
            <div className="flex items-center gap-3 text-[8px] md:text-[9px] font-bold text-zinc-400 uppercase italic">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {item.date || "—"}</span>
              <span className="flex items-center gap-1"><Stethoscope className="w-3 h-3" /> {item.doctor || "—"}</span>
            </div>
            {item.notes && <p className="text-[11px] md:text-xs text-zinc-400 font-medium italic line-clamp-2">{item.notes}</p>}
          </div>
        ))}
        {items.length === 0 && <div className="col-span-full py-16 text-center italic font-black uppercase tracking-widest text-zinc-200">{t("industry.medical_records.empty")}</div>}
      </div>
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4" onClick={() => { setShowModal(false); setEditing(null); }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full max-w-md bg-white rounded-[2rem] md:rounded-[3rem] p-4 md:p-8 shadow-4xl relative" onClick={e => e.stopPropagation()}>
              <button onClick={() => { setShowModal(false); setEditing(null); }} className="absolute top-4 md:top-6 right-4 md:right-6 p-2 hover:bg-zinc-50 rounded-xl"><X className="w-4 h-4 md:w-5 md:h-5 text-zinc-400" /></button>
              <h3 className="text-lg md:text-2xl font-black italic text-zinc-950 mb-4 md:mb-6 uppercase tracking-tighter">{editing ? t("industry.medical_records.edit_title") : t("industry.medical_records.new_title")}</h3>
              <div className="space-y-3 md:space-y-4">
                <input type="text" placeholder={t("industry.medical_records.patient_name_placeholder")} value={form.patientName} onChange={e => setForm({...form, patientName: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.medical_records.date_label")}</label>
                    <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                  </div>
                  <input type="text" placeholder={t("industry.medical_records.doctor_placeholder")} value={form.doctor} onChange={e => setForm({...form, doctor: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.medical_records.visit_type_label")}</label>
                  <select value={form.visitType} onChange={e => setForm({...form, visitType: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm">
                    <option value="general">{t("industry.medical_records.vtype_general")}</option>
                    <option value="emergency">{t("industry.medical_records.vtype_emergency")}</option>
                    <option value="followup">{t("industry.medical_records.vtype_followup")}</option>
                    <option value="specialist">{t("industry.medical_records.vtype_specialist")}</option>
                    <option value="checkup">{t("industry.medical_records.vtype_checkup")}</option>
                  </select>
                </div>
                <textarea placeholder={t("industry.medical_records.symptoms_placeholder")} value={form.symptoms} onChange={e => setForm({...form, symptoms: e.target.value})} rows={2} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm resize-none" />
                <textarea placeholder={t("industry.medical_records.treatment_placeholder")} value={form.treatment} onChange={e => setForm({...form, treatment: e.target.value})} rows={2} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm resize-none" />
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.medical_records.followup_label")}</label>
                    <input type="date" value={form.followUpDate} onChange={e => setForm({...form, followUpDate: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.medical_records.attachments_label")}</label>
                    <input type="text" placeholder={t("industry.medical_records.attachments_placeholder")} value={form.attachments} onChange={e => setForm({...form, attachments: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                  </div>
                </div>
                <textarea placeholder={t("industry.medical_records.diagnosis_placeholder")} value={form.diagnosis} onChange={e => setForm({...form, diagnosis: e.target.value})} rows={2} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm resize-none" />
                <textarea placeholder={t("industry.medical_records.notes_placeholder")} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm resize-none" />
                <button onClick={addItem} disabled={!form.patientName || !form.diagnosis} className="w-full py-3 md:py-4 bg-red-600 text-white rounded-2xl font-black italic hover:bg-red-700 transition-all shadow-xl disabled:opacity-50">
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
