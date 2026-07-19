"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit3, X, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useToast } from "@/components/ui/Toast";
import type { IGrade } from "@/lib/models/Store";
import QRButton from "@/components/business/QRButton";

interface Props { storeId: string | number; onSaveStore?: (storeId: string | number, data: any) => void; store?: any; }

export default function GradesPanel({ storeId, onSaveStore, store }: Props) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [items, setItems] = useState<IGrade[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<IGrade | null>(null);
  const [form, setForm] = useState({ studentName: "", course: "", score: "", period: "", comments: "", subject: "", gradeWeight: "100", letterGrade: "", semester: "", attendance: "" });

  useEffect(() => { if (store?.grades) setItems(store.grades); }, [store, store?.grades]);

  const save = (data: IGrade[]) => { setItems(data); if (onSaveStore) Promise.resolve(onSaveStore(storeId, { grades: data })); };

  const addItem = () => {
    if (!form.studentName || !form.score) return;
    const score = parseFloat(form.score);
    if (editing) {
      save(items.map(i => i.id === editing.id ? { ...i, studentName: form.studentName, course: form.course, score, period: form.period, comments: form.comments, subject: form.subject, gradeWeight: Number(form.gradeWeight), letterGrade: form.letterGrade, semester: form.semester, attendance: Number(form.attendance) } : i));
    } else {
      save([...items, { id: Date.now(), studentName: form.studentName, course: form.course, score, period: form.period, comments: form.comments, subject: form.subject, gradeWeight: Number(form.gradeWeight), letterGrade: form.letterGrade, semester: form.semester, attendance: Number(form.attendance) }]);
    }
    setForm({ studentName: "", course: "", score: "", period: "", comments: "", subject: "", gradeWeight: "100", letterGrade: "", semester: "", attendance: "" });
    setShowModal(false); setEditing(null);
  };

  const deleteItem = (id: number) => save(items.filter(i => i.id !== id));
  const openNew = () => { setEditing(null); setForm({ studentName: "", course: "", score: "", period: "", comments: "", subject: "", gradeWeight: "100", letterGrade: "", semester: "", attendance: "" }); setShowModal(true); };
  const openEdit = (item: IGrade) => { setEditing(item); setForm({ studentName: item.studentName, course: item.course, score: String(item.score), period: item.period, comments: item.comments, subject: item.subject || "", gradeWeight: String(item.gradeWeight ?? "100"), letterGrade: item.letterGrade || "", semester: item.semester || "", attendance: String(item.attendance ?? "") }); setShowModal(true); };

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3 md:gap-4">
        <h3 className="max-[400px]:text-xl text-2xl font-black italic text-zinc-950 uppercase tracking-tighter">{t("category.grades")} <span className="text-red-600">({items.length})</span></h3>
        <motion.button whileTap={{ scale: 0.95 }} onClick={openNew} className="px-5 md:px-6 py-2.5 md:py-3 bg-red-600 text-white rounded-2xl font-black text-[10px] md:text-xs italic hover:bg-red-700 transition-all shadow-xl flex items-center gap-2">
          <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" /> {t("industry.grades.add")}
        </motion.button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {items.map(item => (
          <div key={item.id} className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-zinc-100 shadow-sm p-5 md:p-6 space-y-4 hover:shadow-lg hover:border-zinc-200 transition-all group">
            <div className="flex items-start justify-between gap-2 md:gap-3">
              <div className="min-w-0 flex-1">
                <h4 className="font-black italic text-zinc-950 text-sm md:text-base leading-tight truncate">{item.studentName}</h4>
                <p className="text-[11px] md:text-xs text-zinc-400 font-medium italic mt-1">{item.course} {item.period ? `— ${item.period}` : ""}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-lg md:text-xl font-black italic ${item.score >= 60 ? "text-green-600" : "text-red-600"}`}>{item.score}</span>
                <div className="flex items-center gap-1">
                  <QRButton url={`${typeof window !== "undefined" ? window.location.origin : ""}/s/${store?.slug || "store"}?item=grades|${item.id}`} label={item.studentName} />
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => openEdit(item)} className="p-1.5 md:p-2 text-zinc-300 hover:text-blue-500 transition-all"><Edit3 className="w-3.5 h-3.5 md:w-4 md:h-4" /></motion.button>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => deleteItem(item.id)} className="p-1.5 md:p-2 text-zinc-300 hover:text-rose-500 transition-all"><Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" /></motion.button>
                </div>
              </div>
            </div>
            {item.comments && <p className="text-[11px] md:text-xs text-zinc-400 font-medium italic line-clamp-2">{item.comments}</p>}
            <div className="flex items-center gap-2 text-[8px] font-bold text-zinc-400 uppercase italic flex-wrap mt-1">
              {item.subject && <span>{t("industry.grades.subject_label")}: {item.subject}</span>}
              {item.letterGrade && <span>{t("industry.grades.letter_label")}: {item.letterGrade}</span>}
              {item.semester && <span>{t("industry.grades.semester_label")}: {item.semester}</span>}
              {item.attendance > 0 && <span>{t("industry.grades.attendance_label")}: {item.attendance}%</span>}
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="col-span-full py-16 text-center italic font-black uppercase tracking-widest text-zinc-200">{t("industry.grades.empty")}</div>}
      </div>
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4" onClick={() => { setShowModal(false); setEditing(null); }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full max-w-md bg-white rounded-[2rem] md:rounded-[3rem] p-4 md:p-8 shadow-4xl relative" onClick={e => e.stopPropagation()}>
              <button onClick={() => { setShowModal(false); setEditing(null); }} className="absolute top-4 md:top-6 right-4 md:right-6 p-2 hover:bg-zinc-50 rounded-xl"><X className="w-4 h-4 md:w-5 md:h-5 text-zinc-400" /></button>
              <h3 className="text-lg md:text-2xl font-black italic text-zinc-950 mb-4 md:mb-6 uppercase tracking-tighter">{editing ? t("industry.grades.edit_title") : t("industry.grades.new_title")}</h3>
              <div className="space-y-3 md:space-y-4">
                <input type="text" placeholder={t("industry.grades.student_name_placeholder")} value={form.studentName} onChange={e => setForm({...form, studentName: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  <input type="text" placeholder={t("industry.grades.course_placeholder")} value={form.course} onChange={e => setForm({...form, course: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                  <input type="text" placeholder={t("industry.grades.period_placeholder")} value={form.period} onChange={e => setForm({...form, period: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.grades.score_label")}</label>
                  <input type="number" min="0" max="100" placeholder="0" value={form.score} onChange={e => setForm({...form, score: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                </div>
                <textarea placeholder={t("industry.grades.comments_placeholder")} value={form.comments} onChange={e => setForm({...form, comments: e.target.value})} rows={2} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm resize-none" />
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.grades.subject_label")}</label>
                    <input type="text" placeholder={t("industry.grades.subject_placeholder")} value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.grades.letter_label")}</label>
                    <input type="text" placeholder="A, B, C..." value={form.letterGrade} onChange={e => setForm({...form, letterGrade: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.grades.semester_label")}</label>
                    <input type="text" placeholder={t("industry.grades.semester_placeholder")} value={form.semester} onChange={e => setForm({...form, semester: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("industry.grades.attendance_label")}</label>
                    <input type="number" placeholder="0-100" value={form.attendance} onChange={e => setForm({...form, attendance: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm" />
                  </div>
                </div>
                <button onClick={addItem} disabled={!form.studentName || !form.score} className="w-full py-3 md:py-4 bg-red-600 text-white rounded-2xl font-black italic hover:bg-red-700 transition-all shadow-xl disabled:opacity-50">
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
