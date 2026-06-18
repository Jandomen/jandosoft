"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Loader2, Sparkles, Trash2, Mic, MicOff, Paperclip, Store, BarChart3, ShoppingCart, TrendingUp, Zap, Menu, Plus, MessageSquare, MoreHorizontal, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useVoiceInput } from "@/lib/hooks/useVoiceInput";
import { readFileAsText, formatFileMessage, readImageAsBase64, isImageFile, getImageFromClipboard } from "@/lib/utils/readFile";
import MarkdownRenderer from "./MarkdownRenderer";
import { useConversations, type StoredMessage } from "@/lib/hooks/useConversations";

const SUGGESTED_ACTIONS = [
  { label: "Configurar mi tienda", icon: <Store className="w-3.5 h-3.5" /> },
  { label: "Crear un producto", icon: <ShoppingCart className="w-3.5 h-3.5" /> },
  { label: "Analizar ventas", icon: <BarChart3 className="w-3.5 h-3.5" /> },
  { label: "Automatizar tareas", icon: <Zap className="w-3.5 h-3.5" /> },
];

export default function Chat({ maxMessages = 10, context }: { maxMessages?: number; context?: { storeName?: string; industry?: string; storeType?: string; description?: string; email?: string; plan?: string } }) {
  const {
    convos, activeId, createConversation, deleteConversation,
    switchConversation, loadMessages, saveMessages, updateTitle
  } = useConversations(context?.email);

  const [messages, setMessages] = useState<StoredMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [convLoaded, setConvLoaded] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [serverRemaining, setServerRemaining] = useState<number | null>(null);
  const [isPublic, setIsPublic] = useState(!context?.email);
  const [attachedImages, setAttachedImages] = useState<string[]>([]);

  const guestId = useRef<string | null>(null);
  useEffect(() => {
    if (!context?.email) {
      let id = localStorage.getItem("jandosoft_guest_id");
      if (!id) {
        id = crypto.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2);
        localStorage.setItem("jandosoft_guest_id", id);
      }
      guestId.current = id;
    }
  }, [context?.email]);

  const removeImage = (index: number) => {
    setAttachedImages(prev => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    const handlePaste = async (e: ClipboardEvent) => {
      const b64 = await getImageFromClipboard(e.clipboardData?.items as any);
      if (b64) {
        e.preventDefault();
        setAttachedImages(prev => [...prev, b64]);
      }
    };
    el.addEventListener("paste", handlePaste);
    return () => el.removeEventListener("paste", handlePaste);
  }, []);

  useEffect(() => {
    if (activeId) {
      const msgs = loadMessages(activeId);
      setMessages(msgs);
      setConvLoaded(true);
    }
  }, [activeId, loadMessages]);

  useEffect(() => {
    if (convLoaded && activeId && messages.length > 0) {
      saveMessages(activeId, messages);
    }
  }, [messages, convLoaded, activeId, saveMessages]);

  // Auto-title from first user message
  useEffect(() => {
    if (!activeId || !convLoaded) return;
    const firstUser = messages.find(m => m.role === "user");
    if (firstUser) {
      const convo = convos.find(c => c.id === activeId);
      if (convo && convo.title === "Nueva conversación") {
        const title = firstUser.content.length > 45
          ? firstUser.content.slice(0, 42) + "..."
          : firstUser.content;
        updateTitle(activeId, title);
      }
    }
  }, [messages, convLoaded, activeId, convos, updateTitle]);

  const canSend = serverRemaining === null || serverRemaining > 0;
  const displayRemaining = serverRemaining ?? maxMessages;
  const voice = useVoiceInput();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasUserMessages = messages.some(m => m.role === "user");

  // Scroll detection
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      const threshold = 40;
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
      setIsAtBottom(atBottom);
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-scroll only if user is at bottom
  useEffect(() => {
    if (scrollRef.current && isAtBottom) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, isAtBottom]);

  useEffect(() => {
    if (voice.transcript) {
      setInput(voice.transcript);
    }
  }, [voice.transcript]);

  const handleAttachFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (isImageFile(file.name)) {
        const b64 = await readImageAsBase64(file);
        setAttachedImages(prev => [...prev, b64]);
      } else {
        const content = await readFileAsText(file);
        const msg = formatFileMessage(file.name, content);
        setMessages(prev => [...prev, { role: "user", content: msg, timestamp: Date.now() }]);
      }
    } catch (err: any) {
      setMessages(prev => [...prev, { role: "bot", content: `⚠️ ${err.message}`, timestamp: Date.now() }]);
    }
    e.target.value = "";
  };

  const uploadImage = async (b64: string): Promise<string> => {
    const blob = await fetch(b64).then(r => r.blob());
    const fd = new FormData();
    fd.append("file", blob, "image.png");
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    return data.url || b64;
  };

  const handleSend = useCallback(async (text?: string) => {
    const msg = text || input;
    if ((!msg.trim() && attachedImages.length === 0) || isLoading || !canSend) return;

    setIsLoading(true);
    setInput("");

    let imageUrls: string[] = [];
    if (attachedImages.length > 0) {
      const uploads = await Promise.allSettled(attachedImages.map(uploadImage));
      imageUrls = uploads
        .filter((r): r is PromiseFulfilledResult<string> => r.status === "fulfilled")
        .map(r => r.value);
      setAttachedImages([]);
    }

    const imgMd = imageUrls.map(url => `![image](${url})`).join("\n");
    const fullMsg = [imgMd, msg].filter(Boolean).join("\n\n");
    const userMessage: StoredMessage = { role: "user", content: fullMsg, timestamp: Date.now() };
    const updated = [...messages, userMessage];
    setMessages(updated);

    try {
      const payload: any = {
        messages: updated.map(m => ({
          role: m.role === "user" ? "user" : "assistant",
          content: m.content
        })),
        context
      };
      if (guestId.current) {
        payload.guestId = guestId.current;
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (data.remaining !== undefined) {
        setServerRemaining(data.remaining);
      }
      if (data.isPublic) {
        setIsPublic(true);
      }
      if (data.text) {
        setMessages(prev => [...prev, { role: "bot", content: data.text, timestamp: Date.now() }]);
      } else if (data.error) {
        setMessages(prev => [...prev, { role: "bot", content: `Error: ${data.error}`, timestamp: Date.now() }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: "bot", content: "Lo siento, hubo un error al conectar con el servidor.", timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, canSend, messages, context, attachedImages]);

  const handleNewChat = () => {
    createConversation();
    setSidebarOpen(false);
    setMenuOpenId(null);
  };

  const handleDeleteConvo = (id: string) => {
    deleteConversation(id);
    setMenuOpenId(null);
  };

  const handleSelectConvo = (id: string) => {
    switchConversation(id);
    setSidebarOpen(false);
    setMenuOpenId(null);
  };

  const handleClear = () => {
    const firstBot = messages.length > 0 && messages[0]?.role === "bot" ? messages[0] : { role: "bot" as const, content: "¡Hola! Soy el asistente IA de Jandosoft. ¿En qué puedo ayudarte hoy?", timestamp: Date.now() };
    setMessages([firstBot as StoredMessage]);
    if (activeId) saveMessages(activeId, [firstBot as StoredMessage]);
  };

  return (
    <div className="flex flex-col h-[500px] md:h-[700px] w-full max-w-4xl mx-auto bg-zinc-50 rounded-[1.5rem] max-[340px]:rounded-xl md:rounded-[3rem] border border-zinc-100 shadow-3xl overflow-hidden relative">
      {/* Sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => { setSidebarOpen(false); setMenuOpenId(null); }}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={false}
        animate={{ x: sidebarOpen ? 0 : -320 }}
        transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.8 }}
        className="absolute left-0 top-0 bottom-0 z-50 w-[280px] max-[360px]:w-[260px] bg-white border-r border-zinc-100 flex flex-col shadow-2xl"
      >
        <div className="p-3 md:p-4 border-b border-zinc-100">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center gap-2 px-3 py-2.5 md:px-4 md:py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl md:rounded-2xl text-xs md:text-sm font-black italic transition-all shadow-lg shadow-red-100"
          >
            <Plus className="w-4 h-4 md:w-5 md:h-5" />
            Nueva conversación
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 md:p-3 space-y-1">
          {convos.map(convo => (
            <div key={convo.id} className="relative group">
              <button
                onClick={() => handleSelectConvo(convo.id)}
                className={cn(
                  "w-full text-left px-3 py-2.5 md:px-3.5 md:py-3 rounded-xl md:rounded-2xl text-xs md:text-sm font-medium transition-all flex items-start gap-2.5",
                  convo.id === activeId
                    ? "bg-red-50 text-red-700"
                    : "text-zinc-600 hover:bg-zinc-50"
                )}
              >
                <MessageSquare className="w-3.5 h-3.5 md:w-4 md:h-4 mt-0.5 shrink-0" />
                <span className="truncate min-w-0">{convo.title}</span>
              </button>
              <button
                onClick={() => setMenuOpenId(menuOpenId === convo.id ? null : convo.id)}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-zinc-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
              {menuOpenId === convo.id && (
                <div className="absolute right-1 top-full mt-0.5 z-10 bg-white border border-zinc-100 rounded-xl shadow-xl py-1 min-w-[120px]">
                  <button
                    onClick={() => handleDeleteConvo(convo.id)}
                    className="w-full text-left px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 className="w-3 h-3" />
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Header */}
      <div className="max-[400px]:px-3 max-[340px]:px-2 max-[400px]:py-2.5 px-6 md:px-8 py-4 md:py-6 border-b border-zinc-100 bg-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 max-[340px]:gap-1.5 md:gap-4 min-w-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 md:p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 rounded-lg md:rounded-xl transition-all shrink-0"
          >
            <Menu className="w-4 h-4 md:w-5 md:h-5" />
          </button>
          <div className="w-10 h-10 max-[340px]:w-8 max-[340px]:h-8 bg-gradient-to-br from-red-600 to-red-700 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-100 shrink-0">
            <Bot className="w-5 h-5 max-[340px]:w-4 max-[340px]:h-4 md:w-6 md:h-6" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm max-[340px]:text-xs font-black italic text-zinc-950 uppercase tracking-tight truncate">Jandosoft AI</h3>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {isPublic && <Globe className="w-2.5 h-2.5 text-emerald-500 shrink-0" />}
              <span className="text-[8px] max-[340px]:text-[7.5px] font-black text-zinc-400 uppercase tracking-widest max-[340px]:tracking-wider italic whitespace-nowrap">
                {displayRemaining} Mensajes restantes
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={handleClear}
          className="p-2 max-[340px]:p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all shrink-0"
        >
          <Trash2 className="w-4 h-4 max-[340px]:w-3.5 max-[340px]:h-3.5 md:w-5 md:h-5" />
        </button>
      </div>

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto max-[400px]:px-2.5 max-[340px]:px-2 max-[400px]:py-3 px-6 md:px-8 py-6 md:py-8 space-y-3.5 md:space-y-6 no-scrollbar">
        {!hasUserMessages ? (
          <div className="h-full flex flex-col items-center justify-center min-h-[300px] md:min-h-[400px]">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-red-600 to-red-700 rounded-2xl md:rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-red-200 mb-4 md:mb-6"
            >
              <Sparkles className="w-8 h-8 md:w-10 md:h-10" />
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="text-xl md:text-2xl font-black italic text-zinc-950 tracking-tighter text-center"
            >
              ¿En qué puedo ayudarte?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="text-xs md:text-sm text-zinc-400 font-medium mt-1 md:mt-2 text-center max-w-xs"
            >
              Pregúntame sobre tu negocio, productos, ventas o automatizaciones.
            </motion.p>

            {context?.storeName && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="w-full max-w-sm mt-6 md:mt-8 bg-white rounded-2xl border border-zinc-100 p-4 md:p-5 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center text-red-600 shrink-0">
                    <Store className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black italic text-zinc-950 uppercase tracking-tight">{context.storeName}</p>
                    <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">{context.industry || context.storeType || "Negocio"}</p>
                  </div>
                </div>
                <div className="flex gap-3 md:gap-4 text-[10px] md:text-xs">
                  {context.plan && (
                    <div className="flex items-center gap-1.5 bg-zinc-50 px-2.5 py-1.5 rounded-lg">
                      <TrendingUp className="w-3 h-3 text-emerald-500" />
                      <span className="font-black italic text-zinc-700 uppercase tracking-tight">{context.plan}</span>
                    </div>
                  )}
                  {context.storeType && (
                    <div className="flex items-center gap-1.5 bg-zinc-50 px-2.5 py-1.5 rounded-lg">
                      <ShoppingCart className="w-3 h-3 text-red-500" />
                      <span className="font-black italic text-zinc-700 uppercase tracking-tight">{context.storeType}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="flex flex-wrap justify-center gap-1.5 mt-4 md:mt-6 px-2"
            >
              {SUGGESTED_ACTIONS.map((action, i) => (
                <motion.button
                  key={action.label}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSend(action.label)}
                  className="inline-flex items-center gap-1.5 px-2.5 max-[340px]:px-2 py-1.5 max-[340px]:py-1 bg-white border border-zinc-200 hover:border-red-200 hover:bg-red-50 rounded-lg max-[340px]:rounded-md text-[9.5px] max-[340px]:text-[8.5px] font-black italic text-zinc-600 hover:text-red-600 transition-all shadow-sm"
                >
                  {action.icon}
                  {action.label}
                </motion.button>
              ))}
            </motion.div>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={cn(
                  "flex items-start gap-1.5 md:gap-4 w-full md:max-w-[85%]",
                  m.role === "user" ? "ml-auto flex-row-reverse md:ml-auto" : "mr-auto flex-row"
                )}
              >
                <div className={cn(
                  "w-7 h-7 max-[340px]:w-6 max-[340px]:h-6 md:w-10 md:h-10 rounded-xl flex items-center justify-center shrink-0",
                  m.role === "user" ? "bg-zinc-200 dark:bg-white/15 text-zinc-600 dark:text-white/70" : "bg-cyan-500/20 dark:bg-cyan-400/20 text-cyan-700 dark:text-cyan-300"
                )}>
                  {m.role === "user" ? <User className="w-3.5 h-3.5 max-[340px]:w-3 max-[340px]:h-3 md:w-5 md:h-5" /> : <Sparkles className="w-3.5 h-3.5 max-[340px]:w-3 max-[340px]:h-3 md:w-5 md:h-5" />}
                </div>
                <div className={cn(
                  "rounded-2xl text-xs md:text-sm font-medium leading-relaxed overflow-wrap-anywhere min-w-0",
                  m.role === "user"
                    ? "bg-zinc-950 text-white dark:bg-white/10 dark:text-white dark:backdrop-blur-md rounded-tr-none px-3.5 py-2.5 max-[340px]:px-2.5 max-[340px]:py-2 md:px-4 md:py-3"
                    : "bg-cyan-50 border border-cyan-200 text-cyan-800 dark:bg-cyan-500/10 dark:border-cyan-400/20 dark:text-cyan-100 rounded-tl-none shadow-sm px-4 py-3 max-[340px]:px-2.5 max-[340px]:py-2 md:px-5 md:py-4"
                )}>
                  {m.role === "user" ? m.content : <MarkdownRenderer content={m.content} />}
                </div>
              </motion.div>
            ))}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-1.5 md:gap-4 w-full md:max-w-[85%]"
              >
                <div className="w-7 h-7 max-[340px]:w-6 max-[340px]:h-6 md:w-10 md:h-10 rounded-xl bg-cyan-500/20 dark:bg-cyan-400/20 text-cyan-700 dark:text-cyan-300 flex items-center justify-center shrink-0">
                  <Loader2 className="w-3.5 h-3.5 max-[340px]:w-3 max-[340px]:h-3 md:w-5 md:h-5 animate-spin" />
                </div>
                <div className="px-4 py-3 max-[340px]:px-2.5 max-[340px]:py-2 md:px-5 md:py-4 rounded-2xl bg-cyan-50 border border-cyan-200 text-cyan-800 dark:bg-cyan-500/10 dark:border-cyan-400/20 dark:text-cyan-100 text-xs md:text-sm italic font-medium shadow-sm">
                  <span className="inline-flex items-center gap-1">
                    Pensando
                    <span className="animate-pulse">.</span>
                    <span className="animate-pulse" style={{ animationDelay: "0.2s" }}>.</span>
                    <span className="animate-pulse" style={{ animationDelay: "0.4s" }}>.</span>
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Input area */}
      <div className="max-[400px]:px-2.5 max-[340px]:px-2 max-[400px]:py-2.5 max-[340px]:py-2 px-6 md:px-8 py-4 md:py-6 bg-white border-t border-zinc-100 shrink-0">
        {attachedImages.length > 0 && (
          <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
            {attachedImages.map((b64, i) => (
              <div key={i} className="relative shrink-0 group">
                <img src={b64} alt={`imagen ${i+1}`} className="w-16 h-16 md:w-20 md:h-20 rounded-xl object-cover border border-zinc-200" />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            placeholder={!canSend ? (isPublic ? "Límite de 5 preguntas alcanzado (vuelve en 6h)" : "Límite de 10 preguntas alcanzado (vuelve en 24h)") : "Pega una imagen (Ctrl+V) o pregunta algo..."}
            disabled={!canSend}
            className={cn(
              "w-full bg-zinc-50 max-[400px]:p-3 max-[340px]:p-2.5 max-[400px]:text-xs text-sm p-4 md:p-5 pr-20 md:pr-24 rounded-xl md:rounded-2xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 focus:ring-2 focus:ring-red-600/5 transition-all shadow-sm disabled:opacity-50 disabled:bg-zinc-100",
              voice.isSupported ? "max-[400px]:pr-[102px]" : "max-[400px]:pr-[72px]"
            )}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSend()}
          />
          <div className="absolute right-1 md:right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 md:gap-1">
            <motion.button
              whileTap={{ scale: 0.9 }}
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || !canSend}
              className="w-8 h-8 max-[340px]:w-7 max-[340px]:h-7 rounded-xl flex items-center justify-center text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-all disabled:opacity-50 shrink-0"
            >
              <Paperclip className="w-3.5 h-3.5 max-[340px]:w-3 max-[340px]:h-3 md:w-4 md:h-4" />
            </motion.button>
            <input ref={fileInputRef} type="file" accept="image/*,.json,.csv,.tsv,.txt,.xml,.yaml,.yml,.md,.log,.env,.sql,.html,.css,.js,.ts,.jsx,.tsx,.py,.rb,.php,.java,.go,.rs,.sh" className="hidden" onChange={handleAttachFile} />
            {voice.isSupported && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                type="button"
                onClick={voice.isListening ? voice.stopListening : voice.startListening}
                disabled={isLoading || !canSend}
                className={cn("w-8 h-8 max-[340px]:w-7 max-[340px]:h-7 rounded-xl flex items-center justify-center transition-all shrink-0", voice.isListening ? "bg-red-600 text-white animate-pulse shadow-lg shadow-red-200" : "text-zinc-400 hover:text-red-600 hover:bg-red-50")}
              >
                {voice.isListening ? <MicOff className="w-3.5 h-3.5 max-[340px]:w-3 max-[340px]:h-3 md:w-4 md:h-4" /> : <Mic className="w-3.5 h-3.5 max-[340px]:w-3 max-[340px]:h-3 md:w-4 md:h-4" />}
              </motion.button>
            )}
            <motion.button
              whileTap={{ scale: 0.9 }}
              id="chat-send-btn"
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim() || !canSend}
              className="w-8 h-8 max-[340px]:w-7 max-[340px]:h-7 bg-red-600 text-white rounded-xl flex items-center justify-center hover:bg-red-700 transition-all shadow-lg shadow-red-100 disabled:opacity-50 disabled:shadow-none shrink-0"
            >
              <Send className="w-3.5 h-3.5 max-[340px]:w-3 max-[340px]:h-3 md:w-5 md:h-5" />
            </motion.button>
          </div>
        </div>
        <p className="text-center mt-2 md:mt-3 text-[7px] md:text-[9px] font-black text-zinc-300 uppercase tracking-widest italic">
          Jandosoft AI puede cometer errores. Verifica la información importante.
        </p>
      </div>
    </div>
  );
}
