"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Inbox, AlertCircle, Lightbulb, MessageSquare, CreditCard, HelpCircle, ChevronDown, Loader2, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useToast } from "@/components/ui/Toast";

const CATEGORIES = [
  { id: "support", label: "Soporte", icon: <HelpCircle className="w-4 h-4" />, color: "bg-blue-50 text-blue-600" },
  { id: "suggestion", label: "Sugerencia", icon: <Lightbulb className="w-4 h-4" />, color: "bg-amber-50 text-amber-600" },
  { id: "complaint", label: "Queja", icon: <AlertCircle className="w-4 h-4" />, color: "bg-rose-50 text-rose-600" },
  { id: "billing", label: "Facturación", icon: <CreditCard className="w-4 h-4" />, color: "bg-emerald-50 text-emerald-600" },
  { id: "other", label: "Otro", icon: <MessageSquare className="w-4 h-4" />, color: "bg-zinc-100 text-zinc-600" },
];

interface SupportMessage {
  _id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export default function SupportPanel() {
  const { t } = useLanguage();
  const { showToast, ToastComponent } = useToast();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("support");
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<SupportMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [showCatDropdown, setShowCatDropdown] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/support", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setHistory(data.messages || []);
      }
    } catch {} finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      showToast(t("support.fill_fields") || "Asunto y mensaje son obligatorios", "info");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ subject, message, category }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(t("support.sent") || "Mensaje enviado al administrador", "success");
        setSubject("");
        setMessage("");
        setCategory("support");
        fetchHistory();
      } else {
        showToast(data.error || "Error al enviar", "error");
      }
    } catch {
      showToast("Error de conexión", "error");
    }
    setSending(false);
  };

  const selectedCat = CATEGORIES.find(c => c.id === category) || CATEGORIES[0];

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {ToastComponent}

      <div className="flex items-center gap-3">
        <div className="p-3 bg-red-600 rounded-2xl shadow-xl shadow-red-100">
          <Inbox className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl max-[400px]:text-lg font-black italic text-zinc-950 uppercase tracking-tighter">{t("nav.support") || "Soporte"}</h2>
          <p className="text-[10px] font-bold text-zinc-400 italic">{t("support.subtitle") || "Envía un mensaje al administrador"}</p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm p-6 space-y-5">
        <h3 className="text-sm font-black italic text-zinc-950 uppercase">{t("support.new_message") || "Nuevo Mensaje"}</h3>

        <div className="space-y-1.5">
          <label className="text-[9px] font-black text-zinc-400 uppercase italic tracking-widest">{t("support.category") || "Categoría"}</label>
          <div className="relative">
            <button
              onClick={() => setShowCatDropdown(!showCatDropdown)}
              className={cn("w-full flex items-center gap-2 p-3 rounded-xl border border-zinc-100 bg-zinc-50 hover:bg-white transition-all text-left", showCatDropdown && "bg-white border-red-200")}
            >
              <span className={cn("p-1.5 rounded-lg", selectedCat.color)}>{selectedCat.icon}</span>
              <span className="text-xs font-bold italic">{selectedCat.label}</span>
              <ChevronDown className={cn("w-3 h-3 text-zinc-400 ml-auto transition-transform", showCatDropdown && "rotate-180")} />
            </button>
            <AnimatePresence>
              {showCatDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute z-10 top-full mt-1 w-full bg-white border border-zinc-100 rounded-xl shadow-xl overflow-hidden"
                >
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => { setCategory(cat.id); setShowCatDropdown(false); }}
                      className={cn("w-full flex items-center gap-2 px-3 py-2.5 hover:bg-zinc-50 transition-all text-left", category === cat.id && "bg-red-50")}
                    >
                      <span className={cn("p-1 rounded-lg", cat.color)}>{cat.icon}</span>
                      <span className="text-xs font-bold italic">{cat.label}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[9px] font-black text-zinc-400 uppercase italic tracking-widest">{t("support.subject") || "Asunto"}</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={t("support.subject_placeholder") || "¿Sobre qué es tu mensaje?"}
            className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-red-200 transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[9px] font-black text-zinc-400 uppercase italic tracking-widest">{t("support.message") || "Mensaje"}</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t("support.message_placeholder") || "Describe tu solicitud, queja o sugerencia..."}
            rows={5}
            className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-red-200 transition-all resize-none"
          />
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSend}
          disabled={sending || !subject.trim() || !message.trim()}
          className="w-full py-3.5 bg-red-600 text-white rounded-xl font-black italic text-xs uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {t("support.send") || "Enviar Mensaje"}
        </motion.button>
      </div>

      <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-black italic text-zinc-950 uppercase">{t("support.history") || "Mensajes Enviados"}</h3>

        {loadingHistory ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 text-red-600 animate-spin" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8">
            <Inbox className="w-10 h-10 text-zinc-200 mx-auto mb-3" />
            <p className="text-xs font-bold text-zinc-400 italic">{t("support.no_messages") || "No has enviado mensajes aún"}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map(msg => {
              const catLabel = msg.title.match(/\[Soporte\]\s*(\w+):/)?.[1] || "Mensaje";
              const subject = msg.title.replace(/\[Soporte\]\s*\w+:\s*/, "");
              return (
                <div key={msg._id} className={cn("p-4 rounded-xl border transition-all", msg.read ? "bg-zinc-50 border-zinc-100" : "bg-red-50/30 border-red-100")}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[8px] font-bold text-zinc-400 uppercase bg-zinc-100 px-1.5 py-0.5 rounded-full">{catLabel}</span>
                        {!msg.read && <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />}
                      </div>
                      <p className={cn("text-xs leading-tight", msg.read ? "font-medium text-zinc-600" : "font-bold text-zinc-950")}>{subject}</p>
                      <p className="text-[10px] text-zinc-400 mt-1 line-clamp-2">{msg.message.split("\n\n")[1] || msg.message}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {msg.read ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                      )}
                    </div>
                  </div>
                  <p className="text-[8px] text-zinc-300 mt-2">
                    {new Date(msg.createdAt).toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
