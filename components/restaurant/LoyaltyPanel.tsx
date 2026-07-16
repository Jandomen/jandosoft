"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useToast } from "@/components/ui/Toast";
import {
  Plus, X, Loader2, Star, Users, Award, TrendingUp,
  Settings, CreditCard, Clock, Minus,
} from "lucide-react";

interface LoyaltyMember {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  totalPoints: number;
  totalVisits: number;
  totalSpent: number;
  tier: string;
  createdAt: string;
}

interface PointsTransaction {
  _id: string;
  memberId: string;
  memberName: string;
  type: string;
  points: number;
  description: string;
  createdAt: string;
}

interface Props {
  storeId: string;
}

function getTierColors(t: (key: string) => string): Record<string, { bg: string; text: string; label: string }> {
  return {
    bronze: { bg: "bg-orange-100", text: "text-orange-700", label: t("restaurant.tier_bronze") },
    silver: { bg: "bg-gray-100", text: "text-gray-600", label: t("restaurant.tier_silver") },
    gold: { bg: "bg-yellow-100", text: "text-yellow-700", label: t("restaurant.tier_gold") },
    platinum: { bg: "bg-blue-100", text: "text-blue-700", label: t("restaurant.tier_platinum") },
  };
}

const TX_COLORS: Record<string, string> = {
  earned: "text-emerald-600",
  redeemed: "text-red-600",
  adjusted: "text-blue-600",
};

