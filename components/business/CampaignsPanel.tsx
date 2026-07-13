"use client";

import { useState } from "react";
import { Megaphone, Plus, Trash2, Edit3, X, Send, Clock, CheckCircle2, AlertCircle, BarChart3, Mail, Smartphone, Users, Eye, MousePointerClick, Loader2, Play, Pause, FileText, Copy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

interface Campaign {
  id: number;
  name: string;
  type: "email" | "sms";
  status: "draft" | "scheduled" | "sending" | "sent" | "paused" | "cancelled";
  audience: string;
  subject: string;
  body: string;
  scheduledAt: string | null;
  sentAt: string | null;
  stats: { sent: number; opened: number; clicked: number; bounced: number; unsubscribed: number };
  createdAt: string;
}

interface CampaignsPanelProps {
  campaigns: Campaign[];
  setCampaigns: (campaigns: Campaign[]) => void;
  onPersist: (campaigns?: Campaign[]) => void;
  storeId?: string;
}

export default function CampaignsPanel({ campaigns, setCampaigns, onPersist, storeId }: CampaignsPanelProps) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [form, setForm] = useState({ name: "", type: "email" as "email" | "sms", audience: "all", subject: "", body: "", schedule: "now", scheduledAt: "" });
  const [sending, setSending] = useState<number | null>(null);

  const totalSent = campaigns.reduce((s, c) => s + c.stats.sent, 0);
  const totalOpened = campaigns.reduce((s, c) => s + c.stats.opened, 0);
  const totalClicked = campaigns.reduce((s, c) => s + c.stats.clicked, 0);

  const openNew = () => {
    setEditingCampaign(null);
    setForm({ name: "", type: "email", audience: "all", subject: "", body: "", schedule: "now", scheduledAt: "" });
    setShowForm(true);
  };

  const openEdit = (c: Campaign) => {
    setEditingCampaign(c);
    setForm({ name: c.name, type: c.type, audience: c.audience, subject: c.subject, body: c.body, schedule: c.scheduledAt ? "scheduled" : "now", scheduledAt: c.scheduledAt || "" });
    setShowForm(true);
  };

  const save = () => {
    if (!form.name || !form.subject || !form.body) return;
    let newCampaigns: Campaign[];
    if (editingCampaign) {
      newCampaigns = campaigns.map(c => c.id === editingCampaign.id ? {
        ...c, name: form.name, type: form.type, audience: form.audience,
        subject: form.subject, body: form.body,
        scheduledAt: form.schedule === "scheduled" ? form.scheduledAt : null,
        status: form.schedule === "scheduled" ? "scheduled" : c.status,
      } : c);
    } else {
      newCampaigns = [...campaigns, {
        id: Date.now(), name: form.name, type: form.type, status: "draft",
        audience: form.audience, subject: form.subject, body: form.body,
        scheduledAt: form.schedule === "scheduled" ? form.scheduledAt : null,
        sentAt: null,
        stats: { sent: 0, opened: 0, clicked: 0, bounced: 0, unsubscribed: 0 },
        createdAt: new Date().toISOString(),
      }];
    }
    setCampaigns(newCampaigns);
    onPersist(newCampaigns);
    setShowForm(false);
    setEditingCampaign(null);
    showToast(editingCampaign ? t("campaigns.updated") : t("campaigns.created"), "success");
  };

  const remove = (id: number) => {
    const nc = campaigns.filter(c => c.id !== id);
    setCampaigns(nc);
    onPersist(nc);
    showToast(t("campaigns.deleted"), "success");
  };

  const sendCampaign = async (id: number) => {
    const campaign = campaigns.find(c => c.id === id);
    if (!campaign) return;
    setSending(id);
    try {
      if (campaign.type === "email") {
        const res = await fetch("/api/email/campaigns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerIds: [],
            audience: campaign.audience,
            storeId,
            subject: campaign.subject,
            content: campaign.body,
          }),
        });
        const data = await res.json();
        if (!res.ok) { showToast(data.error || t("campaigns.error_send"), "error"); setSending(null); return; }
        const nc = campaigns.map(c => c.id === id ? {
          ...c, status: "sent" as const, sentAt: new Date().toISOString(),
          stats: { sent: data.stats?.sent || 0, opened: 0, clicked: 0, bounced: data.stats?.failed || 0, unsubscribed: 0 },
        } : c);
        setCampaigns(nc);
        onPersist(nc);
        showToast(t("campaigns.sent").replace("{sent}", String(data.stats?.sent || 0)), "success");
      } else if (campaign.type === "sms") {
        const res = await fetch("/api/sms/campaigns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerIds: [],
            audience: campaign.audience,
            storeId,
            content: campaign.body,
          }),
        });
        const data = await res.json();
        if (!res.ok) { showToast(data.error || t("campaigns.error_sms"), "error"); setSending(null); return; }
        const nc = campaigns.map(c => c.id === id ? {
          ...c, status: "sent" as const, sentAt: new Date().toISOString(),
          stats: { sent: data.stats?.sent || 0, opened: 0, clicked: 0, bounced: data.stats?.failed || 0, unsubscribed: 0 },
        } : c);
        setCampaigns(nc);
        onPersist(nc);
        showToast(t("campaigns.sms_sent").replace("{sent}", String(data.stats?.sent || 0)), "success");
      }
    } catch {
      showToast(t("campaigns.error_connection"), "error");
    }
    setSending(null);
  };

  const togglePause = (id: number) => {
    const nc = campaigns.map(c => c.id === id ? { ...c, status: (c.status === "paused" ? "draft" : "paused") as "draft" | "paused" } : c);
    setCampaigns(nc);
    onPersist(nc);
  };

  const statusColor = (s: string) =>
    s === "sent" ? "bg-emerald-50 text-emerald-600" :
    s === "sending" ? "bg-blue-50 text-blue-600" :
    s === "scheduled" ? "bg-amber-50 text-amber-600" :
    s === "paused" ? "bg-zinc-100 text-zinc-500" :
    s === "cancelled" ? "bg-red-50 text-red-500" :
    "bg-zinc-50 text-zinc-400";

  const statusLabel = (s: string) =>
    s === "sent" ? t("campaigns.status_sent") :
    s === "sending" ? t("campaigns.status_sending") :
    s === "scheduled" ? t("campaigns.status_scheduled") :
    s === "paused" ? t("campaigns.status_paused") :
    s === "cancelled" ? t("campaigns.status_cancelled") :
    t("campaigns.status_draft");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 max-[400px]:gap-3 gap-4">
        <div>
          <h3 className="text-2xl max-[400px]:text-xl font-black italic text-zinc-950 uppercase tracking-tighter">
            <Megaphone className="w-6 h-6 max-[400px]:w-5 max-[400px]:h-5 inline mr-3 text-red-600" />{t("campaigns.title")}
            <span className="text-zinc-400 text-base max-[400px]:text-sm ml-3">{campaigns.length}</span>
          </h3>
          <p className="text-[9px] font-wallpoet tracking-[0.2em] text-red-600 uppercase mt-1">JANDOSOFT</p>
        </div>
        <motion.button whileTap={{ scale: 0.95 }} onClick={openNew} disabled={campaigns.length >= 50} className="px-5 max-[400px]:px-5 px-6 py-2.5 max-[400px]:py-2.5 py-3 bg-red-600 text-white rounded-2xl font-black text-[10px] max-[400px]:text-[10px] text-xs italic hover:bg-red-700 transition-all shadow-xl flex items-center gap-2 disabled:opacity-50">
          <Plus className="w-3.5 h-3.5 max-[400px]:w-3.5 max-[400px]:h-3.5 w-4 h-4" /> {t("campaigns.new")}
        </motion.button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-[400px]:gap-3 gap-5">
        <div className="bg-white p-5 max-[400px]:p-5 p-6 rounded-[2rem] border border-zinc-100 shadow-sm space-y-2 max-[400px]:space-y-2 space-y-3">
          <div className="p-2.5 max-[400px]:p-2.5 p-3 bg-emerald-50 rounded-xl w-fit"><Send className="w-4 h-4 max-[400px]:w-4 max-[400px]:h-4 w-5 h-5 text-emerald-600" /></div>
          <p className="text-[8px] max-[400px]:text-[8px] text-[9px] font-black text-zinc-400 uppercase italic">{t("campaigns.stat_sent")}</p>
          <p className="text-2xl max-[400px]:text-2xl text-3xl font-black italic text-zinc-950">{totalSent.toLocaleString()}</p>
        </div>
        <div className="bg-white p-5 max-[400px]:p-5 p-6 rounded-[2rem] border border-zinc-100 shadow-sm space-y-2 max-[400px]:space-y-2 space-y-3">
          <div className="p-2.5 max-[400px]:p-2.5 p-3 bg-blue-50 rounded-xl w-fit"><Eye className="w-4 h-4 max-[400px]:w-4 max-[400px]:h-4 w-5 h-5 text-blue-600" /></div>
          <p className="text-[8px] max-[400px]:text-[8px] text-[9px] font-black text-zinc-400 uppercase italic">{t("campaigns.stat_opened")}</p>
          <p className="text-2xl max-[400px]:text-2xl text-3xl font-black italic text-zinc-950">{totalOpened.toLocaleString()}</p>
        </div>
        <div className="bg-white p-5 max-[400px]:p-5 p-6 rounded-[2rem] border border-zinc-100 shadow-sm space-y-2 max-[400px]:space-y-2 space-y-3">
          <div className="p-2.5 max-[400px]:p-2.5 p-3 bg-purple-50 rounded-xl w-fit"><MousePointerClick className="w-4 h-4 max-[400px]:w-4 max-[400px]:h-4 w-5 h-5 text-purple-600" /></div>
          <p className="text-[8px] max-[400px]:text-[8px] text-[9px] font-black text-zinc-400 uppercase italic">{t("campaigns.stat_clicks")}</p>
          <p className="text-2xl max-[400px]:text-2xl text-3xl font-black italic text-zinc-950">{totalClicked.toLocaleString()}</p>
        </div>
        <div className="bg-white p-5 max-[400px]:p-5 p-6 rounded-[2rem] border border-zinc-100 shadow-sm space-y-2 max-[400px]:space-y-2 space-y-3">
          <div className="p-2.5 max-[400px]:p-2.5 p-3 bg-amber-50 rounded-xl w-fit"><BarChart3 className="w-4 h-4 max-[400px]:w-4 max-[400px]:h-4 w-5 h-5 text-amber-600" /></div>
          <p className="text-[8px] max-[400px]:text-[8px] text-[9px] font-black text-zinc-400 uppercase italic">{t("campaigns.stat_open_rate")}</p>
          <p className="text-2xl max-[400px]:text-2xl text-3xl font-black italic text-zinc-950">{totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0}%</p>
        </div>
      </div>

      {/* Campaign list */}
      {campaigns.length === 0 ? (
        <div className="py-20 text-center italic font-black uppercase tracking-widest text-zinc-200">
          {t("campaigns.empty")}
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map(c => (
            <div key={c.id} className="flex items-center justify-between p-4 max-[400px]:p-4 p-5 bg-white rounded-2xl border border-zinc-100 group hover:border-red-200 transition-all shadow-sm">
              <div className="flex items-center gap-3 max-[400px]:gap-3 gap-4 min-w-0">
                <div className={cn("w-10 h-10 max-[400px]:w-10 max-[400px]:h-10 w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm shrink-0", c.type === "email" ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600")}>
                  {c.type === "email" ? <Mail className="w-5 h-5 max-[400px]:w-5 max-[400px]:h-5 w-6 h-6" /> : <Smartphone className="w-5 h-5 max-[400px]:w-5 max-[400px]:h-5 w-6 h-6" />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 max-[400px]:gap-1.5 gap-2">
                    <p className="font-black italic text-zinc-950 text-sm truncate">{c.name}</p>
                    {c.status === "sent" && c.stats.sent > 0 && (
                      <span className="text-[8px] max-[400px]:text-[8px] text-[9px] text-emerald-600 font-bold italic shrink-0">
                        {c.stats.opened > 0 ? `${Math.round((c.stats.opened / c.stats.sent) * 100)}%` : ""}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 max-[400px]:gap-1.5 gap-2 mt-0.5 max-[400px]:mt-0.5 mt-1 flex-wrap">
                    <span className={cn("px-1.5 max-[400px]:px-1.5 px-2 py-0.5 rounded-full text-[7px] max-[400px]:text-[7px] text-[8px] font-black uppercase italic", statusColor(c.status))}>
                      {statusLabel(c.status)}
                    </span>
                    <span className="text-[8px] max-[400px]:text-[8px] text-[9px] text-zinc-400 font-bold italic">{c.type === "email" ? t("campaigns.type_email") : t("campaigns.type_sms")}</span>
                    {c.scheduledAt && (
                      <span className="text-[8px] max-[400px]:text-[8px] text-[9px] text-zinc-400 font-bold italic flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5 max-[400px]:w-2.5 max-[400px]:h-2.5 w-3 h-3" />{new Date(c.scheduledAt).toLocaleDateString()}
                      </span>
                    )}
                    {c.sentAt && (
                      <span className="text-[8px] max-[400px]:text-[8px] text-[9px] text-zinc-400 font-bold italic">{new Date(c.sentAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 max-[400px]:gap-1.5 gap-2 shrink-0">
                {/* Stats for sent campaigns - always visible on mobile */}
                {c.status === "sent" && c.stats.sent > 0 && (
                  <div className="hidden max-[400px]:hidden md:flex items-center gap-2 mr-2 text-[7px] max-[400px]:text-[7px] text-[8px] font-bold italic text-zinc-400">
                    <span title={t("campaigns.stat_sent")}><Send className="w-2 h-2 max-[400px]:w-2 max-[400px]:h-2 w-3 h-3 inline mr-0.5" />{c.stats.sent}</span>
                    <span title={t("campaigns.stat_opened")}><Eye className="w-2 h-2 max-[400px]:w-2 max-[400px]:h-2 w-3 h-3 inline mr-0.5" />{c.stats.opened}</span>
                    <span title={t("campaigns.stat_clicks")}><MousePointerClick className="w-2 h-2 max-[400px]:w-2 max-[400px]:h-2 w-3 h-3 inline mr-0.5" />{c.stats.clicked}</span>
                  </div>
                )}

                {c.status === "draft" && (
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => sendCampaign(c.id)} disabled={sending === c.id} className="px-3 max-[400px]:px-3 px-4 py-1.5 max-[400px]:py-1.5 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[8px] max-[400px]:text-[8px] text-[9px] font-black italic hover:bg-emerald-100 transition-all flex items-center gap-1 border border-emerald-100">
                    {sending === c.id ? <Loader2 className="w-2.5 h-2.5 max-[400px]:w-2.5 max-[400px]:h-2.5 w-3 h-3 animate-spin" /> : <Send className="w-2.5 h-2.5 max-[400px]:w-2.5 max-[400px]:h-2.5 w-3 h-3" />} {t("campaigns.action_send")}
                  </motion.button>
                )}
                {c.status === "scheduled" && (
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => togglePause(c.id)} className="px-2.5 max-[400px]:px-2.5 px-3 py-1.5 max-[400px]:py-1.5 py-2 bg-zinc-50 text-zinc-500 rounded-xl text-[8px] max-[400px]:text-[8px] text-[9px] font-black italic hover:bg-zinc-100 transition-all flex items-center gap-1 border border-zinc-100">
                    <Pause className="w-2.5 h-2.5 max-[400px]:w-2.5 max-[400px]:h-2.5 w-3 h-3" /> {t("campaigns.action_pause")}
                  </motion.button>
                )}
                {c.status === "paused" && (
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => togglePause(c.id)} className="px-2.5 max-[400px]:px-2.5 px-3 py-1.5 max-[400px]:py-1.5 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[8px] max-[400px]:text-[8px] text-[9px] font-black italic hover:bg-emerald-100 transition-all flex items-center gap-1 border border-emerald-100">
                    <Play className="w-2.5 h-2.5 max-[400px]:w-2.5 max-[400px]:h-2.5 w-3 h-3" /> {t("campaigns.action_resume")}
                  </motion.button>
                )}
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => openEdit(c)} className="p-1.5 max-[400px]:p-1.5 p-2 text-zinc-300 hover:text-blue-500 transition-all"><Edit3 className="w-3.5 h-3.5 max-[400px]:w-3.5 max-[400px]:h-3.5 w-4 h-4" /></motion.button>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => remove(c.id)} className="p-1.5 max-[400px]:p-1.5 p-2 text-zinc-300 hover:text-rose-500 transition-all"><Trash2 className="w-3.5 h-3.5 max-[400px]:w-3.5 max-[400px]:h-3.5 w-4 h-4" /></motion.button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-6" onClick={() => { setShowForm(false); setEditingCampaign(null); }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full max-w-lg bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-4xl relative" onClick={e => e.stopPropagation()}>
              <button onClick={() => { setShowForm(false); setEditingCampaign(null); }} className="absolute top-4 md:top-6 right-4 md:right-6 p-2 hover:bg-zinc-50 rounded-xl"><X className="w-4 h-4 md:w-5 md:h-5 text-zinc-400" /></button>
              <h3 className="text-xl md:text-2xl font-black italic text-zinc-950 mb-4 md:mb-6 uppercase tracking-tighter">{editingCampaign ? t("campaigns.form_edit") : t("campaigns.form_new")}</h3>
              <div className="space-y-3 md:space-y-5 max-h-[70vh] overflow-y-auto pr-1 md:pr-2">
                <div>
                  <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("campaigns.form_name_label")}</label>
                  <input type="text" placeholder={t("campaigns.form_name_placeholder")} value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 text-sm" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("campaigns.form_channel_label")}</label>
                    <div className="flex gap-2 mt-1">
                      <button onClick={() => setForm({...form, type: "email"})} className={cn("flex-1 py-3.5 rounded-xl font-black text-xs italic transition-all border", form.type === "email" ? "bg-red-600 text-white border-red-600 shadow-md" : "bg-zinc-50 text-zinc-500 border-zinc-100 hover:border-zinc-200")}>
                        <Mail className="w-4 h-4 inline mr-1.5" />Email
                      </button>
                      <button onClick={() => setForm({...form, type: "sms"})} className={cn("flex-1 py-3.5 rounded-xl font-black text-xs italic transition-all border", form.type === "sms" ? "bg-red-600 text-white border-red-600 shadow-md" : "bg-zinc-50 text-zinc-500 border-zinc-100 hover:border-zinc-200")}>
                        <Smartphone className="w-4 h-4 inline mr-1.5" />SMS
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("campaigns.form_audience_label")}</label>
                    <select value={form.audience} onChange={e => setForm({...form, audience: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 text-sm italic text-sm">
                      <option value="all">{t("campaigns.form_audience_all")}</option>
                      <option value="active">{t("campaigns.form_audience_active")}</option>
                      <option value="new">{t("campaigns.form_audience_new")}</option>
                      <option value="vip">{t("campaigns.form_audience_vip")}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("campaigns.form_subject_label")}</label>
                  <input type="text" placeholder={form.type === "email" ? t("campaigns.form_subject_email_placeholder") : t("campaigns.form_subject_sms_placeholder")} value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 text-sm" />
                </div>

                <div>
                  <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("campaigns.form_message_label")}</label>
                  <textarea placeholder={t("campaigns.form_message_placeholder")} value={form.body} onChange={e => setForm({...form, body: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all resize-none h-32 mt-1 text-sm" />
                  <p className="text-[8px] font-bold text-zinc-400 italic mt-1 ml-1">{t("campaigns.characters").replace("{n}", String(form.body.length))}{form.type === "sms" ? t("campaigns.sms_count").replace("{n}", String(Math.ceil(form.body.length / 160))) : ""}</p>
                </div>

                <div>
                  <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("campaigns.form_schedule_label")}</label>
                  <div className="flex gap-3 mt-1">
                    <button onClick={() => setForm({...form, schedule: "now"})} className={cn("flex-1 py-3.5 rounded-xl font-black text-xs italic transition-all border", form.schedule === "now" ? "bg-red-600 text-white border-red-600 shadow-md" : "bg-zinc-50 text-zinc-500 border-zinc-100 hover:border-zinc-200")}>
                      <Send className="w-4 h-4 inline mr-1.5" />{t("campaigns.form_schedule_now")}
                    </button>
                    <button onClick={() => setForm({...form, schedule: "scheduled"})} className={cn("flex-1 py-3.5 rounded-xl font-black text-xs italic transition-all border", form.schedule === "scheduled" ? "bg-red-600 text-white border-red-600 shadow-md" : "bg-zinc-50 text-zinc-500 border-zinc-100 hover:border-zinc-200")}>
                      <Clock className="w-4 h-4 inline mr-1.5" />{t("campaigns.form_schedule_later")}
                    </button>
                  </div>
                  {form.schedule === "scheduled" && (
                    <input type="datetime-local" value={form.scheduledAt} onChange={e => setForm({...form, scheduledAt: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-2 text-sm" />
                  )}
                </div>

                <button onClick={save} disabled={!form.name || !form.subject || !form.body || (form.schedule === "scheduled" && !form.scheduledAt)} className="w-full py-4 md:py-5 bg-red-600 text-white rounded-2xl font-black italic text-sm md:text-base hover:bg-red-700 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2">
                  {editingCampaign ? t("campaigns.form_submit_update") : form.schedule === "scheduled" ? t("campaigns.form_submit_schedule") : t("campaigns.form_submit_draft")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
