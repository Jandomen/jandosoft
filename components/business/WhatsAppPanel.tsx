"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  MessageSquare, Send, Phone, Check, X, Loader2, RefreshCw,
  ArrowLeft, MessageCircle, CheckCircle, XCircle, Clock,
  Plus, Users, Search, Bot, UserCheck, Eye, EyeOff,
  MoreVertical, Archive, RotateCcw, Settings, Hash
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WhatsAppPanelProps {
  storeId: string;
}

interface WAConversation {
  _id: string;
  waId: string;
  customerName: string;
  customerPhone: string;
  customerId?: string;
  status: string;
  assignedTo?: string;
  assignedToName?: string;
  lastMessageAt: string;
  lastMessagePreview: string;
  unreadCount: number;
  aiAutoReply: boolean;
  tags: string[];
  notes: string;
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
  conversationId?: string;
}

interface WAAccount {
  _id: string;
  phoneNumber: string;
  verifiedName: string;
  status: string;
}

interface WAStats {
  open: number;
  pending: number;
  closed: number;
  total: number;
}

const STATUS_COLORS: Record<string, string> = {
  open: "bg-green-50 text-green-600",
  pending: "bg-amber-50 text-amber-600",
  closed: "bg-zinc-100 text-zinc-400",
  active: "bg-green-50 text-green-600",
  disconnected: "bg-zinc-100 text-zinc-400",
};

const STATUS_ICONS: Record<string, any> = {
  sent: <Check className="w-3 h-3 text-blue-500" />,
  delivered: <CheckCircle className="w-3 h-3 text-green-500" />,
  read: <CheckCircle className="w-3 h-3 text-blue-600" />,
  failed: <XCircle className="w-3 h-3 text-red-500" />,
  pending: <Clock className="w-3 h-3 text-zinc-400" />,
  received: <MessageCircle className="w-3 h-3 text-green-500" />,
};

type InboxFilter = "all" | "open" | "pending" | "closed" | "unassigned";

