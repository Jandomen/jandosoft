"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Mail, MessageSquare, MessageCircle, Send, Loader2, Clock, CheckCircle2, XCircle, User, Search, Phone } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";

interface CustomerData {
  _id: string;
  name: string;
  email: string;
  phone: string;
}

interface CommunicationData {
  _id: string;
  customerId: string;
  type: "email" | "sms" | "whatsapp";
  direction: "sent" | "received";
  subject: string;
  body: string;
  to: string;
  status: "sent" | "failed" | "draft";
  createdAt: string;
}

type CommsTab = "email" | "sms" | "whatsapp";

const TABS: { id: CommsTab; label: string; icon: any; color: string }[] = [
  { id: "email", label: "Correo", icon: Mail, color: "red" },
  { id: "sms", label: "SMS", icon: Phone, color: "blue" },
  { id: "whatsapp", label: "WhatsApp", icon: SiWhatsapp, color: "green" },
];

const TAB_FIELDS: Record<CommsTab, { needsSubject: boolean; inputLabel: string; inputPlaceholder: string; recipientLabel: string; recipientPlaceholder: string }> = {
  email: { needsSubject: true, inputLabel: "Asunto", inputPlaceholder: "Asunto...", recipientLabel: "Correo electrónico", recipientPlaceholder: "tu@email.com" },
  sms: { needsSubject: false, inputLabel: "Mensaje", inputPlaceholder: "Escribe tu mensaje SMS...", recipientLabel: "Número de teléfono", recipientPlaceholder: "+52 123 456 7890" },
  whatsapp: { needsSubject: false, inputLabel: "Mensaje", inputPlaceholder: "Escribe tu mensaje de WhatsApp...", recipientLabel: "Número de teléfono", recipientPlaceholder: "+52 123 456 7890" },
};

