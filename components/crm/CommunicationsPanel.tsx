"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Mail, Send, Loader2, Clock, CheckCircle2, XCircle, User, Search } from "lucide-react";

interface CustomerData {
  _id: string;
  name: string;
  email: string;
  phone: string;
}

interface CommunicationData {
  _id: string;
  customerId: string;
  type: "email";
  direction: "sent" | "received";
  subject: string;
  body: string;
  status: "sent" | "failed" | "draft";
  createdAt: string;
}

type CommsTab = "email";

export default function CommunicationsPanel({ storeId }: { storeId: string }) {
  const [tab, setTab] = useState<CommsTab>("email");
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [communications, setCommunications] = useState<CommunicationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

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

  const selectedCustomer = customers.find(c => c._id === selectedCustomerId);

  const handleSend = async () => {
    if (!selectedCustomerId || !body.trim()) return;
    setSending(true);
    try {
      await fetch("/api/communications", {
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
      setSubject("");
      setBody("");
      loadComms();
    } catch {}
    setSending(false);
  };

  const filteredCustomers = customers.filter(c =>
    !customerSearch ||
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.email.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const statusIcon = (s: string) => {
    switch (s) {
      case "sent": return <CheckCircle2 className="w-3 h-3 text-emerald-500" />;
      case "failed": return <XCircle className="w-3 h-3 text-red-500" />;
      default: return <Clock className="w-3 h-3 text-zinc-400" />;
    }
  };

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
          <button onClick={() => setTab("email")}
            className={cn("flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black italic transition-all",
              tab === "email" ? "bg-red-600 text-white shadow-md" : "bg-zinc-50 text-zinc-500 hover:bg-zinc-100"
            )}>
            <Mail className="w-3 h-3" /> Correo
          </button>
        </div>
      </div>

      {tab === "email" && (
        <>
          <div className="grid md:grid-cols-2 gap-4 md:gap-6">
            <div className="bg-white rounded-2xl border border-zinc-100 p-4 md:p-5 space-y-4 shadow-sm">
              <h4 className="text-[10px] font-black italic text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-red-500" /> Nuevo Correo
              </h4>
              <div className="relative">
                <input type="text" placeholder="Buscar cliente..."
                  value={customerSearch} onChange={e => setCustomerSearch(e.target.value)}
                  className="w-full bg-zinc-50 pl-9 pr-4 py-2.5 rounded-xl border border-zinc-100 outline-none text-xs font-medium focus:bg-white focus:border-red-200 transition-all" />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-300" />
              </div>
              <div className="max-h-[140px] overflow-y-auto space-y-1 -mx-1 px-1">
                {filteredCustomers.length === 0 ? (
                  <p className="text-[10px] text-zinc-400 italic text-center py-4">No hay clientes</p>
                ) : filteredCustomers.map(c => (
                  <button key={c._id} onClick={() => { setSelectedCustomerId(c._id); setCustomerSearch(c.name); }}
                    className={cn("w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all",
                      selectedCustomerId === c._id ? "bg-red-50 text-red-700" : "text-zinc-600 hover:bg-zinc-50"
                    )}>
                    <User className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{c.name}</span>
                    {c.email && <span className="text-[9px] text-zinc-400 ml-auto truncate hidden sm:block">{c.email}</span>}
                  </button>
                ))}
              </div>
              {selectedCustomer && (
                <div className="flex items-center gap-2 p-2.5 bg-emerald-50 rounded-xl text-[10px] font-medium text-emerald-700">
                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                  Enviando a: <strong>{selectedCustomer.name}</strong> ({selectedCustomer.email})
                </div>
              )}
              <input type="text" placeholder="Asunto..." value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full bg-zinc-50 px-4 py-2.5 rounded-xl border border-zinc-100 outline-none text-xs font-medium focus:bg-white focus:border-red-200 transition-all" />
              <textarea placeholder="Escribe el mensaje..." value={body}
                onChange={e => setBody(e.target.value)} rows={5}
                className="w-full bg-zinc-50 px-4 py-3 rounded-xl border border-zinc-100 outline-none text-xs font-medium focus:bg-white focus:border-red-200 transition-all resize-none" />
              <motion.button whileTap={{ scale: 0.95 }} onClick={handleSend}
                disabled={sending || !selectedCustomerId || !body.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 text-white rounded-xl text-xs font-black italic hover:bg-red-700 transition-all shadow-lg shadow-red-100 disabled:opacity-50">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {sending ? "Enviando..." : "Enviar Correo"}
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
                        <span className="text-[10px] font-black italic text-zinc-700 truncate">{comm.subject || "(sin asunto)"}</span>
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
        </>
      )}

      <div className="p-4 md:p-5 bg-gradient-to-br from-amber-50 to-white border border-amber-100 rounded-2xl">
        <h4 className="text-[10px] font-black italic text-amber-700 uppercase tracking-wider mb-2">Arquitectura preparada para IA</h4>
        <p className="text-[10px] md:text-[11px] text-amber-600 font-medium">
          El módulo de comunicaciones está diseñado para integrarse con el agente IA de Jandosoft.
          Podrás crear automataciones como: "Enviar correo de bienvenida al nuevo cliente", 
          "Notificar por WhatsApp cuando un pedido esté listo", o "Seguimiento automático a clientes inactivos".
          Las automatizaciones se configuran desde la sección Automatizaciones del panel.
        </p>
      </div>
    </div>
  );
}
