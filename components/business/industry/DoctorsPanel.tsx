"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit3, X, Mail, Phone, Stethoscope } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useToast } from "@/components/ui/Toast";
import type { IDoctor } from "@/lib/models/Store";
import QRButton from "@/components/business/QRButton";

interface Props { storeId: string | number; onSaveStore?: (storeId: string | number, data: any) => void; store?: any; }

export default function DoctorsPanel({ storeId, onSaveStore, store }: Props) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [items, setItems] = useState<IDoctor[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<IDoctor | null>(null);
  const [form, setForm] = useState({ name: "", specialty: "", phone: "", email: "", schedule: "", licenseNumber: "", department: "", bio: "", imageUrl: "", consultationFee: "", available: true });

  useEffect(() => { if (store?.doctors) setItems(store.doctors); }, [store, store?.doctors]);

  const save = (data: IDoctor[]) => { setItems(data); if (onSaveStore) Promise.resolve(onSaveStore(storeId, { doctors: data })); };

  const addItem = () => {
    if (!form.name) return;
    if (editing) {
      save(items.map(i => i.id === editing.id ? { ...i, name: form.name, specialty: form.specialty, phone: form.phone, email: form.email, schedule: form.schedule, licenseNumber: form.licenseNumber, department: form.department, bio: form.bio, imageUrl: form.imageUrl, consultationFee: Number(form.consultationFee), available: form.available } : i));
    } else {
      save([...items, { id: Date.now(), name: form.name, specialty: form.specialty, phone: form.phone, email: form.email, schedule: form.schedule, licenseNumber: form.licenseNumber, department: form.department, bio: form.bio, imageUrl: form.imageUrl, consultationFee: Number(form.consultationFee), available: form.available }]);
    }
    setForm({ name: "", specialty: "", phone: "", email: "", schedule: "", licenseNumber: "", department: "", bio: "", imageUrl: "", consultationFee: "", available: true });
    setShowModal(false); setEditing(null);
  };

  const deleteItem = (id: number) => save(items.filter(i => i.id !== id));
  const openNew = () => { setEditing(null); setForm({ name: "", specialty: "", phone: "", email: "", schedule: "", licenseNumber: "", department: "", bio: "", imageUrl: "", consultationFee: "", available: true }); setShowModal(true); };
  const openEdit = (item: IDoctor) => { setEditing(item); setForm({ name: item.name, specialty: item.specialty, phone: item.phone, email: item.email, schedule: item.schedule, licenseNumber: item.licenseNumber || "", department: item.department || "", bio: item.bio || "", imageUrl: item.imageUrl || "", consultationFee: String(item.consultationFee || ""), available: item.available ?? true }); setShowModal(true); };

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3 md:gap-4">
        <h3 className="max-[400px]:text-xl text-2xl font-black italic text-zinc-950 uppercase tracking-tighter">{t("category.doctors")} <span className="text-red-600">({items.length})</span></h3>
        <motion.button whileTap={{ scale: 0.95 }} onClick={openNew} className="px-5 md:px-6 py-2.5 md:py-3 bg-red-600 text-white rounded-2xl font-black text-[10px] md:text-xs italic hover:bg-red-700 transition-all shadow-xl flex items-center gap-2">
          <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" /> {t("industry.doctors.add")}
        </motion.button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {items.map(item => (
          <div key={item.id} className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-zinc-100 shadow-sm p-5 md:p-6 space-y-4 hover:shadow-lg hover:border-zinc-200 transition-all group">
            <div className="flex items-start justify-between gap-2 md:gap-3">
              <div className="min-w-0 flex-1">
                <h4 className="font-black italic text-zinc-950 text-sm md:text-base leading-tight truncate">{item.name}</h4>
                <span className="text-[9px] font-bold text-zinc-400 uppercase italic">{item.specialty || "—"}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <QRButton url={`${typeof window !== "undefined" ? window.location.origin : ""}/s/${store?.slug || "store"}?item=doctors|${item.id}`} label={item.name} />
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => openEdit(item)} className="p-1.5 md:p-2 text-zinc-300 hover:text-blue-500 transition-all"><Edit3 className="w-3.5 h-3.5 md:w-4 md:h-4" /></motion.button>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => deleteItem(item.id)} className="p-1.5 md:p-2 text-zinc-300 hover:text-rose-500 transition-all"><Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" /></motion.button>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 text-[8px] md:text-[9px] font-bold text-zinc-400 uppercase italic">
              {item.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {item.email}</span>}
              {item.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {item.phone}</span>}
              <span className="flex items-center gap-1"><Stethoscope className="w-3 h-3" /> {item.specialty || "—"}</span>
            </div>
            {item.schedule && <p className="text-[11px] md:text-xs text-zinc-400 font-medium italic">{item.schedule}</p>}
            <div className="flex items-center gap-2 text-[8px] font-bold text-zinc-400 uppercase italic flex-wrap mt-1">
              {item.licenseNumber && <span>{t("industry.doctors.license_label")}: {item.licenseNumber}</span>}
              {item.department && <span>{t("industry.doctors.department_label")}: {item.department}</span>}
              {item.consultationFee > 0 && <span>{t("industry.doctors.fee_label")}: ${item.consultationFee}</span>}
              <span className={item.available ? "text-emerald-600" : "text-red-500"}>{item.available ? t("industry.doctors.available_yes") : t("industry.doctors.available_no")}</span>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="col-span-full py-16 text-center italic font-black uppercase tracking-widest text-zinc-200">{t("industry.doctors.empty")}</div>}
      </div>
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4" onClick={() => { setShowModal(false); setEditing(null); }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full max-w-md bg-white rounded-[2rem] md:rounded-[3rem] p-4 md:p-8 shadow-4xl relative" onClick={e => e.stopPropagation()}>
              <button onClick={() => { setShowModal(false); setEditing(null); }} className="absolute top-4 md:top-6 right-4 md:right-6 p-2 hover:bg-zinc-50 rounded-xl"><X className="w-4 h-4 md:w-5 md:h-5 text-zinc-400" /></button>
              <h3 className="text-lg md:text-2xl font-black italic text-zinc-950 mb-4 md:mb-6 uppercase tracking-tighter">{editing ? t("industry.doctors.edit_title") : t("industry.doctors.new_title")}</h3>
              <div className="space-y-3 md:space-y-4">
                <input type="text" placeholder={t("industry.doctors.name_placeholder")} value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  <input type="text" placeholder={t("industry.doctors.specialty_placeholder")} value={form.specialty} onChange={e => setForm({...form, specialty: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                  <input type="text" placeholder={t("industry.doctors.phone_placeholder")} value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                </div>
                <input type="email" placeholder={t("industry.doctors.email_placeholder")} value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                <input type="text" placeholder={t("industry.doctors.schedule_placeholder")} value={form.schedule} onChange={e => setForm({...form, schedule: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.doctors.license_label")}</label>
                    <input type="text" placeholder={t("industry.doctors.license_placeholder")} value={form.licenseNumber} onChange={e => setForm({...form, licenseNumber: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.doctors.department_label")}</label>
                    <input type="text" placeholder={t("industry.doctors.department_placeholder")} value={form.department} onChange={e => setForm({...form, department: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.doctors.fee_label")}</label>
                    <input type="number" placeholder="0" value={form.consultationFee} onChange={e => setForm({...form, consultationFee: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                  </div>
                  <div className="space-y-1.5 flex items-end pb-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.available} onChange={e => setForm({...form, available: e.target.checked})} className="w-4 h-4 rounded border-zinc-300 text-red-600 focus:ring-red-500" />
                      <span className="text-[9px] font-black text-zinc-400 uppercase italic tracking-widest">{t("industry.doctors.available_label")}</span>
                    </label>
                  </div>
                </div>
                <textarea placeholder={t("industry.doctors.bio_placeholder")} value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} rows={3} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm resize-none" />
                <input type="text" placeholder={t("industry.doctors.image_url_placeholder")} value={form.imageUrl} onChange={e => setForm({...form, imageUrl: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
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
