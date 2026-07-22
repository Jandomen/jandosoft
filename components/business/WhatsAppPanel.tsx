"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  MessageSquare, Send, Phone, Check, X, Loader2, RefreshCw,
  ArrowLeft, MessageCircle, CheckCircle, XCircle, Clock,
  Plus, Trash2, ExternalLink, Users, FileText, Megaphone, BarChart3, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WhatsAppPanelProps {
  storeId: string;
}

interface WAAccount {
  _id: string;
  wabaId: string;
  phoneNumberId: string;
  phoneNumber: string;
  displayName: string;
  verifiedName: string;
  status: string;
  qualityRating: string;
  messagingLimitTier: number;
  messagesSentToday: number;
  connectedAt: string;
}

interface WATemplate {
  _id: string;
  name: string;
  category: string;
  status: string;
  language: string;
  rejectedReason?: string;
}

interface WACampaign {
  _id: string;
  name: string;
  templateName: string;
  status: string;
  recipientCount: number;
  stats: { sent: number; delivered: number; read: number; failed: number };
  scheduledAt?: string;
  sentAt?: string;
  createdAt: string;
}

interface WALimits {
  maxNumbers: number;
  maxPerDay: number;
  maxTemplates: number;
  maxCampaigns: number;
  numbersUsed: number;
  numbersRemaining: number;
}

interface WAMessage {
  _id: string;
  direction: "incoming" | "outgoing";
  from: string;
  to: string;
  body: string;
  type: string;
  status: string;
  waId: string;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-50 text-green-600",
  disconnected: "bg-zinc-100 text-zinc-400",
  pending: "bg-amber-50 text-amber-600",
  suspended: "bg-red-50 text-red-600",
  approved: "bg-green-50 text-green-600",
  rejected: "bg-red-50 text-red-600",
  draft: "bg-zinc-100 text-zinc-500",
  scheduled: "bg-blue-50 text-blue-600",
  sending: "bg-amber-50 text-amber-600",
  sent: "bg-green-50 text-green-600",
  failed: "bg-red-50 text-red-600",
  cancelled: "bg-zinc-100 text-zinc-400",
};

const STATUS_ICONS: Record<string, any> = {
  sent: <Check className="w-3 h-3 text-blue-500" />,
  delivered: <CheckCircle className="w-3 h-3 text-green-500" />,
  read: <CheckCircle className="w-3 h-3 text-blue-600" />,
  failed: <XCircle className="w-3 h-3 text-red-500" />,
  pending: <Clock className="w-3 h-3 text-zinc-400" />,
  received: <MessageCircle className="w-3 h-3 text-green-500" />,
};

type Tab = "accounts" | "templates" | "campaigns" | "messages";