export default function WhatsAppPanel({ storeId }: WhatsAppPanelProps) {
  const [conversations, setConversations] = useState<WAConversation[]>([]);
  const [stats, setStats] = useState<WAStats | null>(null);
  const [accounts, setAccounts] = useState<WAAccount[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<WAConversation | null>(null);
  const [chatMessages, setChatMessages] = useState<WAMessage[]>([]);
  const [filter, setFilter] = useState<InboxFilter>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendMsg, setSendMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [showConnect, setShowConnect] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [sendingAccountId, setSendingAccountId] = useState<string | null>(null);
  const [connectForm, setConnectForm] = useState({ wabaId: "", phoneNumberId: "", accessToken: "", phoneNumber: "", displayName: "" });
  const [connecting, setConnecting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const params = new URLSearchParams({ storeId });
      if (filter === "unassigned") params.set("assignedTo", "unassigned");
      else if (filter !== "all") params.set("status", filter);
      if (search) params.set("search", search);
      if (selectedAccountId) params.set("accountId", selectedAccountId);

      const res = await fetch(`/api/whatsapp/conversations?${params}`);
      const data = await res.json();
      setConversations(data.conversations || []);
      setStats(data.stats || null);
    } catch {}
  }, [storeId, filter, search, selectedAccountId]);

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch(`/api/whatsapp/accounts?storeId=${storeId}`);
      const data = await res.json();
      setAccounts(data.accounts || []);
    } catch {}
  }, [storeId]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchConversations(), fetchAccounts()]).finally(() => setLoading(false));
  }, [fetchConversations, fetchAccounts]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!selectedConversation) fetchConversations();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchConversations, selectedConversation]);

  const fetchChatMessages = async (conversationId: string) => {
    try {
      const res = await fetch(`/api/whatsapp/messages?storeId=${storeId}&conversationId=${conversationId}&limit=100`);
      const data = await res.json();
      setChatMessages((data.messages || []).reverse());

      await fetch(`/api/whatsapp/conversations`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, conversationId, action: "markRead" }),
      });
    } catch {}
  };

  const openConversation = async (conv: WAConversation) => {
    setSelectedConversation(conv);
    await fetchChatMessages(conv._id);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const sendMessage = async () => {
    if (!sendMsg || !selectedConversation || !sendingAccountId) return;
    setSending(true);
    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId, accountId: sendingAccountId,
          to: selectedConversation.customerPhone || selectedConversation.waId,
          message: sendMsg,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSendMsg("");
        await fetchChatMessages(selectedConversation._id);
        fetchConversations();
      }
    } catch {} finally { setSending(false); }
  };

  const updateConversation = async (conversationId: string, action: string, extra?: any) => {
    try {
      await fetch("/api/whatsapp/conversations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, conversationId, action, ...extra }),
      });
      fetchConversations();
      if (selectedConversation?._id === conversationId && (action === "close" || action === "reopen")) {
        setSelectedConversation(null);
        setChatMessages([]);
      }
    } catch {}
  };

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

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "ahora";
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  if (loading) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="w-6 h-6 text-zinc-400 animate-spin" /></div>;
  }

  if (selectedConversation) {
    const activeAccount = accounts.find(a => a.status === "active");
    return (
      <div className="flex flex-col h-[600px]">
        <div className="flex items-center justify-between p-3 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <button onClick={() => { setSelectedConversation(null); setChatMessages([]); }}
              className="p-1.5 hover:bg-zinc-100 rounded-lg transition-colors">
              <ArrowLeft className="w-4 h-4 text-zinc-500" />
            </button>
            <div className="w-9 h-9 bg-green-50 rounded-full flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-950">{selectedConversation.customerName || selectedConversation.waId}</p>
              <div className="flex items-center gap-2">
                <span className={cn("px-1.5 py-0.5 rounded-full text-[8px] font-black italic uppercase", STATUS_COLORS[selectedConversation.status])}>
                  {selectedConversation.status}
                </span>
                {selectedConversation.assignedToName && (
                  <span className="text-[9px] text-zinc-400 font-medium">{selectedConversation.assignedToName}</span>
                )}
                {selectedConversation.aiAutoReply && (
                  <span className="flex items-center gap-0.5 text-[9px] text-blue-500 font-bold"><Bot className="w-3 h-3" /> IA</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {selectedConversation.status !== "closed" ? (
              <button onClick={() => updateConversation(selectedConversation._id, "close")}
                className="p-1.5 hover:bg-zinc-100 rounded-lg transition-colors" title="Cerrar">
                <Archive className="w-4 h-4 text-zinc-400" />
              </button>
            ) : (
              <button onClick={() => updateConversation(selectedConversation._id, "reopen")}
                className="p-1.5 hover:bg-zinc-100 rounded-lg transition-colors" title="Reabrir">
                <RotateCcw className="w-4 h-4 text-zinc-400" />
              </button>
            )}
            <button onClick={() => updateConversation(selectedConversation._id, selectedConversation.aiAutoReply ? "update" : "update",
              { aiAutoReply: !selectedConversation.aiAutoReply })}
              className={cn("p-1.5 rounded-lg transition-colors",
                selectedConversation.aiAutoReply ? "bg-blue-50 hover:bg-blue-100" : "hover:bg-zinc-100")}
              title={selectedConversation.aiAutoReply ? "Desactivar IA" : "Activar IA"}>
              <Bot className={cn("w-4 h-4", selectedConversation.aiAutoReply ? "text-blue-500" : "text-zinc-400")} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-50">
          {chatMessages.map(msg => (
            <div key={msg._id} className={cn("flex", msg.direction === "outgoing" ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[80%] p-3 rounded-2xl text-xs",
                msg.direction === "outgoing" ? "bg-green-500 text-white rounded-br-none" : "bg-white text-zinc-700 rounded-bl-none border border-zinc-100")}>
                <p className="whitespace-pre-wrap">{msg.body}</p>
                <div className={cn("flex items-center gap-1 mt-1", msg.direction === "outgoing" ? "justify-end" : "")}>
                  {msg.direction === "outgoing" && STATUS_ICONS[msg.status]}
                  <span className={cn("text-[8px]", msg.direction === "outgoing" ? "text-green-100" : "text-zinc-300")}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div className="p-3 border-t border-zinc-100 bg-white">
          {activeAccount && accounts.length > 1 && (
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-[9px] font-bold text-zinc-400 italic">Enviar desde:</span>
              {accounts.filter(a => a.status === "active").map(a => (
                <button key={a._id} onClick={() => setSendingAccountId(a._id)}
                  className={cn("px-2 py-0.5 rounded-full text-[8px] font-black italic transition-all",
                    sendingAccountId === a._id ? "bg-green-600 text-white" : "bg-zinc-100 text-zinc-500")}>
                  {a.verifiedName || a.phoneNumber}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input value={sendMsg} onChange={e => setSendMsg(e.target.value)}
              placeholder={selectedConversation.status === "closed" ? "Conversacion cerrada..." : "Escribe un mensaje..."}
              disabled={selectedConversation.status === "closed" || !activeAccount}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
              className="flex-1 bg-zinc-50 px-4 py-2.5 rounded-xl border border-zinc-100 outline-none text-xs font-medium focus:bg-white focus:border-green-200 transition-all disabled:opacity-50" />
            <motion.button whileTap={{ scale: 0.97 }} onClick={sendMessage}
              disabled={sending || !sendMsg || selectedConversation.status === "closed" || !activeAccount}
              className="px-4 py-2.5 bg-green-500 text-white rounded-xl text-xs font-black hover:bg-green-600 transition-all disabled:opacity-50 flex items-center gap-1.5">
              {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </motion.button>
          </div>
          {!activeAccount && (
            <p className="text-[9px] text-amber-500 font-medium mt-1.5">Conecta un numero de WhatsApp para enviar mensajes</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-green-50 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-sm font-black italic text-zinc-950 uppercase tracking-tight">Bandeja de WhatsApp</h3>
            <p className="text-[9px] font-bold text-zinc-400 uppercase italic">Atencion al cliente</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-zinc-100 rounded-xl transition-colors">
            <Settings className="w-4 h-4 text-zinc-400" />
          </button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowConnect(!showConnect)}
            className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-xl text-[10px] font-black italic hover:bg-green-700 transition-all">
            <Plus className="w-3 h-3" /> Conectar
          </motion.button>
        </div>
      </div>

      {stats && (
        <div className="flex gap-2">
          {(["open", "pending", "closed", "all"] as InboxFilter[]).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn("px-3 py-1.5 rounded-xl text-[10px] font-black italic uppercase transition-all",
                filter === f ? "bg-red-600 text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200")}>
              {f === "open" && `Abiertas (${stats.open})`}
              {f === "pending" && `Pendientes (${stats.pending})`}
              {f === "closed" && `Cerradas (${stats.closed})`}
              {f === "all" && `Todas (${stats.total})`}
            </button>
          ))}
          <button onClick={() => setFilter("unassigned")}
            className={cn("px-3 py-1.5 rounded-xl text-[10px] font-black italic uppercase transition-all",
              filter === "unassigned" ? "bg-orange-500 text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200")}>
            <UserCheck className="w-3 h-3 inline mr-1" /> Sin asignar
          </button>
        </div>
      )}

      {showConnect && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-zinc-100 p-4 space-y-3">
          <h4 className="text-xs font-black text-zinc-400 uppercase italic">Conectar numero</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={connectForm.wabaId} onChange={e => setConnectForm({ ...connectForm, wabaId: e.target.value })}
              placeholder="WABA ID" className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-100 outline-none text-xs font-medium focus:bg-white focus:border-green-200 transition-all" />
            <input value={connectForm.phoneNumberId} onChange={e => setConnectForm({ ...connectForm, phoneNumberId: e.target.value })}
              placeholder="Phone Number ID" className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-100 outline-none text-xs font-medium focus:bg-white focus:border-green-200 transition-all" />
            <input type="password" value={connectForm.accessToken} onChange={e => setConnectForm({ ...connectForm, accessToken: e.target.value })}
              placeholder="Access Token" className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-100 outline-none text-xs font-medium focus:bg-white focus:border-green-200 transition-all" />
            <input value={connectForm.phoneNumber} onChange={e => setConnectForm({ ...connectForm, phoneNumber: e.target.value })}
              placeholder="Telefono (ej: +521234567890)" className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-100 outline-none text-xs font-medium focus:bg-white focus:border-green-200 transition-all" />
            <input value={connectForm.displayName} onChange={e => setConnectForm({ ...connectForm, displayName: e.target.value })}
              placeholder="Nombre visible (opcional)" className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-100 outline-none text-xs font-medium focus:bg-white focus:border-green-200 transition-all" />
          </div>
          <div className="flex gap-2">
            <motion.button whileTap={{ scale: 0.97 }} onClick={connectAccount} disabled={connecting}
              className="px-4 py-2 bg-green-600 text-white rounded-xl text-[10px] font-black italic hover:bg-green-700 transition-all disabled:opacity-50 flex items-center gap-1.5">
              {connecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Conectar
            </motion.button>
            <button onClick={() => setShowConnect(false)} className="px-4 py-2 bg-zinc-100 text-zinc-500 rounded-xl text-[10px] font-black italic">Cancelar</button>
          </div>
        </motion.div>
      )}

      {showSettings && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-zinc-100 p-4 space-y-3">
          <h4 className="text-xs font-black text-zinc-400 uppercase italic">Cuentas conectadas</h4>
          <div className="space-y-2">
            {accounts.map(account => (
              <div key={account._id} className="flex items-center justify-between p-2 bg-zinc-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className={cn("w-7 h-7 rounded-full flex items-center justify-center", STATUS_COLORS[account.status])}>
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-zinc-950">{account.verifiedName || account.phoneNumber}</p>
                    <p className="text-[8px] text-zinc-400 font-medium">{account.phoneNumber}</p>
                  </div>
                </div>
                <span className={cn("px-2 py-0.5 rounded-full text-[8px] font-black italic uppercase", STATUS_COLORS[account.status])}>
                  {account.status}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre o telefono..."
          className="w-full bg-zinc-50 pl-10 pr-4 py-2.5 rounded-xl border border-zinc-100 outline-none font-medium text-xs focus:bg-white focus:border-red-200 transition-all" />
      </div>

      <div className="space-y-1.5">
        {conversations.length === 0 ? (
          <div className="bg-white rounded-2xl border border-zinc-100 p-8 text-center">
            <MessageSquare className="w-8 h-8 text-zinc-200 mx-auto mb-3" />
            <p className="text-xs font-bold text-zinc-400 italic">No hay conversaciones</p>
            <p className="text-[9px] text-zinc-300 font-medium mt-1">Las conversaciones apareceran cuando los clientes te escriban</p>
          </div>
        ) : (
          conversations.map(conv => (
            <motion.button key={conv._id} whileTap={{ scale: 0.99 }}
              onClick={() => openConversation(conv)}
              className="w-full flex items-center gap-3 p-3 bg-white rounded-xl border border-zinc-100 hover:shadow-sm transition-all text-left">
              <div className="relative">
                <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center shrink-0">
                  <MessageSquare className="w-5 h-5 text-green-600" />
                </div>
                {conv.unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[8px] font-black flex items-center justify-center">
                    {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <p className={cn("text-xs truncate", conv.unreadCount > 0 ? "font-black text-zinc-950" : "font-bold text-zinc-700")}>
                    {conv.customerName || conv.waId}
                  </p>
                  <span className="text-[8px] text-zinc-300 font-medium shrink-0 ml-2">{timeAgo(conv.lastMessageAt)}</span>
                </div>
                <p className={cn("text-[10px] truncate", conv.unreadCount > 0 ? "font-bold text-zinc-600" : "text-zinc-400 font-medium")}>
                  {conv.lastMessagePreview || "Sin mensajes"}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={cn("px-1.5 py-0.5 rounded-full text-[7px] font-black italic uppercase", STATUS_COLORS[conv.status])}>
                    {conv.status}
                  </span>
                  {conv.assignedToName && (
                    <span className="text-[8px] text-zinc-300 font-medium flex items-center gap-0.5">
                      <UserCheck className="w-2.5 h-2.5" /> {conv.assignedToName}
                    </span>
                  )}
                  {conv.aiAutoReply && (
                    <span className="text-[8px] text-blue-400 font-bold flex items-center gap-0.5">
                      <Bot className="w-2.5 h-2.5" /> IA
                    </span>
                  )}
                </div>
              </div>
            </motion.button>
          ))
        )}
      </div>
    </div>
  );
}
