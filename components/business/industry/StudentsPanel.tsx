"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit3, X, Mail, Phone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useToast } from "@/components/ui/Toast";
import type { IStudent } from "@/lib/models/Store";
import QRButton from "@/components/business/QRButton";

interface Props { storeId: string | number; onSaveStore?: (storeId: string | number, data: any) => void; store?: any; }

export default function StudentsPanel({ storeId, onSaveStore, store }: Props) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [items, setItems] = useState<IStudent[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<IStudent | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", grade: "", parentName: "", address: "", birthDate: "", enrollmentDate: "", emergencyContact: "", notes: "", photo: "" });

  useEffect(() => { if (store?.students) setItems(store.students); }, [store, store?.students]);

  const save = (data: IStudent[]) => { setItems(data); if (onSaveStore) Promise.resolve(onSaveStore(storeId, { students: data })); };

  const addItem = () => {
    if (!form.name) return;
    if (editing) {
      save(items.map(i => i.id === editing.id ? { ...i, name: form.name, email: form.email, phone: form.phone, grade: form.grade, parentName: form.parentName, address: form.address, birthDate: form.birthDate, enrollmentDate: form.enrollmentDate, emergencyContact: form.emergencyContact, notes: form.notes, photo: form.photo } : i));
    } else {
      save([...items, { id: Date.now(), name: form.name, email: form.email, phone: form.phone, grade: form.grade, parentName: form.parentName, address: form.address, birthDate: form.birthDate, enrollmentDate: form.enrollmentDate, emergencyContact: form.emergencyContact, notes: form.notes, photo: form.photo }]);
    }
    setForm({ name: "", email: "", phone: "", grade: "", parentName: "", address: "", birthDate: "", enrollmentDate: "", emergencyContact: "", notes: "", photo: "" });
    setShowModal(false); setEditing(null);
  };

  const deleteItem = (id: number) => save(items.filter(i => i.id !== id));
  const openNew = () => { setEditing(null); setForm({ name: "", email: "", phone: "", grade: "", parentName: "", address: "", birthDate: "", enrollmentDate: "", emergencyContact: "", notes: "", photo: "" }); setShowModal(true); };
  const openEdit = (item: IStudent) => { setEditing(item); setForm({ name: item.name, email: item.email, phone: item.phone, grade: item.grade, parentName: item.parentName, address: item.address || "", birthDate: item.birthDate || "", enrollmentDate: item.enrollmentDate || "", emergencyContact: item.emergencyContact || "", notes: item.notes || "", photo: item.photo || "" }); setShowModal(true); };

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3 md:gap-4">
        <h3 className="max-[400px]:text-xl text-2xl font-black italic text-zinc-950 uppercase tracking-tighter">{t("category.students")} <span className="text-red-600">({items.length})</span></h3>
        <motion.button whileTap={{ scale: 0.95 }} onClick={openNew} className="px-5 md:px-6 py-2.5 md:py-3 bg-red-600 text-white rounded-2xl font-black text-[10px] md:text-xs italic hover:bg-red-700 transition-all shadow-xl flex items-center gap-2">
          <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" /> {t("industry.students.add")}
        </motion.button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {items.map(item => (
          <div key={item.id} className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-zinc-100 shadow-sm p-5 md:p-6 space-y-4 hover:shadow-lg hover:border-zinc-200 transition-all group">
            <div className="flex items-start justify-between gap-2 md:gap-3">
              <div className="min-w-0 flex-1">
                <h4 className="font-black italic text-zinc-950 text-sm md:text-base leading-tight truncate">{item.name}</h4>
                <span className="text-[9px] font-bold text-zinc-400 uppercase italic">{t("industry.students.grade_label")}: {item.grade || "—"}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <QRButton url={`${typeof window !== "undefined" ? window.location.origin : ""}/s/${store?.slug || "store"}?item=students|${item.id}`} label={item.name} />
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => openEdit(item)} className="p-1.5 md:p-2 text-zinc-300 hover:text-blue-500 transition-all"><Edit3 className="w-3.5 h-3.5 md:w-4 md:h-4" /></motion.button>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => deleteItem(item.id)} className="p-1.5 md:p-2 text-zinc-300 hover:text-rose-500 transition-all"><Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" /></motion.button>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 text-[8px] md:text-[9px] font-bold text-zinc-400 uppercase italic">
              {item.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {item.email}</span>}
              {item.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {item.phone}</span>}
              {item.parentName && <span>{t("industry.students.parent_label")}: {item.parentName}</span>}
            </div>
            {item.address && <p className="text-[10px] text-zinc-400 font-medium italic">{t("industry.students.address_label")}: {item.address}</p>}
            <div className="flex items-center gap-2 text-[8px] font-bold text-zinc-400 uppercase italic flex-wrap">
              {item.enrollmentDate && <span>{t("industry.students.enrollment_label")}: {item.enrollmentDate}</span>}
              {item.birthDate && <span>{t("industry.students.birth_label")}: {item.birthDate}</span>}
              {item.emergencyContact && <span>{t("industry.students.emergency_label")}: {item.emergencyContact}</span>}
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="col-span-full py-16 text-center italic font-black uppercase tracking-widest text-zinc-200">{t("industry.students.empty")}</div>}
      </div>
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4" onClick={() => { setShowModal(false); setEditing(null); }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full max-w-md bg-white rounded-[2rem] md:rounded-[3rem] p-4 md:p-8 shadow-4xl relative" onClick={e => e.stopPropagation()}>
              <button onClick={() => { setShowModal(false); setEditing(null); }} className="absolute top-4 md:top-6 right-4 md:right-6 p-2 hover:bg-zinc-50 rounded-xl"><X className="w-4 h-4 md:w-5 md:h-5 text-zinc-400" /></button>
              <h3 className="text-lg md:text-2xl font-black italic text-zinc-950 mb-4 md:mb-6 uppercase tracking-tighter">{editing ? t("industry.students.edit_title") : t("industry.students.new_title")}</h3>
              <div className="space-y-3 md:space-y-4">
                <input type="text" placeholder={t("industry.students.name_placeholder")} value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  <input type="email" placeholder={t("industry.students.email_placeholder")} value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                  <input type="text" placeholder={t("industry.students.phone_placeholder")} value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  <input type="text" placeholder={t("industry.students.grade_placeholder")} value={form.grade} onChange={e => setForm({...form, grade: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                  <input type="text" placeholder={t("industry.students.parent_placeholder")} value={form.parentName} onChange={e => setForm({...form, parentName: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.students.birth_label")}</label>
                    <input type="date" value={form.birthDate} onChange={e => setForm({...form, birthDate: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.students.enrollment_label")}</label>
                    <input type="date" value={form.enrollmentDate} onChange={e => setForm({...form, enrollmentDate: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                  </div>
                </div>
                <input type="text" placeholder={t("industry.students.address_placeholder")} value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                <input type="text" placeholder={t("industry.students.emergency_placeholder")} value={form.emergencyContact} onChange={e => setForm({...form, emergencyContact: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                <textarea placeholder={t("industry.students.notes_placeholder")} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm resize-none" />
                <input type="text" placeholder={t("industry.students.photo_placeholder")} value={form.photo} onChange={e => setForm({...form, photo: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
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
