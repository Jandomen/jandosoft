"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, Send, User, Loader2, Sparkles, Mic, MicOff, Calendar, Package } from "lucide-react";
import MarkdownRenderer from "@/components/chat/MarkdownRenderer";
import { useVoiceInput } from "@/lib/hooks/useVoiceInput";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

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
  chatBgColor?: string;
  inputBgColor?: string;
  inputBorderColor?: string;
  inputFocusColor?: string;
  inputTextColor?: string;
  botTextColor?: string;
  userTextColor?: string;
  fontFamily?: string;
  buttonSize?: number;
  buttonPosition?: string;
  buttonStyle?: string;
  chatWidth?: number;
  chatHeight?: number;
  animationType?: string;
  inputRadius?: number;
  bubbleRadius?: number;
  theme?: string;
  lang?: string;
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
  const { t } = useLanguage();
  const [messages, setMessages] = useState<{ role: string; content: string; plans?: any[] }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [lastProvider, setLastProvider] = useState<string>("");
  const started = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const voice = useVoiceInput({ autoSend: true, onResult: (text) => { setInput(text); setTimeout(() => { sendWithText(text); }, 100); } });

  useEffect(() => {
    if (autoStart && !started.current) {
      started.current = true;
      if (messages.length === 0) {
        setMessages([{ role: "assistant", content: ac?.widgetWelcome || t("widget.welcome").replace("{store}", storeName) }]);
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
  const welcomeMsg = config.widgetWelcome || t("widget.welcome").replace("{store}", storeName);
  const headerText = config.widgetHeader || t("widget.assistant_of").replace("{store}", storeName);
  const placeholderText = config.widgetPlaceholder || t("widget.placeholder");
  const borderColor = config.borderColor || "#e4e4e7";
  const borderRadius = config.borderRadius ?? 16;
  const shadow = config.shadow || "0 8px 40px rgba(0,0,0,0.12)";
  const headerBgColor = config.headerBgColor || primaryColor;
  const headerTextColor = config.headerTextColor || "#ffffff";
  const botBubbleColor = config.botBubbleColor || "#f4f4f5";
  const userBubbleColor = config.userBubbleColor || primaryColor;
  const chatBgColor = config.chatBgColor || "#f9fafb";
  const inputBgColor = config.inputBgColor || "#ffffff";
  const inputBorderColor = config.inputBorderColor || "#e4e4e7";
  const inputTextColor = config.inputTextColor || "#18181b";
  const botTextColor = config.botTextColor || "#18181b";
  const userTextColor = config.userTextColor || "#ffffff";
  const fontFamily = config.fontFamily || "";
  const bubbleRadius = config.bubbleRadius ?? 16;
  const inputRadius = config.inputRadius ?? 12;

  const start = () => {
    if (started.current) return;
    started.current = true;
    setMessages([{ role: "assistant", content: welcomeMsg }]);
  };

  const sendWithText = async (text?: string) => {
    const msg = text || input;
    if (!msg.trim() || loading) return;
    const userMsg = { role: "user", content: msg };
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
          message: msg,
          history: messages.map(m => ({ role: m.role, content: m.content })),
          guestId: guestIdRef.current,
        })
      });
      const data = await res.json();
      if (data.remaining !== undefined) setRemaining(data.remaining);
      if (data.provider) setLastProvider(data.provider);
      setMessages(prev => [...prev, { role: "assistant", content: data.text || data.error || t("widget.error_fallback"), plans: data.limitReached ? data.plans : undefined }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: t("widget.error_connection") }]);
    } finally {
      setLoading(false);
    }
  };

  const send = () => sendWithText();

  if (messages.length === 0) {
    return noHeader ? null : (
      <div className="text-center space-y-4">
        <button onClick={start} style={{ backgroundColor: primaryColor }} className="px-8 py-4 rounded-2xl font-bold text-white hover:opacity-90 transition-all shadow-lg active:scale-95 inline-flex items-center gap-3">
          <Bot className="w-5 h-5" /> {t("widget.ask_ai")}
        </button>
        {(services && services.length > 0) || (products && products.length > 0) ? (
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {services && services.length > 0 && (
              <button onClick={() => { start(); setTimeout(() => sendWithText(t("widget.query_services")), 200); }} className="text-[11px] font-semibold px-4 py-2 rounded-full border transition-all hover:shadow-sm active:scale-[0.97]" style={{ color: primaryColor, borderColor: `${primaryColor}30`, backgroundColor: `${primaryColor}08` }}>
                <Calendar className="w-3 h-3 inline mr-1" /> {t("widget.view_services")}
              </button>
            )}
            {products && products.length > 0 && (
              <button onClick={() => { start(); setTimeout(() => sendWithText(t("widget.query_products")), 200); }} className="text-[11px] font-semibold px-4 py-2 rounded-full border transition-all hover:shadow-sm active:scale-[0.97]" style={{ color: primaryColor, borderColor: `${primaryColor}30`, backgroundColor: `${primaryColor}08` }}>
                <Package className="w-3 h-3 inline mr-1" /> {t("widget.view_products")}
              </button>
            )}
              <button onClick={() => { start(); setTimeout(() => sendWithText(t("widget.query_appointment")), 200); }} className="text-[11px] font-semibold px-4 py-2 rounded-full border transition-all hover:shadow-sm active:scale-[0.97]" style={{ color: primaryColor, borderColor: `${primaryColor}30`, backgroundColor: `${primaryColor}08` }}>
                <Calendar className="w-3 h-3 inline mr-1" /> {t("widget.book_appointment")}
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`w-full mx-auto ${fillHeight ? "" : "border"} overflow-hidden bg-white dark:bg-zinc-900 flex flex-col h-full`} style={{ ...(fillHeight ? {} : { borderRadius: `${borderRadius}px`, boxShadow: shadow, borderColor }), fontFamily: fontFamily || undefined }}>
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
          {remaining !== null && remaining < 999 && (
            <span className="ml-auto text-[10px] font-black italic px-2 py-1 rounded-full shrink-0" style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}>
              {remaining} msgs
            </span>
          )}
          {lastProvider && (
            <span className="text-[10px] font-black italic px-2 py-1 rounded-full shrink-0 bg-emerald-50 text-emerald-600">
              🤖 {lastProvider}
            </span>
          )}
        </div>
      )}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-smooth px-3 pb-20 pt-4 md:pt-6 space-y-3.5 no-scrollbar min-h-0" style={{ backgroundColor: chatBgColor }}>
        {messages.map((m, i) => (
          <div key={i} className={`flex items-start gap-1.5 md:gap-3 w-full ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`w-7 h-7 max-[340px]:w-6 max-[340px]:h-6 md:w-8 md:h-8 rounded-xl flex items-center justify-center shrink-0 ${m.role === "user" ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300" : ""}`} style={m.role !== "user" ? { backgroundColor: `${primaryColor}15`, color: primaryColor } : {}}>
              {m.role === "user" ? <User className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <Bot className="w-3.5 h-3.5 md:w-4 md:h-4" />}
            </div>
            <div className={`rounded-2xl text-xs md:text-sm font-medium leading-relaxed min-w-0 ${m.role === "user" ? "text-white rounded-tr-none px-3.5 py-2.5 md:px-4 md:py-3 max-w-[85%] md:max-w-[75%]" : "rounded-tl-none px-4 py-3 md:px-5 md:py-4 w-full md:max-w-[85%] shadow-sm"}`} style={m.role === "user" ? { backgroundColor: userBubbleColor, color: userTextColor, borderRadius: `${bubbleRadius}px ${bubbleRadius}px 4px ${bubbleRadius}px` } : { backgroundColor: botBubbleColor, border: `1px solid ${borderColor}`, color: botTextColor, borderRadius: `${bubbleRadius}px ${bubbleRadius}px ${bubbleRadius}px 4px` }}>
              {m.role === "user" ? m.content : <MarkdownRenderer content={m.content} />}
            </div>
            {m.role === "assistant" && m.plans && m.plans.length > 0 && (
              <div className="w-full mt-2 space-y-2">
                <p className="text-[10px] font-black italic text-zinc-400 uppercase tracking-widest">{t("widget.available_plans")}</p>
                <div className="grid gap-2">
                  {m.plans.map((plan: any) => (
                    <div key={plan.id} className="flex items-center justify-between p-3 rounded-xl border border-zinc-100 bg-white hover:border-zinc-200 transition-all">
                      <div>
                        <p className="text-xs font-black italic text-zinc-950">{plan.name}</p>
                        <p className="text-[9px] text-zinc-400 font-medium">{plan.desc}</p>
                        <p className="text-[10px] font-black mt-1" style={{ color: primaryColor }}>${plan.price}{t("widget.per_month")}</p>
                      </div>
                      <a href={`/plan-checkout?plan=${plan.id}`} className="px-3 py-1.5 text-[10px] font-black italic text-white rounded-lg shrink-0" style={{ backgroundColor: primaryColor }}>
                        {t("widget.upgrade")}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-start gap-1.5 md:gap-3">
            <div className="w-7 h-7 max-[340px]:w-6 max-[340px]:h-6 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}><Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin" /></div>
            <div className="px-4 py-3 rounded-2xl text-sm italic" style={{ backgroundColor: botBubbleColor, border: `1px solid ${borderColor}`, color: botTextColor, borderRadius: `${bubbleRadius}px ${bubbleRadius}px ${bubbleRadius}px 4px` }}>{t("widget.writing")}</div>
          </div>
        )}
      </div>
      <div className="shrink-0 px-3 py-3 border-t" style={{ borderColor, backgroundColor: inputBgColor }}>
        <div className="flex gap-2 items-center">
          {voice.isSupported && (
            <button
              onClick={voice.isListening ? voice.stopListening : voice.startListening}
              disabled={loading}
              className="w-11 h-11 max-[340px]:w-9 max-[340px]:h-9 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-all shrink-0"
              style={voice.isListening ? { backgroundColor: primaryColor, color: "#fff", animation: "pulse 1.5s infinite" } : { backgroundColor: `${primaryColor}12`, color: primaryColor }}
              title={voice.isListening ? t("widget.stop_mic") : t("widget.speak")}
            >
              {voice.isListening ? <MicOff className="w-4 h-4 max-[340px]:w-3.5 max-[340px]:h-3.5" /> : <Mic className="w-4 h-4 max-[340px]:w-3.5 max-[340px]:h-3.5" />}
            </button>
          )}
          <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder={voice.isListening ? t("widget.listening") : placeholderText} className="flex-1 p-3 max-[340px]:p-2.5 max-[340px]:text-xs border outline-none font-medium text-sm transition-all" style={{ borderRadius: `${inputRadius}px`, borderColor: voice.isListening ? primaryColor : inputBorderColor, color: inputTextColor, backgroundColor: chatBgColor }} />
          <button onClick={send} disabled={loading || !input.trim()} className="w-11 h-11 max-[340px]:w-9 max-[340px]:h-9 md:w-12 md:h-12 text-white rounded-xl flex items-center justify-center transition-all disabled:opacity-50 shrink-0" style={{ backgroundColor: primaryColor }}>
            <Send className="w-4 h-4 max-[340px]:w-3.5 max-[340px]:h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
