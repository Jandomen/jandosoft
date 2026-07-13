"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Bot, X, Send, Loader } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ADMIN_SESSION_KEY = "jandosession-admin";
const SESS_DURATION = 7 * 24 * 60 * 60 * 1000;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMsgs, setChatMsgs] = useState<{ role: string; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    if (pathname === "/admin") {
      setAuthorized(true);
      return;
    }
    const saved = localStorage.getItem(ADMIN_SESSION_KEY);
    if (!saved) {
      router.push("/admin");
      return;
    }
    try {
      const session = JSON.parse(saved);
      if (!session.isAdmin || Date.now() - session.loggedAt > SESS_DURATION) {
        localStorage.removeItem(ADMIN_SESSION_KEY);
        router.push("/admin");
        return;
      }
      setAuthorized(true);
    } catch {
      localStorage.removeItem(ADMIN_SESSION_KEY);
      router.push("/admin");
    }
  }, [router, pathname]);

  const sendChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = { role: "user", content: chatInput };
    setChatMsgs((prev) => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);
    try {
      const res = await fetch("/api/admin/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...chatMsgs, userMsg].map(m => ({ role: m.role, content: m.content })) }),
      });
      const data = await res.json();
      if (data.text) {
        setChatMsgs((prev) => [...prev, { role: "assistant", content: data.text }]);
      }
      if (data.action) {
        await executeAction(data.action);
        setChatMsgs((prev) => [...prev, { role: "assistant", content: data.followUp || "Acción ejecutada correctamente" }]);
        window.location.reload();
      }
    } catch {
      setChatMsgs((prev) => [...prev, { role: "assistant", content: "Error al conectar con el asistente" }]);
    } finally {
      setChatLoading(false);
    }
  };

  const executeAction = async (action: { type: string; params: any }) => {
    try {
      switch (action.type) {
        case "createCommercial":
          await fetch("/api/admin/commercials", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(action.params),
          });
          break;
        case "toggleSuspend":
          await fetch(`/api/admin/stores/${action.params.storeId}/toggle-suspend`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reason: action.params.reason, duration: action.params.duration || "permanent" }),
          });
          break;
        case "toggleUserSuspend":
          await fetch(`/api/admin/users/${action.params.userId}/toggle-suspend`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reason: action.params.reason, duration: action.params.duration || "permanent" }),
          });
          break;
      }
    } catch (e) {
      console.error("Action error:", e);
    }
  };

  if (!authorized) {
    return <div className="min-h-screen bg-white" />;
  }

  if (pathname === "/admin") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <main className="flex-1">
        {children}
      </main>

      <footer className="border-t border-zinc-100 py-4 md:py-6">
        <div className="max-w-7xl mx-auto px-4 md:px-6 text-center">
          <p className="text-[9px] md:text-[10px] font-medium text-zinc-400 uppercase tracking-[0.15em]">
            <span className="font-wallpoet tracking-[0.2em] text-red-600">JANDOSOFT</span> Enterprise &mdash; Administración Global
          </p>
        </div>
      </footer>

      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-4 md:bottom-6 right-4 md:right-6 z-50 w-[calc(100vw-32px)] md:w-[420px] h-[480px] md:h-[520px] bg-white rounded-[1.5rem] md:rounded-[2rem] shadow-2xl border border-zinc-200 flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 md:px-5 py-3.5 md:py-4 bg-zinc-950 text-white">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-red-600 rounded-lg">
                  <Bot className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </div>
                <div>
                  <p className="text-[11px] md:text-xs font-black italic">Asistente Admin</p>
                  <p className="text-[7px] md:text-[8px] text-zinc-400 font-bold uppercase tracking-wider">IA · <span className="font-wallpoet tracking-[0.2em] text-red-600">JANDOSOFT</span></p>
                </div>
              </div>
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => setChatOpen(false)} className="p-1 hover:bg-zinc-800 rounded-lg transition-all">
                <X className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </motion.button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3">
              {chatMsgs.length === 0 && (
                <div className="text-center py-8 md:py-10 space-y-3">
                  <Bot className="w-8 h-8 md:w-10 md:h-10 text-zinc-200 mx-auto" />
                  <p className="text-[11px] md:text-xs font-black italic text-zinc-400">Asistente de Administración</p>
                  <p className="text-[9px] md:text-[10px] text-zinc-300 font-medium px-2 md:px-4">
                    Puedes pedirme crear comerciales, revisar estadísticas, buscar empresas, suspender actividad sospechosa y más.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center pt-2 px-2">
                    {["Crea un comercial", "Busca empresas sospechosas", "Estadísticas del panel"].map((s) => (
                      <button
                        key={s}
                        onClick={() => { setChatInput(s); }}
                        className="px-2.5 md:px-3 py-1.5 bg-zinc-50 border border-zinc-100 rounded-xl text-[8px] md:text-[9px] font-bold italic text-zinc-500 hover:bg-zinc-100 transition-all"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {chatMsgs.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] md:max-w-[80%] p-2.5 md:p-3 rounded-2xl text-[10px] md:text-xs leading-relaxed ${
                    m.role === "user"
                      ? "bg-zinc-950 text-white rounded-br-md"
                      : "bg-zinc-50 text-zinc-700 rounded-bl-md"
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-zinc-50 p-2.5 md:p-3 rounded-2xl rounded-bl-md flex items-center gap-2">
                    <Loader className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin text-zinc-400" />
                    <span className="text-[9px] md:text-[10px] text-zinc-400 italic font-medium">Pensando...</span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 md:p-4 border-t border-zinc-100">
              <div className="flex items-center gap-2 bg-zinc-50 rounded-2xl px-3 md:px-4 py-2 md:py-2.5">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendChat()}
                  placeholder="Escribe un comando..."
                  className="flex-1 bg-transparent text-[10px] md:text-xs font-medium outline-none placeholder:text-zinc-300"
                />
                <motion.button whileTap={{ scale: 0.9 }} onClick={sendChat} disabled={chatLoading} className="p-1.5 md:p-2 bg-zinc-950 text-white rounded-xl hover:bg-zinc-800 transition-all disabled:opacity-50 shrink-0">
                  <Send className="w-3 h-3 md:w-3.5 md:h-3.5" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!chatOpen && (
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setChatOpen(true)}
          className="fixed bottom-4 md:bottom-6 right-4 md:right-6 z-50 p-3 md:p-4 bg-zinc-950 text-white rounded-xl md:rounded-2xl shadow-2xl hover:bg-zinc-800 transition-all"
        >
          <Bot className="w-5 h-5 md:w-6 md:h-6" />
        </motion.button>
      )}
    </div>
  );
}
