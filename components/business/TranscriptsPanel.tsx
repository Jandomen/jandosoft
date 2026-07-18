"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { MessageSquare, ArrowLeft, Loader2, Bot, User, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

interface WidgetConversation {
  _id: string;
  storeId: string;
  guestId: string;
  lastMessage: string;
  updatedAt: string;
  createdAt: string;
}

interface WidgetMessage {
  _id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

export default function TranscriptsPanel({ storeId }: { storeId: string }) {
  const { t, language } = useLanguage();
  const [conversations, setConversations] = useState<WidgetConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<WidgetMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [view, setView] = useState<"list" | "thread">("list");
  const threadRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/transcripts?storeId=${storeId}`);
      const data = await res.json();
      if (data.conversations) {
        setConversations(data.conversations);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const loadMessages = useCallback(async (convId: string) => {
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/transcripts/${convId}`);
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (activeConvId) {
      loadMessages(activeConvId);
    }
  }, [activeConvId, loadMessages]);

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [messages]);

  const activeConv = conversations.find(c => c._id === activeConvId);

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 overflow-hidden shadow-lg shadow-zinc-200/50 dark:shadow-zinc-950/50 max-h-[85vh] md:max-h-[650px]">
      {/* Header */}
      <div className="relative px-4 md:px-5 py-4 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 shrink-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(220,38,38,0.15),transparent_50%)]" />
        <div className="relative flex items-center gap-3">
          {view === "thread" ? (
            <>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => { setView("list"); setActiveConvId(null); }}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
              </motion.button>
              <div className="w-9 h-9 bg-gradient-to-br from-zinc-700 to-zinc-900 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black italic text-white truncate">Guest</p>
                <p className="text-[9px] text-zinc-500 font-medium truncate">{activeConv?.guestId}</p>
              </div>
            </>
          ) : (
            <>
              <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-500/20">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black italic text-white tracking-tight uppercase">Historial IA</h3>
                <p className="text-[9px] text-zinc-500 font-medium">Conversaciones del Widget</p>
              </div>
              <div className="ml-auto">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => loadConversations()}
                  className="p-2 text-zinc-500 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                >
                  <Loader2 className={cn("w-4 h-4", loading ? "animate-spin" : "")} />
                </motion.button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Conversation list */}
      {view === "list" && (
        <div className="flex-1 overflow-y-auto dark:bg-zinc-900">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-zinc-400">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
              <MessageSquare className="w-12 h-12 mb-4 text-zinc-200 dark:text-zinc-700" />
              <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">No hay conversaciones aún</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Los visitantes del widget aparecerán aquí.</p>
            </div>
          ) : (
            conversations.map((conv, idx) => {
              const d = new Date(conv.updatedAt);
              const isToday = new Date().toDateString() === d.toDateString();
              const timeStr = isToday ? `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}` : d.toLocaleDateString();
              
              return (
                <motion.button
                  key={conv._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  onClick={() => { setActiveConvId(conv._id); setView("thread"); }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 md:px-5 py-3.5 transition-all text-left border-b border-zinc-50 dark:border-zinc-800 last:border-0",
                    activeConvId === conv._id
                      ? "bg-gradient-to-r from-red-50/80 to-transparent dark:from-red-950/30 dark:to-transparent"
                      : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  )}
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-800 rounded-xl flex items-center justify-center text-zinc-500 dark:text-zinc-400 shadow-sm shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm truncate font-bold text-zinc-800 dark:text-zinc-200">Visitante</p>
                      <span className="text-[9px] text-zinc-400 dark:text-zinc-500 whitespace-nowrap shrink-0 font-medium">{timeStr}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className="text-xs truncate text-zinc-400 dark:text-zinc-500">
                        {conv.lastMessage || "Sin mensajes"}
                      </p>
                    </div>
                    <p className="text-[8px] text-zinc-300 dark:text-zinc-600 mt-1 truncate">ID: {conv.guestId}</p>
                  </div>
                </motion.button>
              );
            })
          )}
        </div>
      )}

      {/* Message thread */}
      {view === "thread" && activeConvId && (
        <div ref={threadRef} className="flex-1 overflow-y-auto p-4 md:p-5 space-y-3 dark:bg-zinc-900">
          {loadingMessages ? (
             <div className="flex items-center justify-center py-16 text-zinc-400">
               <Loader2 className="w-6 h-6 animate-spin" />
             </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
              <MessageSquare className="w-10 h-10 mb-3 text-zinc-200 dark:text-zinc-700" />
              <p className="text-sm font-medium">No hay mensajes en esta conversación</p>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => {
                const isUser = msg.role === "user";
                return (
                  <motion.div
                    key={msg._id}
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className={cn("flex items-end gap-2 max-w-full", isUser ? "" : "flex-row-reverse ml-auto")}
                  >
                    <div className="shrink-0 mb-1">
                      {isUser ? (
                        <div className="w-7 h-7 bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-800 rounded-xl flex items-center justify-center text-zinc-500 dark:text-zinc-400 text-[9px] font-black shadow-sm">
                          <User className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center text-white text-[9px] font-black shadow-sm">
                          <Bot className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                    <div className={cn("max-w-[85%] md:max-w-[75%]", isUser ? "items-start" : "items-end")}>
                      <div className={cn(
                        "px-3.5 py-2.5 text-sm leading-relaxed overflow-wrap-anywhere shadow-sm whitespace-pre-wrap",
                        isUser
                          ? "bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-2xl rounded-bl-md border border-zinc-100 dark:border-zinc-700"
                          : "bg-gradient-to-br from-red-600 to-red-700 text-white rounded-2xl rounded-br-md"
                      )}>
                        {msg.content}
                      </div>
                      <div className={cn("flex items-center gap-1 mt-0.5 px-1", isUser ? "" : "justify-end")}>
                        <span className="text-[8px] text-zinc-400 dark:text-zinc-500 font-medium">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