export default function WhatsAppPanel({ storeId }: WhatsAppPanelProps) {
  const [tab, setTab] = useState<Tab>("accounts");
  const [accounts, setAccounts] = useState<WAAccount[]>([]);
  const [templates, setTemplates] = useState<WATemplate[]>([]);
  const [campaigns, setCampaigns] = useState<WACampaign[]>([]);
  const [messages, setMessages] = useState<WAMessage[]>([]);
  const [limits, setLimits] = useState<WALimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [showConnect, setShowConnect] = useState(false);
  const [showSend, setShowSend] = useState(false);
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<WAMessage[]>([]);

  const [connectForm, setConnectForm] = useState({ wabaId: "", phoneNumberId: "", accessToken: "", phoneNumber: "", displayName: "" });
  const [connecting, setConnecting] = useState(false);
  const [sendTo, setSendTo] = useState("");
  const [sendMsg, setSendMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const [campaignForm, setCampaignForm] = useState({ name: "", templateName: "", templateLanguage: "es", templateParams: "" });
  const [creatingCampaign, setCreatingCampaign] = useState(false);

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch(`/api/whatsapp/accounts?storeId=${storeId}`);
      const data = await res.json();
      setAccounts(data.accounts || []);
      setLimits(data.limits || null);
    } catch {}
  }, [storeId]);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch(`/api/whatsapp/templates?storeId=${storeId}`);
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch {}
  }, [storeId]);

  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await fetch(`/api/whatsapp/campaigns?storeId=${storeId}`);
      const data = await res.json();
      setCampaigns(data.campaigns || []);
    } catch {}
  }, [storeId]);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/whatsapp/messages?storeId=${storeId}&limit=50`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch {}
  }, [storeId]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchAccounts(), fetchTemplates(), fetchCampaigns(), fetchMessages()])
      .finally(() => setLoading(false));
  }, [fetchAccounts, fetchTemplates, fetchCampaigns, fetchMessages]);

  const connectAccount = async () => {
    if (!connectForm.wabaId || !connectForm.phoneNumberId || !connectForm.accessToken) return;
    setConnecting(true);
    try {
      const res = await fetch("/api/whatsapp/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, ...connectForm }),
      });
      const data = await res.json();
      if (data.success) {
        setShowConnect(false);
        setConnectForm({ wabaId: "", phoneNumberId: "", accessToken: "", phoneNumber: "", displayName: "" });
        fetchAccounts();
      }
    } catch {} finally { setConnecting(false); }
  };

  const disconnectAccount = async (accountId: string) => {
    try {
      await fetch(`/api/whatsapp/accounts?accountId=${accountId}&storeId=${storeId}`, { method: "DELETE" });
      fetchAccounts();
    } catch {}
  };

  const syncTemplates = async (accountId: string) => {
    setSyncing(true);
    try {
      await fetch("/api/whatsapp/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, accountId }),
      });
      fetchTemplates();
    } catch {} finally { setSyncing(false); }
  };

  const sendMessage = async () => {
    if (!sendTo || !sendMsg || !selectedAccount) return;
    setSending(true);
    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, accountId: selectedAccount, to: sendTo, message: sendMsg }),
      });
      const data = await res.json();
      if (data.success) {
        setSendMsg("");
        fetchMessages();
      }
    } catch {} finally { setSending(false); }
  };

  const createCampaign = async () => {
    if (!campaignForm.name || !campaignForm.templateName || !selectedAccount) return;
    setCreatingCampaign(true);
    try {
      const res = await fetch("/api/whatsapp/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId, accountId: selectedAccount,
          name: campaignForm.name, templateName: campaignForm.templateName,
          templateLanguage: campaignForm.templateLanguage,
          templateParams: campaignForm.templateParams ? campaignForm.templateParams.split(",").map(s => s.trim()) : [],
          audience: { type: "all", value: [] },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateCampaign(false);
        setCampaignForm({ name: "", templateName: "", templateLanguage: "es", templateParams: "" });
        fetchCampaigns();
      }
    } catch {} finally { setCreatingCampaign(false); }
  };

  const sendCampaign = async (campaignId: string) => {
    try {
      await fetch("/api/whatsapp/campaigns", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, campaignId, action: "send" }),
      });
      fetchCampaigns();
    } catch {}
  };

  const cancelCampaign = async (campaignId: string) => {
    try {
      await fetch("/api/whatsapp/campaigns", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, campaignId, action: "cancel" }),
      });
      fetchCampaigns();
    } catch {}
  };

  const deleteCampaign = async (campaignId: string) => {
    try {
      await fetch(`/api/whatsapp/campaigns?campaignId=${campaignId}&storeId=${storeId}`, { method: "DELETE" });
      fetchCampaigns();
    } catch {}
  };

  const getUniqueChats = () => {
    const chatMap = new Map<string, WAMessage>();
    messages.forEach(m => {
      if (!chatMap.has(m.waId) || new Date(m.createdAt) > new Date(chatMap.get(m.waId)!.createdAt)) {
        chatMap.set(m.waId, m);
      }
    });
    return Array.from(chatMap.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const openChat = (waId: string) => {
    setSelectedChat(waId);
    setChatMessages(messages.filter(m => m.waId === waId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
  };

  if (loading) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="w-6 h-6 text-zinc-400 animate-spin" /></div>;
  }

  const tabs: { id: Tab; label: string; icon: any; count?: number }[] = [
    { id: "accounts", label: "Números", icon: Phone, count: accounts.length },
    { id: "templates", label: "Plantillas", icon: FileText, count: templates.length },
    { id: "campaigns", label: "Campañas", icon: Megaphone, count: campaigns.length },
    { id: "messages", label: "Mensajes", icon: MessageSquare, count: messages.length },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-green-50 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-sm font-black italic text-zinc-950 uppercase tracking-tight">WhatsApp Business API</h3>
            <p className="text-[9px] font-bold text-zinc-400 uppercase italic">Multi-tenant · Meta Cloud API</p>
          </div>
        </div>
        {limits && (
          <div className="flex items-center gap-3 text-[9px] font-bold text-zinc-400 italic">
            <span>{limits.numbersUsed}/{limits.maxNumbers} números</span>
            <span>{limits.maxPerDay}/día</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn("flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black italic uppercase whitespace-nowrap transition-all",
              tab === t.id ? "bg-red-600 text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200")}>
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
            {t.count !== undefined && <span className="ml-0.5 opacity-70">({t.count})</span>}
          </button>
        ))}
      </div>

      {/* ACCOUNTS TAB */}
      {tab === "accounts" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-bold text-zinc-400 italic">
              {limits ? `${limits.numbersRemaining} número(s) disponible(s)` : "Conecta tu WhatsApp Business"}
            </p>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowConnect(!showConnect)}
              className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-xl text-[10px] font-black italic hover:bg-green-700 transition-all">
              <Plus className="w-3 h-3" /> Conectar número
            </motion.button>
          </div>

          {showConnect && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-zinc-100 p-4 space-y-3">
              <h4 className="text-xs font-black text-zinc-400 uppercase italic">Nueva conexión</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1">WABA ID</label>
                  <input value={connectForm.wabaId} onChange={e => setConnectForm({ ...connectForm, wabaId: e.target.value })}
                    placeholder="WhatsApp Business Account ID" className="w-full bg-zinc-50 p-2.5 rounded-xl border border-zinc-100 outline-none text-xs font-medium focus:bg-white focus:border-green-200 transition-all" />
                </div>
                <div>
                  <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1">Phone Number ID</label>
                  <input value={connectForm.phoneNumberId} onChange={e => setConnectForm({ ...connectForm, phoneNumberId: e.target.value })}
                    placeholder="123456789012345" className="w-full bg-zinc-50 p-2.5 rounded-xl border border-zinc-100 outline-none text-xs font-medium focus:bg-white focus:border-green-200 transition-all" />
                </div>
                <div>
                  <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1">Access Token</label>
                  <input type="password" value={connectForm.accessToken} onChange={e => setConnectForm({ ...connectForm, accessToken: e.target.value })}
                    placeholder="EAAx..." className="w-full bg-zinc-50 p-2.5 rounded-xl border border-zinc-100 outline-none text-xs font-medium focus:bg-white focus:border-green-200 transition-all" />
                </div>
                <div>
                  <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1">Teléfono (opcional)</label>
                  <input value={connectForm.phoneNumber} onChange={e => setConnectForm({ ...connectForm, phoneNumber: e.target.value })}
                    placeholder="+521234567890" className="w-full bg-zinc-50 p-2.5 rounded-xl border border-zinc-100 outline-none text-xs font-medium focus:bg-white focus:border-green-200 transition-all" />
                </div>
              </div>
              <div className="flex gap-2">
                <motion.button whileTap={{ scale: 0.97 }} onClick={connectAccount} disabled={connecting}
                  className="px-4 py-2.5 bg-green-600 text-white rounded-xl text-[10px] font-black italic hover:bg-green-700 transition-all disabled:opacity-50 flex items-center gap-1.5">
                  {connecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Conectar
                </motion.button>
                <button onClick={() => setShowConnect(false)} className="px-4 py-2.5 bg-zinc-100 text-zinc-500 rounded-xl text-[10px] font-black italic hover:bg-zinc-200 transition-all">
                  Cancelar
                </button>
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {accounts.map(account => (
              <div key={account._id} className="bg-white rounded-2xl border border-zinc-100 p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", STATUS_COLORS[account.status] || "bg-zinc-100")}>
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-950">{account.verifiedName || account.displayName || account.phoneNumber}</p>
                      <p className="text-[9px] text-zinc-400 font-medium">{account.phoneNumber || account.phoneNumberId}</p>
                    </div>
                  </div>
                  <span className={cn("px-2 py-0.5 rounded-full text-[8px] font-black italic uppercase", STATUS_COLORS[account.status])}>
                    {account.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[9px] font-medium text-zinc-400">
                  <span>Calidad: <span className={cn("font-bold", account.qualityRating === "green" ? "text-green-500" : account.qualityRating === "red" ? "text-red-500" : "text-zinc-500")}>{account.qualityRating}</span></span>
                  <span>Hoy: {account.messagesSentToday} msgs</span>
                  <span>Tier {account.messagingLimitTier}</span>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => { setSelectedAccount(account._id); setTab("templates"); }}
                    className="flex-1 px-2 py-1.5 bg-zinc-50 text-zinc-500 rounded-lg text-[9px] font-black italic hover:bg-zinc-100 transition-all flex items-center justify-center gap-1">
                    <FileText className="w-3 h-3" /> Plantillas
                  </button>
                  <button onClick={() => { setSelectedAccount(account._id); setShowSend(true); }}
                    className="flex-1 px-2 py-1.5 bg-green-50 text-green-600 rounded-lg text-[9px] font-black italic hover:bg-green-100 transition-all flex items-center justify-center gap-1">
                    <Send className="w-3 h-3" /> Enviar
                  </button>
                  <button onClick={() => disconnectAccount(account._id)}
                    className="px-2 py-1.5 bg-red-50 text-red-400 rounded-lg text-[9px] font-black italic hover:bg-red-100 transition-all">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
            {accounts.length === 0 && (
              <div className="col-span-full bg-white rounded-2xl border border-zinc-100 p-8 text-center">
                <MessageSquare className="w-8 h-8 text-zinc-200 mx-auto mb-3" />
                <p className="text-xs font-bold text-zinc-400 italic">No hay números conectados</p>
                <p className="text-[9px] text-zinc-300 font-medium mt-1">Conecta tu WhatsApp Business para empezar</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TEMPLATES TAB */}
      {tab === "templates" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-bold text-zinc-400 italic">Plantillas aprobadas por Meta</p>
            {selectedAccount && (
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => syncTemplates(selectedAccount)} disabled={syncing}
                className="flex items-center gap-1.5 px-3 py-2 bg-zinc-100 text-zinc-600 rounded-xl text-[10px] font-black italic hover:bg-zinc-200 transition-all disabled:opacity-50">
                {syncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Sincronizar desde Meta
              </motion.button>
            )}
          </div>

          {accounts.length > 1 && (
            <div className="flex gap-1.5 overflow-x-auto">
              {accounts.filter(a => a.status === "active").map(a => (
                <button key={a._id} onClick={() => setSelectedAccount(a._id)}
                  className={cn("px-3 py-1.5 rounded-xl text-[9px] font-black italic whitespace-nowrap transition-all",
                    selectedAccount === a._id ? "bg-green-600 text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200")}>
                  {a.verifiedName || a.phoneNumber}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-2">
            {templates.filter(t => !selectedAccount || (t as any).accountId === selectedAccount).map(template => (
              <div key={template._id} className="bg-white rounded-xl border border-zinc-100 p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-[9px] font-black",
                    template.category === "marketing" ? "bg-blue-50 text-blue-600" :
                    template.category === "utility" ? "bg-amber-50 text-amber-600" :
                    "bg-purple-50 text-purple-600")}>
                    {template.category === "marketing" ? "MKT" : template.category === "utility" ? "UTL" : "AUTH"}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-950">{template.name}</p>
                    <p className="text-[9px] text-zinc-400 font-medium">{template.language} · {template.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {template.rejectedReason && <span className="text-[8px] text-red-400 font-medium max-w-[100px] truncate">{template.rejectedReason}</span>}
                  <span className={cn("px-2 py-0.5 rounded-full text-[8px] font-black italic uppercase", STATUS_COLORS[template.status])}>
                    {template.status}
                  </span>
                </div>
              </div>
            ))}
            {templates.length === 0 && (
              <div className="bg-white rounded-2xl border border-zinc-100 p-8 text-center">
                <FileText className="w-8 h-8 text-zinc-200 mx-auto mb-3" />
                <p className="text-xs font-bold text-zinc-400 italic">No hay plantillas</p>
                <p className="text-[9px] text-zinc-300 font-medium mt-1">Crea plantillas en Meta Business Manager y sincronízalas</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CAMPAIGNS TAB */}
      {tab === "campaigns" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-bold text-zinc-400 italic">{campaigns.length} campaña(s)</p>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowCreateCampaign(!showCreateCampaign)}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black italic hover:bg-red-700 transition-all">
              <Plus className="w-3 h-3" /> Nueva campaña
            </motion.button>
          </div>

          {showCreateCampaign && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-zinc-100 p-4 space-y-3">
              <h4 className="text-xs font-black text-zinc-400 uppercase italic">Crear campaña</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input value={campaignForm.name} onChange={e => setCampaignForm({ ...campaignForm, name: e.target.value })}
                  placeholder="Nombre de campaña" className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-100 outline-none text-xs font-medium focus:bg-white focus:border-red-200 transition-all" />
                <input value={campaignForm.templateName} onChange={e => setCampaignForm({ ...campaignForm, templateName: e.target.value })}
                  placeholder="Nombre de plantilla" className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-100 outline-none text-xs font-medium focus:bg-white focus:border-red-200 transition-all" />
                <input value={campaignForm.templateLanguage} onChange={e => setCampaignForm({ ...campaignForm, templateLanguage: e.target.value })}
                  placeholder="Idioma (es)" className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-100 outline-none text-xs font-medium focus:bg-white focus:border-red-200 transition-all" />
                <input value={campaignForm.templateParams} onChange={e => setCampaignForm({ ...campaignForm, templateParams: e.target.value })}
                  placeholder="Parámetros (separados por coma)" className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-100 outline-none text-xs font-medium focus:bg-white focus:border-red-200 transition-all" />
              </div>
              <div className="flex gap-2">
                <motion.button whileTap={{ scale: 0.97 }} onClick={createCampaign} disabled={creatingCampaign}
                  className="px-4 py-2.5 bg-red-600 text-white rounded-xl text-[10px] font-black italic hover:bg-red-700 transition-all disabled:opacity-50 flex items-center gap-1.5">
                  {creatingCampaign ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} Crear
                </motion.button>
                <button onClick={() => setShowCreateCampaign(false)} className="px-4 py-2.5 bg-zinc-100 text-zinc-500 rounded-xl text-[10px] font-black italic">Cancelar</button>
              </div>
            </motion.div>
          )}

          <div className="space-y-2">
            {campaigns.map(campaign => (
              <div key={campaign._id} className="bg-white rounded-xl border border-zinc-100 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-xs font-bold text-zinc-950">{campaign.name}</p>
                    <p className="text-[9px] text-zinc-400 font-medium">Plantilla: {campaign.templateName} · {campaign.recipientCount} destinatarios</p>
                  </div>
                  <span className={cn("px-2 py-0.5 rounded-full text-[8px] font-black italic uppercase", STATUS_COLORS[campaign.status])}>
                    {campaign.status}
                  </span>
                </div>
                {campaign.status === "sent" && (
                  <div className="flex gap-3 text-[9px] font-medium text-zinc-400 mb-2">
                    <span>Enviados: {campaign.stats.sent}</span>
                    <span>Entregados: {campaign.stats.delivered}</span>
                    <span>Leídos: {campaign.stats.read}</span>
                    <span>Fallidos: {campaign.stats.failed}</span>
                  </div>
                )}
                <div className="flex gap-1.5">
                  {(campaign.status === "draft" || campaign.status === "scheduled") && (
                    <button onClick={() => sendCampaign(campaign._id)}
                      className="px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-[9px] font-black italic hover:bg-green-100 transition-all flex items-center gap-1">
                      <Send className="w-3 h-3" /> Enviar
                    </button>
                  )}
                  {campaign.status !== "sent" && campaign.status !== "failed" && campaign.status !== "cancelled" && (
                    <button onClick={() => cancelCampaign(campaign._id)}
                      className="px-3 py-1.5 bg-zinc-50 text-zinc-500 rounded-lg text-[9px] font-black italic hover:bg-zinc-100 transition-all">
                      Cancelar
                    </button>
                  )}
                  {campaign.status !== "sending" && (
                    <button onClick={() => deleteCampaign(campaign._id)}
                      className="px-3 py-1.5 bg-red-50 text-red-400 rounded-lg text-[9px] font-black italic hover:bg-red-100 transition-all">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {campaigns.length === 0 && (
              <div className="bg-white rounded-2xl border border-zinc-100 p-8 text-center">
                <Megaphone className="w-8 h-8 text-zinc-200 mx-auto mb-3" />
                <p className="text-xs font-bold text-zinc-400 italic">No hay campañas</p>
                <p className="text-[9px] text-zinc-300 font-medium mt-1">Crea campañas masivas con plantillas de WhatsApp</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MESSAGES TAB */}
      {tab === "messages" && (
        <div className="space-y-3">
          {showSend && selectedAccount && (
            <div className="bg-white rounded-2xl border border-zinc-100 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black text-zinc-400 uppercase italic">Enviar mensaje</p>
                <button onClick={() => setShowSend(false)}><X className="w-4 h-4 text-zinc-300" /></button>
              </div>
              <div className="flex gap-2">
                <input value={sendTo} onChange={e => setSendTo(e.target.value)} placeholder="Número (ej: 521234567890)"
                  className="flex-1 bg-zinc-50 p-2.5 rounded-xl border border-zinc-100 outline-none text-xs font-medium focus:bg-white focus:border-green-200 transition-all" />
                <input value={sendMsg} onChange={e => setSendMsg(e.target.value)} placeholder="Mensaje..."
                  onKeyDown={e => e.key === "Enter" && sendMessage()}
                  className="flex-[2] bg-zinc-50 p-2.5 rounded-xl border border-zinc-100 outline-none text-xs font-medium focus:bg-white focus:border-green-200 transition-all" />
                <motion.button whileTap={{ scale: 0.97 }} onClick={sendMessage} disabled={sending || !sendTo || !sendMsg}
                  className="px-4 py-2.5 bg-green-600 text-white rounded-xl text-xs font-black hover:bg-green-700 transition-all disabled:opacity-50 flex items-center gap-1.5">
                  {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                </motion.button>
              </div>
            </div>
          )}

          {selectedChat ? (
            <div className="space-y-3">
              <button onClick={() => setSelectedChat(null)} className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-red-600 transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Volver
              </button>
              <div className="bg-white rounded-2xl border border-zinc-100 p-3">
                <p className="text-xs font-black text-zinc-950 mb-3">Chat: {selectedChat}</p>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {chatMessages.map(m => (
                    <div key={m._id} className={cn("flex", m.direction === "outgoing" ? "justify-end" : "justify-start")}>
                      <div className={cn("max-w-[80%] p-2.5 rounded-2xl text-xs",
                        m.direction === "outgoing" ? "bg-green-50 text-green-900 rounded-br-none" : "bg-zinc-100 text-zinc-700 rounded-bl-none")}>
                        <p>{m.body}</p>
                        <div className="flex items-center gap-1 mt-1">
                          {STATUS_ICONS[m.status]}
                          <span className="text-[8px] opacity-60">{new Date(m.createdAt).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-[9px] font-bold text-zinc-400 italic">{messages.length} mensaje(s)</p>
                {!showSend && selectedAccount && (
                  <button onClick={() => setShowSend(true)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-xl text-[10px] font-black italic hover:bg-green-700 transition-all">
                    <Send className="w-3 h-3" /> Enviar
                  </button>
                )}
              </div>
              <div className="bg-white rounded-2xl border border-zinc-100 divide-y divide-zinc-50">
                {getUniqueChats().length === 0 ? (
                  <div className="p-8 text-center text-xs text-zinc-400 font-medium">No hay conversaciones aún</div>
                ) : (
                  getUniqueChats().map(chat => (
                    <button key={chat.waId} onClick={() => openChat(chat.waId)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-zinc-50 transition-all text-left">
                      <div className="w-9 h-9 bg-green-50 rounded-full flex items-center justify-center shrink-0">
                        <MessageSquare className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-zinc-950 truncate">{chat.waId}</p>
                        <p className="text-[9px] text-zinc-400 truncate">{chat.body}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="flex items-center gap-1">{STATUS_ICONS[chat.status]}</div>
                        <p className="text-[8px] text-zinc-300 mt-0.5">{new Date(chat.createdAt).toLocaleDateString()}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
