"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, Phone, Check, X, Loader2, ExternalLink, RefreshCw, Trash2, ArrowLeft, MessageCircle, CheckCircle, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface WhatsAppPanelProps {
  storeId: string;
}

interface WAConfig {
  phoneNumberId: string;
  accessToken: string;
  businessAccountId: string;
}

interface WAMessage {
  _id: string;
  direction: "incoming" | "outgoing";
  from: string;
  to: string;
  body: string;
  type: string;
  status: string;
  templateName?: string;
  errorMessage?: string;
  createdAt: string;
  waId: string;
}

const STATUS_ICONS: Record<string, any> = {
  sent: <Check className="w-3 h-3 text-blue-500" />,
  delivered: <CheckCircle className="w-3 h-3 text-green-500" />,
  read: <CheckCircle className="w-3 h-3 text-blue-600" />,
  failed: <XCircle className="w-3 h-3 text-red-500" />,
  pending: <Clock className="w-3 h-3 text-zinc-400" />,
  received: <MessageCircle className="w-3 h-3 text-green-500" />,
};

export default function WhatsAppPanel({ storeId }: WhatsAppPanelProps) {
  const [config, setConfig] = useState<WAConfig>({ phoneNumberId: "", accessToken: "", businessAccountId: "" });
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [messages, setMessages] = useState<WAMessage[]>([]);
  const [view, setView] = useState<"config" | "messages">("config");
  const [sendTo, setSendTo] = useState("");
  const [sendMsg, setSendMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<WAMessage[]>([]);

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/integrations?storeId=${storeId}`);
      const data = await res.json();
      const wa = data.integrations?.find((i: any) => i.platform === "whatsapp_business");
      if (wa?.credentials) {
        setConfig({
          phoneNumberId: wa.credentials.phoneNumberId || "",
          accessToken: wa.credentials.accessToken || "",
          businessAccountId: wa.credentials.businessAccountId || "",
        });
        setConnected(wa.enabled);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, [storeId]);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/whatsapp/messages?storeId=${storeId}&limit=50`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch {}
  }, [storeId]);

  useEffect(() => { fetchConfig(); fetchMessages(); }, [fetchConfig, fetchMessages]);

  const saveConfig = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, platform: "whatsapp_business", credentials: config, enabled: true }),
      });
      const data = await res.json();
      if (data.success !== false) {
        setConnected(true);
        setTestResult({ ok: true, msg: "Configuración guardada" });
      }
    } catch { setTestResult({ ok: false, msg: "Error al guardar" }); }
    finally { setSaving(false); }
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/integrations/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: "whatsapp_business", credentials: config }),
      });
      const data = await res.json();
      setTestResult({ ok: data.success, msg: data.success ? "Conexión exitosa" : data.error || "Error al conectar" });
    } catch { setTestResult({ ok: false, msg: "Error de conexión" }); }
    finally { setTesting(false); }
  };

  const disconnect = async () => {
    try {
      await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, platform: "whatsapp_business", credentials: config, enabled: false }),
      });
      setConnected(false);
    } catch {}
  };

  const sendMessage = async () => {
    if (!sendTo || !sendMsg) return;
    setSending(true);
    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, to: sendTo, message: sendMsg }),
      });
      const data = await res.json();
      if (data.success) {
        setSendMsg("");
        fetchMessages();
      }
    } catch {} finally { setSending(false); }
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
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-6 h-6 text-zinc-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center", connected ? "bg-green-50 text-green-600" : "bg-zinc-100 text-zinc-400")}>
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black italic text-zinc-950 uppercase tracking-tight">WhatsApp Business API</h3>
            <p className="text-[9px] font-bold text-zinc-400 uppercase italic">
              {connected ? "Conectado" : "Sin conectar"} · Meta Cloud API
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setView("config"); setSelectedChat(null); }}
            className={cn("px-3 py-1.5 rounded-xl text-[9px] font-black uppercase italic transition-all", view === "config" ? "bg-red-600 text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200")}>
            Config
          </button>
          <button onClick={() => { setView("messages"); fetchMessages(); }}
            className={cn("px-3 py-1.5 rounded-xl text-[9px] font-black uppercase italic transition-all", view === "messages" ? "bg-red-600 text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200")}>
            Mensajes ({messages.length})
          </button>
        </div>
      </div>

      {/* Config View */}
      {view === "config" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-zinc-100 p-4 md:p-6 space-y-4">
            <h4 className="text-xs font-black text-zinc-400 uppercase italic">Credenciales de Meta</h4>
            <div className="space-y-3">
              <div>
                <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1">Phone Number ID</label>
                <input value={config.phoneNumberId} onChange={e => setConfig({ ...config, phoneNumberId: e.target.value })}
                  placeholder="123456789012345"
                  className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-red-200 transition-all" />
              </div>
              <div>
                <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1">Access Token (permanente)</label>
                <input type="password" value={config.accessToken} onChange={e => setConfig({ ...config, accessToken: e.target.value })}
                  placeholder="EAAx..."
                  className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-red-200 transition-all" />
              </div>
              <div>
                <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1">WhatsApp Business Account ID</label>
                <input value={config.businessAccountId} onChange={e => setConfig({ ...config, businessAccountId: e.target.value })}
                  placeholder="123456789012345"
                  className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-red-200 transition-all" />
              </div>
            </div>
          </div>

          {testResult && (
            <div className={cn("p-3 rounded-xl text-xs font-bold", testResult.ok ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200")}>
              {testResult.msg}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <motion.button whileTap={{ scale: 0.97 }} onClick={saveConfig} disabled={saving || !config.phoneNumberId || !config.accessToken}
              className="px-5 py-3 bg-red-600 text-white rounded-xl text-xs font-black italic hover:bg-red-700 transition-all shadow-lg disabled:opacity-50 flex items-center gap-2">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Guardar
            </motion.button>
            <motion.button whileTap={{ scale: 0.97 }} onClick={testConnection} disabled={testing || !config.phoneNumberId || !config.accessToken}
              className="px-5 py-3 bg-zinc-100 text-zinc-700 rounded-xl text-xs font-black italic hover:bg-zinc-200 transition-all flex items-center gap-2">
              {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Probar conexión
            </motion.button>
            {connected && (
              <motion.button whileTap={{ scale: 0.97 }} onClick={disconnect}
                className="px-5 py-3 bg-zinc-100 text-red-600 rounded-xl text-xs font-black italic hover:bg-red-50 transition-all flex items-center gap-2">
                <X className="w-3.5 h-3.5" /> Desconectar
              </motion.button>
            )}
          </div>

          <div className="bg-zinc-50 rounded-xl p-4 text-[9px] text-zinc-400 font-medium space-y-1">
            <p className="font-black uppercase italic text-zinc-500">Cómo configurar:</p>
            <p>1. Ve a <a href="https://developers.facebook.com" target="_blank" className="text-red-500 underline">developers.facebook.com</a></p>
            <p>2. Crea una App → WhatsApp → Obtén credenciales</p>
            <p>3. Configura el webhook con URL: <code className="bg-zinc-200 px-1 rounded text-zinc-600">{typeof window !== "undefined" ? window.location.origin : ""}/api/whatsapp/webhook</code></p>
            <p>4. Token de verificación: <code className="bg-zinc-200 px-1 rounded text-zinc-600">jandosoft-wa-verify-2026</code></p>
            <p>5. Suscríbete a: messages, message_template_status_update</p>
          </div>
        </div>
      )}

      {/* Messages View */}
      {view === "messages" && (
        <div className="space-y-4">
          {/* Send message */}
          <div className="bg-white rounded-2xl border border-zinc-100 p-4 space-y-3">
            <h4 className="text-xs font-black text-zinc-400 uppercase italic">Enviar mensaje</h4>
            <div className="flex gap-2">
              <input value={sendTo} onChange={e => setSendTo(e.target.value)} placeholder="Número (ej: 521234567890)"
                className="flex-1 bg-zinc-50 p-2.5 rounded-xl border border-zinc-100 outline-none text-xs font-medium focus:bg-white focus:border-red-200 transition-all" />
              <input value={sendMsg} onChange={e => setSendMsg(e.target.value)} placeholder="Mensaje..."
                onKeyDown={e => e.key === "Enter" && sendMessage()}
                className="flex-[2] bg-zinc-50 p-2.5 rounded-xl border border-zinc-100 outline-none text-xs font-medium focus:bg-white focus:border-red-200 transition-all" />
              <motion.button whileTap={{ scale: 0.97 }} onClick={sendMessage} disabled={sending || !sendTo || !sendMsg}
                className="px-4 py-2.5 bg-green-600 text-white rounded-xl text-xs font-black hover:bg-green-700 transition-all disabled:opacity-50 flex items-center gap-1.5">
                {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                Enviar
              </motion.button>
            </div>
          </div>

          {selectedChat ? (
            /* Chat view */
            <div className="space-y-3">
              <button onClick={() => setSelectedChat(null)} className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-red-600 transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Volver
              </button>
              <div className="bg-white rounded-2xl border border-zinc-100 p-3">
                <p className="text-xs font-black text-zinc-950 mb-3">Chat: {selectedChat}</p>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {chatMessages.map(m => (
                    <div key={m._id} className={cn("flex", m.direction === "outgoing" ? "justify-end" : "justify-start")}>
                      <div className={cn("max-w-[80%] p-2.5 rounded-2xl text-xs", m.direction === "outgoing" ? "bg-green-50 text-green-900 rounded-br-none" : "bg-zinc-100 text-zinc-700 rounded-bl-none")}>
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
            /* Chat list */
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
          )}
        </div>
      )}
    </div>
  );
}
