"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useToast } from "@/components/ui/Toast";
import {
  Plus, X, Loader2, Trash2, Edit3, Tag, Percent,
  DollarSign, Gift, CheckCircle2,
} from "lucide-react";

interface Promotion {
  _id: string;
  code: string;
  description: string;
  type: string;
  value: number;
  minOrder: number;
  maxUses: number;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  active: boolean;
}

interface Props {
  storeId: string;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  percentage: <Percent className="w-3 h-3" />,
  fixed: <DollarSign className="w-3 h-3" />,
  bogo: <Gift className="w-3 h-3" />,
  free_item: <Gift className="w-3 h-3" />,
};

const TYPE_COLORS: Record<string, string> = {
  percentage: "bg-blue-100 text-blue-700",
  fixed: "bg-emerald-100 text-emerald-700",
  bogo: "bg-amber-100 text-amber-700",
  free_item: "bg-purple-100 text-purple-700",
};

export default function PromotionsPanel({ storeId }: Props) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Promotion | null>(null);
  const [form, setForm] = useState({
    code: "", description: "", type: "percentage", value: "",
    minOrder: "", maxUses: "", validFrom: "", validUntil: "", active: true,
  });

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/restaurant/${storeId}/promotions`);
      const data = await res.json();
      setPromotions(data.promotions || []);
    } catch {
      showToast(t("restaurant.error_loading"), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPromotions(); }, [storeId]);

  const openNew = () => {
    setEditing(null);
    setForm({ code: "", description: "", type: "percentage", value: "", minOrder: "", maxUses: "", validFrom: "", validUntil: "", active: true });
    setShowModal(true);
  };

  const openEdit = (promo: Promotion) => {
    setEditing(promo);
    setForm({
      code: promo.code, description: promo.description, type: promo.type,
      value: String(promo.value), minOrder: String(promo.minOrder || ""),
      maxUses: String(promo.maxUses || ""), validFrom: promo.validFrom?.split("T")[0] || "",
      validUntil: promo.validUntil?.split("T")[0] || "", active: promo.active,
    });
    setShowModal(true);
  };

  const savePromotion = async () => {
    if (!form.code || !form.value) return;
    const body = {
      code: form.code.toUpperCase(), description: form.description, type: form.type,
      value: parseFloat(form.value), minOrder: parseFloat(form.minOrder) || 0,
      maxUses: parseInt(form.maxUses) || 0, validFrom: form.validFrom || undefined,
      validUntil: form.validUntil || undefined, active: form.active,
    };
    try {
      if (editing) {
        await fetch(`/api/restaurant/${storeId}/promotions/${editing._id}`, {
          method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        });
      } else {
        await fetch(`/api/restaurant/${storeId}/promotions`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        });
      }
      fetchPromotions();
      setShowModal(false);
      showToast(t("restaurant.promotion_saved"), "success");
    } catch {
      showToast(t("restaurant.error_saving"), "error");
    }
  };

  const deletePromotion = async (id: string) => {
    try {
      await fetch(`/api/restaurant/${storeId}/promotions/${id}`, { method: "DELETE" });
      setPromotions(prev => prev.filter(p => p._id !== id));
      setConfirmDelete(null);
      showToast(t("restaurant.promotion_deleted"), "success");
    } catch {
      showToast(t("restaurant.error_saving"), "error");
    }
  };

  const toggleActive = async (promo: Promotion) => {
    try {
      await fetch(`/api/restaurant/${storeId}/promotions/${promo._id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !promo.active }),
      });
      setPromotions(prev => prev.map(p => p._id === promo._id ? { ...p, active: !p.active } : p));
    } catch {}
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="max-[400px]:text-xl text-2xl font-black italic text-zinc-950 uppercase tracking-tighter">{t("restaurant.promotions")}</h3>
        <motion.button whileTap={{ scale: 0.95 }} onClick={openNew}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-red-600 text-white rounded-xl text-[10px] md:text-xs font-black italic hover:bg-red-700 transition-all shadow-xl shadow-red-100">
          <Plus className="w-3.5 h-3.5" /> {t("restaurant.new_promotion")}
        </motion.button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 text-zinc-300 animate-spin" /></div>
      ) : promotions.length === 0 ? (
        <div className="py-16 text-center italic font-black uppercase tracking-widest text-zinc-200">{t("restaurant.no_promotions")}</div>
      ) : (
        <div className="grid gap-3">
          {promotions.map(promo => (
            <motion.div key={promo._id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-4 md:p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-black italic text-zinc-950">{promo.code}</p>
                    <span className={cn("text-[8px] font-black italic px-2 py-0.5 rounded-full uppercase", TYPE_COLORS[promo.type])}>
                      {t(`restaurant.promo_type_${promo.type}`)}
                    </span>
                    {!promo.active && <span className="text-[8px] font-black italic px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-400">{t("restaurant.inactive")}</span>}
                  </div>
                  {promo.description && <p className="text-[10px] text-zinc-400 font-medium italic mt-1">{promo.description}</p>}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1.5 text-[9px] font-bold text-zinc-400 italic">
                    <span>{t("restaurant.value")}: {promo.type === "percentage" ? `${promo.value}%` : `$${promo.value}`}</span>
                    {promo.minOrder > 0 && <span>{t("restaurant.min_order")}: ${promo.minOrder}</span>}
                    {promo.maxUses > 0 && <span>{promo.usedCount}/{promo.maxUses} {t("restaurant.used")}</span>}
                    {promo.validUntil && <span>{t("restaurant.expires")}: {new Date(promo.validUntil).toLocaleDateString()}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => toggleActive(promo)}
                    className={cn("w-10 h-5 rounded-full transition-all relative", promo.active ? "bg-emerald-500" : "bg-zinc-200")}>
                    <div className={cn("w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-all", promo.active ? "left-5.5" : "left-0.5")} />
                  </motion.button>
                </div>
              </div>

              {promo.maxUses > 0 && (
                <div className="w-full bg-zinc-100 rounded-full h-1.5">
                  <div className="bg-red-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (promo.usedCount / promo.maxUses) * 100)}%` }} />
                </div>
              )}

              <div className="flex items-center gap-2">
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => openEdit(promo)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-zinc-50 text-zinc-600 rounded-lg text-[9px] font-black italic hover:bg-zinc-100 transition-all">
                  <Edit3 className="w-3 h-3" /> {t("action.edit")}
                </motion.button>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setConfirmDelete(promo)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-[9px] font-black italic hover:bg-red-100 transition-all">
                  <Trash2 className="w-3 h-3" /> {t("action.delete")}
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-[2rem] w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between p-5 border-b border-zinc-100">
                <h4 className="text-sm font-black italic uppercase tracking-tighter">{editing ? t("restaurant.edit_promotion") : t("restaurant.new_promotion")}</h4>
                <button onClick={() => setShowModal(false)} className="p-1 hover:bg-zinc-50 rounded-lg"><X className="w-4 h-4 text-zinc-400" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1">{t("restaurant.code")}</label>
                  <input type="text" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-red-200 transition-all uppercase" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1">{t("restaurant.description")}</label>
                  <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                    className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-red-200 transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1">{t("restaurant.type")}</label>
                    <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                      className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-red-200 transition-all">
                      <option value="percentage">{t("restaurant.promo_type_percentage")}</option>
                      <option value="fixed">{t("restaurant.promo_type_fixed")}</option>
                      <option value="bogo">{t("restaurant.promo_type_bogo")}</option>
                      <option value="free_item">{t("restaurant.promo_type_free_item")}</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1">{t("restaurant.value")}</label>
                    <input type="number" step="0.01" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })}
                      className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-red-200 transition-all" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1">{t("restaurant.min_order")}</label>
                    <input type="number" step="0.01" value={form.minOrder} onChange={e => setForm({ ...form, minOrder: e.target.value })}
                      className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-red-200 transition-all" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1">{t("restaurant.max_uses")}</label>
                    <input type="number" value={form.maxUses} onChange={e => setForm({ ...form, maxUses: e.target.value })}
                      className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-red-200 transition-all" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1">{t("restaurant.valid_from")}</label>
                    <input type="date" value={form.validFrom} onChange={e => setForm({ ...form, validFrom: e.target.value })}
                      className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-red-200 transition-all" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1">{t("restaurant.valid_until")}</label>
                    <input type="date" value={form.validUntil} onChange={e => setForm({ ...form, validUntil: e.target.value })}
                      className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-red-200 transition-all" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="promo-active" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })}
                    className="w-4 h-4 rounded border-zinc-300 text-red-600 focus:ring-red-500" />
                  <label htmlFor="promo-active" className="text-[9px] font-black text-zinc-400 uppercase italic">{t("restaurant.active")}</label>
                </div>
                <motion.button whileTap={{ scale: 0.97 }} onClick={savePromotion} disabled={!form.code || !form.value}
                  className="w-full py-4 bg-red-600 text-white rounded-2xl font-black italic hover:bg-red-700 transition-all shadow-xl disabled:opacity-50">
                  {editing ? t("action.save") : t("restaurant.create_promotion")}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setConfirmDelete(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl text-center space-y-4">
              <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto"><Trash2 className="w-5 h-5 text-red-600" /></div>
              <h4 className="text-sm font-black italic text-zinc-950">{t("restaurant.delete_promotion_confirm")}</h4>
              <p className="text-xs text-zinc-400 font-medium italic">{confirmDelete.code}</p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 bg-zinc-100 text-zinc-600 rounded-xl text-[10px] font-black italic hover:bg-zinc-200 transition-all">{t("action.cancel")}</button>
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => deletePromotion(confirmDelete._id)}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-[10px] font-black italic hover:bg-red-700 transition-all">{t("action.delete")}</motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