export default function CommunicationsPanel({ storeId }: { storeId: string }) {
  const [tab, setTab] = useState<CommsTab>("email");
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [communications, setCommunications] = useState<CommunicationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [filterCustomerId, setFilterCustomerId] = useState("");

  const loadCustomers = useCallback(async () => {
    try {
      const res = await fetch(`/api/customers?storeId=${storeId}`);
      const data = await res.json();
      setCustomers(data.customers || []);
    } catch {}
  }, [storeId]);

  const loadComms = useCallback(async () => {
    try {
      setLoading(true);
      let url = `/api/communications?storeId=${storeId}&type=${tab}`;
      if (filterCustomerId) url += `&customerId=${filterCustomerId}`;
      const res = await fetch(url);
      const data = await res.json();
      setCommunications(data.communications || []);
    } catch {
      setCommunications([]);
    } finally {
      setLoading(false);
    }
  }, [storeId, tab, filterCustomerId]);

  useEffect(() => { loadCustomers(); }, [loadCustomers]);
  useEffect(() => { loadComms(); }, [loadComms]);

  useEffect(() => { setError(""); }, [tab]);

  const selectedCustomer = customers.find(c => c._id === selectedCustomerId);
  const tabConfig = TAB_FIELDS[tab];

  const handleSend = async () => {
    if (!selectedCustomerId || !body.trim()) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/communications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId,
          customerId: selectedCustomerId,
          type: tab,
          subject: tab === "email" ? subject : "",
          body,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al enviar");
        return;
      }
      setSubject("");
      setBody("");
      setSelectedCustomerId("");
      setCustomerSearch("");
      loadComms();
    } catch {
      setError("Error de conexión");
    }
    setSending(false);
  };

  const filteredCustomers = customers.filter(c =>
    !customerSearch ||
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.email.toLowerCase().includes(customerSearch.toLowerCase()) ||
    (c.phone && c.phone.includes(customerSearch))
  );

  const statusIcon = (s: string) => {
    switch (s) {
      case "sent": return <CheckCircle2 className="w-3 h-3 text-emerald-500" />;
      case "failed": return <XCircle className="w-3 h-3 text-red-500" />;
      default: return <Clock className="w-3 h-3 text-zinc-400" />;
    }
  };

  const typeIcon = (t: string) => {
    switch (t) {
      case "sms": return <Phone className="w-3 h-3 text-blue-500" />;
      case "whatsapp": return <SiWhatsapp className="w-3 h-3 text-green-500" />;
      default: return <Mail className="w-3 h-3 text-red-500" />;
    }
  };

  const recipientValue = selectedCustomer
    ? (tab === "email" ? selectedCustomer.email : selectedCustomer.phone)
    : "";

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center gap-3 md:gap-4 flex-wrap">
        <div>
          <h3 className="max-[400px]:text-xl text-2xl font-black italic text-zinc-950 uppercase tracking-tighter">
            Comunicaciones
          </h3>
          <p className="text-[8px] font-wallpoet tracking-[0.2em] text-red-600 uppercase">JANDOSOFT</p>
        </div>
        <div className="flex gap-1 ml-auto">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={cn("flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black italic transition-all",
                  tab === t.id ? "bg-red-600 text-white shadow-md" : "bg-zinc-50 text-zinc-500 hover:bg-zinc-100"
                )}>
                <Icon className="w-3 h-3" /> {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-white rounded-2xl border border-zinc-100 p-4 md:p-5 space-y-4 shadow-sm">
          <h4 className="text-[10px] font-black italic text-zinc-500 uppercase tracking-wider flex items-center gap-2">
            {React.createElement(TABS.find(t => t.id === tab)!.icon, { className: "w-3.5 h-3.5 text-red-500" })}
            Nuevo {tabConfig.inputLabel}
          </h4>

          <div className="relative">
            <input type="text" placeholder="Buscar cliente..."
              value={customerSearch} onChange={e => { setCustomerSearch(e.target.value); setSelectedCustomerId(""); }}
              className="w-full bg-zinc-50 pl-9 pr-4 py-2.5 rounded-xl border border-zinc-100 outline-none text-xs font-medium focus:bg-white focus:border-red-200 transition-all" />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-300" />
          </div>

          <div className="max-h-[140px] overflow-y-auto space-y-1 -mx-1 px-1">
            {filteredCustomers.length === 0 ? (
              <p className="text-[10px] text-zinc-400 italic text-center py-4">No hay clientes</p>
            ) : filteredCustomers.map(c => {
              const hasPhone = !!c.phone;
              const hasEmail = !!c.email;
              const available = tab === "email" ? hasEmail : hasPhone;
              return (
                <button key={c._id}
                  onClick={() => { if (available) { setSelectedCustomerId(c._id); setCustomerSearch(c.name); } }}
                  disabled={!available}
                  className={cn("w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all",
                    !available && "opacity-40 cursor-not-allowed",
                    selectedCustomerId === c._id ? "bg-red-50 text-red-700" : "text-zinc-600 hover:bg-zinc-50"
                  )}>
                  <User className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{c.name}</span>
                  <span className="text-[9px] text-zinc-400 ml-auto truncate hidden sm:block">
                    {tab === "email" ? (c.email || "—") : (c.phone || "—")}
                  </span>
                </button>
              );
            })}
          </div>

          {selectedCustomer && (
            <div className="flex items-center gap-2 p-2.5 bg-emerald-50 rounded-xl text-[10px] font-medium text-emerald-700">
              <CheckCircle2 className="w-3 h-3 shrink-0" />
              Enviando a: <strong>{selectedCustomer.name}</strong> ({recipientValue})
            </div>
          )}

          {error && (
            <div className="p-2.5 bg-red-50 rounded-xl text-[10px] font-medium text-red-600 border border-red-100">
              {error}
            </div>
          )}

          {tabConfig.needsSubject && (
            <input type="text" placeholder={tabConfig.inputPlaceholder} value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full bg-zinc-50 px-4 py-2.5 rounded-xl border border-zinc-100 outline-none text-xs font-medium focus:bg-white focus:border-red-200 transition-all" />
          )}

          <textarea placeholder={tabConfig.needsSubject ? "Escribe el mensaje..." : tabConfig.inputPlaceholder} value={body}
            onChange={e => setBody(e.target.value)} rows={5}
            className="w-full bg-zinc-50 px-4 py-3 rounded-xl border border-zinc-100 outline-none text-xs font-medium focus:bg-white focus:border-red-200 transition-all resize-none" />

          <motion.button whileTap={{ scale: 0.95 }} onClick={handleSend}
            disabled={sending || !selectedCustomerId || !body.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 text-white rounded-xl text-xs font-black italic hover:bg-red-700 transition-all shadow-lg shadow-red-100 disabled:opacity-50">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {sending ? "Enviando..." : `Enviar ${tabConfig.inputLabel}`}
          </motion.button>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-100 p-4 md:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-[10px] font-black italic text-zinc-500 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-zinc-400" /> Historial
            </h4>
            <select value={filterCustomerId} onChange={e => setFilterCustomerId(e.target.value)}
              className="text-[9px] font-medium bg-zinc-50 border border-zinc-100 rounded-lg px-2 py-1 outline-none">
              <option value="">Todos los clientes</option>
              {customers.map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2 max-h-[360px] overflow-y-auto -mx-1 px-1">
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-zinc-300" /></div>
            ) : communications.length === 0 ? (
              <p className="text-[10px] text-zinc-400 italic text-center py-8">Sin comunicaciones aún</p>
            ) : communications.map(comm => (
              <div key={comm._id} className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {statusIcon(comm.status)}
                    {typeIcon(comm.type)}
                    <span className="text-[10px] font-black italic text-zinc-700 truncate">
                      {comm.type === "email" ? (comm.subject || "(sin asunto)") : comm.to || comm.type.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-[8px] text-zinc-400 shrink-0">
                    {new Date(comm.createdAt).toLocaleDateString("es", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 line-clamp-2">{comm.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