export default function LoyaltyPanel({ storeId }: Props) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [members, setMembers] = useState<LoyaltyMember[]>([]);
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddPoints, setShowAddPoints] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedMember, setSelectedMember] = useState("");
  const [pointsAmount, setPointsAmount] = useState("");
  const [pointsType, setPointsType] = useState("earned");
  const [pointsDescription, setPointsDescription] = useState("");
  const [settings, setSettings] = useState({ pointsPerDollar: "1", rewardsThreshold: "100" });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/restaurant/${storeId}/loyalty`);
      const data = await res.json();
      setMembers(data.members || []);
      setTransactions(data.transactions || []);
      if (data.settings) setSettings(data.settings);
    } catch {
      showToast(t("restaurant.error_loading"), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [storeId]);

  const totalPointsAwarded = members.reduce((s, m) => s + m.totalPoints, 0);
  const avgPoints = members.length > 0 ? Math.round(totalPointsAwarded / members.length) : 0;
  const tierDist = Object.keys(getTierColors(t)).reduce((acc, tier) => {
    acc[tier] = members.filter(m => m.tier === tier).length;
    return acc;
  }, {} as Record<string, number>);

  const addPoints = async () => {
    if (!selectedMember || !pointsAmount) return;
    try {
      await fetch(`/api/restaurant/${storeId}/loyalty/transactions`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: selectedMember, points: parseInt(pointsAmount),
          type: pointsType, description: pointsDescription,
        }),
      });
      fetchData();
      setShowAddPoints(false);
      setSelectedMember(""); setPointsAmount(""); setPointsDescription("");
      showToast(t("restaurant.points_added"), "success");
    } catch {
      showToast(t("restaurant.error_saving"), "error");
    }
  };

  const saveSettings = async () => {
    try {
      await fetch(`/api/restaurant/${storeId}/loyalty`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      setShowSettings(false);
      showToast(t("restaurant.settings_saved"), "success");
    } catch {
      showToast(t("restaurant.error_saving"), "error");
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 text-zinc-300 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="max-[400px]:text-xl text-2xl font-black italic text-zinc-950 uppercase tracking-tighter">{t("restaurant.loyalty")}</h3>
        <div className="flex items-center gap-2">
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowSettings(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-50 hover:bg-zinc-100 border border-zinc-100 rounded-xl text-[10px] font-black italic text-zinc-700 transition-all">
            <Settings className="w-3.5 h-3.5" /> {t("restaurant.settings")}
          </motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowAddPoints(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-red-600 text-white rounded-xl text-[10px] md:text-xs font-black italic hover:bg-red-700 transition-all shadow-xl shadow-red-100">
            <Plus className="w-3.5 h-3.5" /> {t("restaurant.add_points")}
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
        {[
          { icon: <Users className="w-5 h-5" />, label: t("restaurant.total_members"), value: members.length, color: "bg-blue-50 text-blue-600" },
          { icon: <Star className="w-5 h-5" />, label: t("restaurant.total_points_awarded"), value: totalPointsAwarded.toLocaleString(), color: "bg-amber-50 text-amber-600" },
          { icon: <TrendingUp className="w-5 h-5" />, label: t("restaurant.avg_points_member"), value: avgPoints.toLocaleString(), color: "bg-emerald-50 text-emerald-600" },
          { icon: <Award className="w-5 h-5" />, label: t("restaurant.tier_distribution"), value: Object.values(tierDist).filter(v => v > 0).length + " " + t("restaurant.tiers"), color: "bg-purple-50 text-purple-600" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-white max-[400px]:p-4 p-6 rounded-[2rem] border border-zinc-100 shadow-sm space-y-2">
            <div className={cn("p-2 md:p-3 rounded-xl w-fit", s.color)}>{s.icon}</div>
            <p className="text-[8px] md:text-[9px] font-black text-zinc-400 uppercase italic">{s.label}</p>
            <p className="max-[400px]:text-2xl text-3xl font-black italic text-zinc-950">{s.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="space-y-3">
        <h4 className="text-xs font-black italic text-zinc-950 uppercase tracking-tight">{t("restaurant.members")}</h4>
        {members.length === 0 ? (
          <p className="py-8 text-center italic font-black uppercase tracking-widest text-zinc-200">{t("restaurant.no_members")}</p>
        ) : (
          <div className="grid gap-3">
            {members.map(member => {
              const tier = getTierColors(t)[member.tier] || getTierColors(t).bronze;
              return (
                <motion.div key={member._id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-4 md:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-black italic text-zinc-950">{member.name}</p>
                        <span className={cn("text-[8px] font-black italic px-2 py-0.5 rounded-full uppercase", tier.bg, tier.text)}>
                          {tier.label}
                        </span>
                      </div>
                      {member.email && <p className="text-[9px] text-zinc-400 font-bold italic mt-0.5">{member.email}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-black italic text-zinc-950">{member.totalPoints.toLocaleString()}</p>
                      <p className="text-[8px] font-bold text-zinc-400 italic">{t("restaurant.points")}</p>
                    </div>
                  </div>
                  <div className="flex gap-4 mt-3 text-[9px] font-bold text-zinc-400 italic">
                    <span>{member.totalVisits} {t("restaurant.visits")}</span>
                    <span>${member.totalSpent?.toFixed(2)} {t("restaurant.spent")}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h4 className="text-xs font-black italic text-zinc-950 uppercase tracking-tight flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-red-600" /> {t("restaurant.recent_transactions")}
        </h4>
        {transactions.length === 0 ? (
          <p className="py-8 text-center italic font-black uppercase tracking-widest text-zinc-200">{t("restaurant.no_transactions")}</p>
        ) : (
          <div className="space-y-1.5">
            {transactions.slice(0, 20).map(tx => (
              <div key={tx._id} className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-zinc-700 italic truncate">{tx.memberName}</p>
                  <p className="text-[9px] text-zinc-400 italic">{tx.description}</p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className={cn("text-xs font-black italic", TX_COLORS[tx.type] || "text-zinc-500")}>
                    {tx.type === "redeemed" ? "-" : "+"}{tx.points}
                  </p>
                  <p className="text-[8px] text-zinc-300 italic">{new Date(tx.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAddPoints && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowAddPoints(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl">
              <div className="flex items-center justify-between p-5 border-b border-zinc-100">
                <h4 className="text-sm font-black italic uppercase tracking-tighter">{t("restaurant.add_points")}</h4>
                <button onClick={() => setShowAddPoints(false)} className="p-1 hover:bg-zinc-50 rounded-lg"><X className="w-4 h-4 text-zinc-400" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1">{t("restaurant.customer")}</label>
                  <select value={selectedMember} onChange={e => setSelectedMember(e.target.value)}
                    className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-red-200 transition-all">
                    <option value="">{t("restaurant.select_customer")}</option>
                    {members.map(m => <option key={m._id} value={m._id}>{m.name} ({m.totalPoints} {t("restaurant.points")})</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1">{t("restaurant.points")}</label>
                  <input type="number" value={pointsAmount} onChange={e => setPointsAmount(e.target.value)}
                    className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-red-200 transition-all" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1">{t("restaurant.type")}</label>
                  <div className="flex gap-2">
                    {(["earned", "redeemed", "adjusted"] as const).map(type => (
                      <button key={type} onClick={() => setPointsType(type)}
                        className={cn("flex-1 py-2 rounded-xl border text-[10px] font-black italic transition-all",
                          pointsType === type ? "bg-red-600 text-white border-red-600" : "bg-zinc-50 text-zinc-500 border-zinc-100")}>
                        {t(`restaurant.tx_type_${type}`)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1">{t("restaurant.description")}</label>
                  <input type="text" value={pointsDescription} onChange={e => setPointsDescription(e.target.value)}
                    className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-red-200 transition-all" />
                </div>
                <motion.button whileTap={{ scale: 0.97 }} onClick={addPoints} disabled={!selectedMember || !pointsAmount}
                  className="w-full py-4 bg-red-600 text-white rounded-2xl font-black italic hover:bg-red-700 transition-all shadow-xl disabled:opacity-50">
                  {t("restaurant.add_points")}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSettings && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowSettings(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl">
              <div className="flex items-center justify-between p-5 border-b border-zinc-100">
                <h4 className="text-sm font-black italic uppercase tracking-tighter">{t("restaurant.loyalty_settings")}</h4>
                <button onClick={() => setShowSettings(false)} className="p-1 hover:bg-zinc-50 rounded-lg"><X className="w-4 h-4 text-zinc-400" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1">{t("restaurant.points_per_dollar")}</label>
                  <input type="number" step="0.1" value={settings.pointsPerDollar} onChange={e => setSettings({ ...settings, pointsPerDollar: e.target.value })}
                    className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-red-200 transition-all" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1">{t("restaurant.rewards_threshold")}</label>
                  <input type="number" value={settings.rewardsThreshold} onChange={e => setSettings({ ...settings, rewardsThreshold: e.target.value })}
                    className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-red-200 transition-all" />
                </div>
                <motion.button whileTap={{ scale: 0.97 }} onClick={saveSettings}
                  className="w-full py-4 bg-red-600 text-white rounded-2xl font-black italic hover:bg-red-700 transition-all shadow-xl">
                  {t("action.save")}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
