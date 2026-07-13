"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, Send, User, Loader2, Sparkles } from "lucide-react";
import MarkdownRenderer from "@/components/chat/MarkdownRenderer";

interface AgentConfig {
  systemPrompt?: string;
  temperature?: number;
  model?: string;
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  textColor?: string;
  widgetWelcome?: string;
  widgetPlaceholder?: string;
  widgetHeader?: string;
  borderColor?: string;
  borderRadius?: number;
  shadow?: string;
  headerBgColor?: string;
  headerTextColor?: string;
  botBubbleColor?: string;
  userBubbleColor?: string;
}

function getWidgetGuestId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = localStorage.getItem("jandosoft_widget_guest_id");
    if (!id) {
      id = crypto.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2);
      localStorage.setItem("jandosoft_widget_guest_id", id);
    }
    return id;
  } catch { return ""; }
}

export function StorePublicAI({ storeId, storeName, industry, products, services, knowledgebase, agentConfig: ac, autoStart, noHeader, fillHeight }: { storeId: string; storeName: string; industry: string; products?: any[]; services?: any[]; knowledgebase?: { title: string; content: string; category?: string; question?: string }[]; agentConfig?: AgentConfig; autoStart?: boolean; noHeader?: boolean; fillHeight?: boolean }) {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const started = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoStart && !started.current) {
      started.current = true;
      if (messages.length === 0) {
        setMessages([{ role: "assistant", content: ac?.widgetWelcome || `¡Hola! Soy el asistente virtual de ${storeName}. ¿En qué puedo ayudarte hoy?` }]);
      }
    }
  }, [autoStart, ac, storeName, messages.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, loading]);

  const guestIdRef = useRef("");
  if (!guestIdRef.current) {
    guestIdRef.current = getWidgetGuestId();
  }

  const config = ac || {};
  const primaryColor = config.primaryColor || "#dc2626";
  const welcomeMsg = config.widgetWelcome || `¡Hola! Soy el asistente virtual de ${storeName}. ¿En qué puedo ayudarte hoy?`;
  const headerText = config.widgetHeader || `Asistente de ${storeName}`;
  const placeholderText = config.widgetPlaceholder || "Escribe tu pregunta...";
  const borderColor = config.borderColor || "#e4e4e7";
  const borderRadius = config.borderRadius ?? 16;
  const shadow = config.shadow || "0 8px 40px rgba(0,0,0,0.12)";
  const headerBgColor = config.headerBgColor || primaryColor;
  const headerTextColor = config.headerTextColor || "#ffffff";
  const botBubbleColor = config.botBubbleColor || "#f4f4f5";
  const userBubbleColor = config.userBubbleColor || primaryColor;

  const start = () => {
    if (started.current) return;
    started.current = true;
    setMessages([{ role: "assistant", content: welcomeMsg }]);
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId,
          message: input,
          history: messages.map(m => ({ role: m.role, content: m.content })),
          guestId: guestIdRef.current,
        })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.text || data.error || "Disculpa, no pude procesar tu mensaje." }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Error de conexión. Intenta de nuevo." }]);
    } finally {
      setLoading(false);
    }
  };

  if (messages.length === 0) {
    return noHeader ? null : (
      <div className="text-center">
        <button onClick={start} style={{ backgroundColor: primaryColor }} className="px-8 py-4 rounded-2xl font-bold text-white hover:opacity-90 transition-all shadow-lg active:scale-95 inline-flex items-center gap-3">
          <Bot className="w-5 h-5" /> PREGUNTAR AL ASISTENTE IA
        </button>
      </div>
    );
  }

  return (
    <div className={`w-full mx-auto ${fillHeight ? "" : "border"} overflow-hidden bg-white dark:bg-zinc-900 flex flex-col h-full`} style={fillHeight ? {} : { borderRadius: `${borderRadius}px`, boxShadow: shadow, borderColor }}>
      {!noHeader && (
        <div className="px-4 py-3.5 border-b flex items-center gap-2.5 shrink-0" style={{ backgroundColor: headerBgColor, color: headerTextColor, borderColor }}>
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${primaryColor}25`, color: headerTextColor }}>
            {config.logo ? (
              <img src={config.logo} alt="" className="w-5 h-5 md:w-6 md:h-6 object-contain" />
            ) : (
              <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
            )}
          </div>
          <p className="font-bold text-sm" style={{ color: headerTextColor }}>{headerText}</p>
        </div>
      )}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-smooth px-3 pb-20 pt-4 md:pt-6 space-y-3.5 no-scrollbar bg-zinc-50 dark:bg-zinc-900/50 min-h-0">
        {messages.map((m, i) => (
          <div key={i} className={`flex items-start gap-1.5 md:gap-3 w-full ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`w-7 h-7 max-[340px]:w-6 max-[340px]:h-6 md:w-8 md:h-8 rounded-xl flex items-center justify-center shrink-0 ${m.role === "user" ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300" : ""}`} style={m.role !== "user" ? { backgroundColor: `${primaryColor}15`, color: primaryColor } : {}}>
              {m.role === "user" ? <User className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <Bot className="w-3.5 h-3.5 md:w-4 md:h-4" />}
            </div>
            <div className={`rounded-2xl text-xs md:text-sm font-medium leading-relaxed min-w-0 ${m.role === "user" ? "text-white rounded-tr-none px-3.5 py-2.5 md:px-4 md:py-3 max-w-[85%] md:max-w-[75%]" : "rounded-tl-none px-4 py-3 md:px-5 md:py-4 w-full md:max-w-[85%] shadow-sm"}`} style={m.role === "user" ? { backgroundColor: userBubbleColor } : { backgroundColor: botBubbleColor, border: `1px solid ${borderColor}`, color: "#18181b" }}>
              {m.role === "user" ? m.content : <MarkdownRenderer content={m.content} />}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-start gap-1.5 md:gap-3">
            <div className="w-7 h-7 max-[340px]:w-6 max-[340px]:h-6 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}><Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin" /></div>
            <div className="px-4 py-3 rounded-2xl text-sm italic text-zinc-500" style={{ backgroundColor: botBubbleColor, border: `1px solid ${borderColor}` }}>Escribiendo...</div>
          </div>
        )}
      </div>
      <div className="shrink-0 px-3 py-3 border-t bg-white dark:bg-zinc-900" style={{ borderColor }}>
        <div className="flex gap-2">
          <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder={placeholderText} className="flex-1 p-3 max-[340px]:p-2.5 max-[340px]:text-xs rounded-xl border outline-none font-medium text-sm bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-600 text-zinc-800 dark:text-zinc-200 focus:border-red-300 dark:focus:border-red-500 transition-all" />
          <button onClick={send} disabled={loading || !input.trim()} className="w-11 h-11 max-[340px]:w-9 max-[340px]:h-9 md:w-12 md:h-12 text-white rounded-xl flex items-center justify-center transition-all disabled:opacity-50 shrink-0" style={{ backgroundColor: primaryColor }}>
            <Send className="w-4 h-4 max-[340px]:w-3.5 max-[340px]:h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
