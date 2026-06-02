"use client";

import { useState, useRef } from "react";
import { Bot, Send, User, Loader2, Sparkles } from "lucide-react";
import MarkdownRenderer from "@/components/chat/MarkdownRenderer";

export function StorePublicAI({ storeId, storeName, industry }: { storeId: string; storeName: string; industry: string }) {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const started = useRef(false);

  const start = () => {
    if (started.current) return;
    started.current = true;
    setMessages([{ role: "assistant", content: `¡Hola! Soy el asistente virtual de ${storeName}. ¿En qué puedo ayudarte hoy?` }]);
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: `Eres el asistente virtual de ${storeName} (${industry || "negocio"}). Responde preguntas sobre los productos, servicios e información general de la tienda. Responde de forma amable y profesional en español. Si no sabes algo, sugiere contactar directamente con la tienda.` },
            ...messages.concat(userMsg).map(m => ({ role: m.role, content: m.content }))
          ]
        })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.text || "Disculpa, no pude procesar tu mensaje." }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Error de conexión. Intenta de nuevo." }]);
    } finally {
      setLoading(false);
    }
  };

  if (messages.length === 0) {
    return (
      <div className="text-center">
        <button onClick={start} className="px-8 py-4 bg-zinc-950 text-white rounded-2xl font-black italic hover:bg-zinc-800 transition-all shadow-xl active:scale-95 inline-flex items-center gap-3">
          <Bot className="w-5 h-5" /> PREGUNTAR AL ASISTENTE IA
        </button>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto bg-white rounded-[1.5rem] max-[340px]:rounded-xl md:rounded-[2.5rem] border border-zinc-100 shadow-3xl overflow-hidden">
      <div className="px-4 max-[340px]:px-2.5 py-3.5 border-b border-zinc-100 flex items-center gap-2.5 max-[340px]:gap-2">
        <div className="w-9 h-9 max-[340px]:w-7 max-[340px]:h-7 md:w-10 md:h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-600"><Sparkles className="w-4 h-4 max-[340px]:w-3.5 max-[340px]:h-3.5 md:w-5 md:h-5" /></div>
        <p className="font-black italic text-sm max-[340px]:text-xs text-zinc-950">Asistente de {storeName}</p>
      </div>
      <div className="h-80 overflow-y-auto px-3 max-[340px]:px-2 py-4 md:py-6 space-y-3.5 no-scrollbar">
        {messages.map((m, i) => (
          <div key={i} className={`flex items-start gap-1.5 md:gap-3 w-full ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`w-7 h-7 max-[340px]:w-6 max-[340px]:h-6 md:w-8 md:h-8 rounded-xl flex items-center justify-center shrink-0 ${m.role === "user" ? "bg-zinc-200" : "bg-red-50 text-red-600"}`}>
              {m.role === "user" ? <User className="w-3.5 h-3.5 max-[340px]:w-3 max-[340px]:h-3 md:w-4 md:h-4" /> : <Bot className="w-3.5 h-3.5 max-[340px]:w-3 max-[340px]:h-3 md:w-4 md:h-4" />}
            </div>
            <div className={`rounded-2xl text-xs md:text-sm font-medium leading-relaxed overflow-wrap-anywhere min-w-0 ${m.role === "user" ? "bg-zinc-950 text-white rounded-tr-none px-3.5 py-2.5 max-[340px]:px-2.5 max-[340px]:py-2 md:px-4 md:py-3 max-w-[85%] md:max-w-[75%]" : "bg-white border border-zinc-100 text-zinc-700 rounded-tl-none shadow-sm px-4 py-3 max-[340px]:px-2.5 max-[340px]:py-2 md:px-5 md:py-4 w-full md:max-w-[85%]"}`}>
              {m.role === "user" ? m.content : <MarkdownRenderer content={m.content} />}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-start gap-1.5 md:gap-3">
            <div className="w-7 h-7 max-[340px]:w-6 max-[340px]:h-6 rounded-xl bg-red-50 flex items-center justify-center text-red-600"><Loader2 className="w-3.5 h-3.5 max-[340px]:w-3 max-[340px]:h-3 md:w-4 md:h-4 animate-spin" /></div>
            <div className="px-4 py-3 max-[340px]:px-2.5 max-[340px]:py-2 rounded-2xl bg-white border border-zinc-100 text-zinc-400 text-sm italic">Escribiendo...</div>
          </div>
        )}
      </div>
      <div className="px-3 max-[340px]:px-2 py-3 border-t border-zinc-100">
        <div className="flex gap-2 max-[340px]:gap-1.5">
          <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Escribe tu pregunta..." className="flex-1 bg-zinc-50 p-3 max-[340px]:p-2.5 max-[340px]:text-xs rounded-xl border border-zinc-100 outline-none font-medium text-sm focus:bg-white focus:border-red-200 transition-all" />
          <button onClick={send} disabled={loading || !input.trim()} className="w-11 h-11 max-[340px]:w-9 max-[340px]:h-9 md:w-12 md:h-12 bg-red-600 text-white rounded-xl flex items-center justify-center hover:bg-red-700 transition-all disabled:opacity-50 shrink-0">
            <Send className="w-4 h-4 max-[340px]:w-3.5 max-[340px]:h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
