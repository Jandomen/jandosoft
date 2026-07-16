"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  MessageSquare, Send, Search, Plus, ArrowLeft, User, Users, Trash2,
  CheckCheck, Loader2, X, Image, Paperclip
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

interface UserInfo {
  _id: string;
  email: string;
  name?: string;
  phone?: string;
}

interface Participant {
  userId: string;
  email: string;
  name: string;
}

interface Conversation {
  _id: string;
  participants: Participant[];
  lastMessage?: string;
  lastSenderId?: string;
  lastMessageAt?: string;
  updatedAt: string;
}

interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  senderEmail: string;
  senderName: string;
  content: string;
  mediaUrl?: string;
  mediaType?: "image" | "video";
  createdAt: string;
  readAt: string | null;
}

type PanelView = "list" | "thread" | "search" | "contacts";

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.type = "sine";
    o.frequency.setValueAtTime(880, ctx.currentTime);
    o.frequency.setValueAtTime(1100, ctx.currentTime + 0.08);
    g.gain.setValueAtTime(0.3, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
    o.start(ctx.currentTime);
    o.stop(ctx.currentTime + 0.25);
  } catch {}
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map(w => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatMessageTime(dateStr: string, t: (key: string) => string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return t("messages.just_now");
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}`;
}

function formatDateSeparator(dateStr: string, t: (key: string) => string, locale: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((today.getTime() - msgDate.getTime()) / 86400000);
  if (diffDays === 0) return t("messages.today");
  if (diffDays === 1) return t("messages.yesterday");
  return d.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" });
}

function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const dims = { sm: "w-8 h-8 text-[10px]", md: "w-10 h-10 text-xs", lg: "w-12 h-12 text-sm" };
  return (
    <div className={cn(dims[size], "bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center text-white font-black italic shadow-md shrink-0")}>
      {getInitials(name) || "?"}
    </div>
  );
}

export default function MessagesPanel({ onClose }: { onClose?: () => void }) {
  const { t, language } = useLanguage();
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserInfo[]>([]);
  const [searching, setSearching] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [view, setView] = useState<PanelView>("list");
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});
  const [uploading, setUploading] = useState(false);
  const totalUnread = Object.values(unreadMap).reduce((a, b) => a + b, 0);
  const threadRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(data => {
        if (data.user) setCurrentUser(data.user);
      })
      .catch(() => {});
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations");
      const data = await res.json();
      if (data.conversations) {
        setConversations(data.conversations);
        const unread: Record<string, number> = {};
        for (const conv of data.conversations) {
          const res2 = await fetch(`/api/conversations/${conv._id}/unread`);
          const d2 = await res2.json();
          unread[conv._id] = d2.unread || 0;
        }
        setUnreadMap(unread);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Global SSE for all user notifications
  useEffect(() => {
    if (!currentUser?._id) return;
    let es: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let closed = false;

    const connect = () => {
      if (closed) return;
      if (es) { try { es.close(); } catch {} }
      es = new EventSource("/api/notifications/stream");
      esRef.current = es;
      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "message:new") {
            const msg = data.payload?.message;
            if (!msg) return;
            const isFromOther = msg.senderId !== currentUser._id;
            if (isFromOther) {
              if (msg.conversationId !== activeConvId) {
                playNotificationSound();
                setUnreadMap(prev => ({ ...prev, [msg.conversationId]: (prev[msg.conversationId] || 0) + 1 }));
              }
            }
            setConversations(prev => {
              const updated = prev.map(c => c._id === msg.conversationId
                ? { ...c, lastMessage: msg.content, lastSenderId: msg.senderId, lastMessageAt: msg.createdAt }
                : c);
              return updated.sort((a, b) => new Date(b.lastMessageAt || b.updatedAt).getTime() - new Date(a.lastMessageAt || a.updatedAt).getTime());
            });
          }
          if (data.type === "conversation:new") {
            loadConversations();
          }
        } catch {}
      };
      es.onerror = () => {
        es?.close();
        esRef.current = null;
        if (!closed) reconnectTimer = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      closed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      es?.close();
      esRef.current = null;
    };
  }, [currentUser?._id, activeConvId, loadConversations]);

  // Reconnect on activeConvId change for per-conv messages
  useEffect(() => {
    if (!activeConvId) return;
    let es: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let closed = false;

    const connect = () => {
      if (closed) return;
      if (es) { try { es.close(); } catch {} }
      es = new EventSource(`/api/conversations/${activeConvId}/stream`);
      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "message:new" && data.payload?.message?.conversationId === activeConvId) {
            setMessages(prev => [...prev, data.payload.message]);
            fetch(`/api/conversations/${activeConvId}/read`, { method: "PATCH" }).catch(() => {});
            setUnreadMap(prev => ({ ...prev, [activeConvId]: 0 }));
          }
          if (data.type === "message:read" && data.payload?.conversationId === activeConvId) {
            setMessages(prev => prev.map(m => !m.readAt && m.senderId !== currentUser?._id
              ? { ...m, readAt: data.payload.readAt } : m));
          }
        } catch {}
      };
      es.onerror = () => {
        es?.close();
        if (!closed) reconnectTimer = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      closed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      es?.close();
    };
  }, [activeConvId, currentUser?._id]);

  const loadMessages = useCallback(async (convId: string) => {
    try {
      const res = await fetch(`/api/conversations/${convId}/messages`);
      const data = await res.json();
      if (data.messages) setMessages(data.messages);
      fetch(`/api/conversations/${convId}/read`, { method: "PATCH" }).catch(() => {});
      setUnreadMap(prev => ({ ...prev, [convId]: 0 }));
    } catch {}
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

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        setSearchResults(data.users || []);
      } catch {} finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const loadContacts = useCallback(async () => {
    try {
      const res = await fetch("/api/contacts");
      const data = await res.json();
      setContacts(data.contacts || []);
    } catch {}
  }, []);

  useEffect(() => {
    if (view === "contacts") loadContacts();
  }, [view, loadContacts]);

  const createConversation = async (targetUser: UserInfo) => {
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId: targetUser._id }),
      });
      const data = await res.json();
      if (data.conversation) {
        setActiveConvId(data.conversation._id);
        setView("thread");
        setSearchQuery("");
        setSearchResults([]);
        loadConversations();
      }
    } catch {}
  };

  const addContact = async (email: string) => {
    try {
      await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactEmail: email }),
      });
      loadContacts();
    } catch {}
  };

  const removeContact = async (id: string) => {
    try {
      await fetch(`/api/contacts?id=${id}`, { method: "DELETE" });
      loadContacts();
    } catch {}
  };

  const handleSend = async (media?: { url: string; type: "image" | "video" }) => {
    if ((!input.trim() && !media) || !activeConvId || sending) return;
    setSending(true);
    const text = input.trim();
    setInput("");
    try {
      await fetch(`/api/conversations/${activeConvId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(text ? { content: text } : {}),
          ...(media ? { mediaUrl: media.url, mediaType: media.type } : {}),
        }),
      });
    } catch {} finally {
      setSending(false);
    }
  };

  const handleAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConvId) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) {
        await handleSend({ url: data.url, type: data.mediaType });
      }
    } catch {} finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const otherParticipant = (conv: Conversation): Participant | null => {
    if (!currentUser) return null;
    return conv.participants.find(p => p.userId !== currentUser._id) || null;
  };

  const activeConv = conversations.find(c => c._id === activeConvId);
  const otherUser = activeConv ? otherParticipant(activeConv) : null;

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
              <Avatar name={otherUser?.name || "U"} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black italic text-white truncate">{otherUser?.name || t("messages.user")}</p>
                <p className="text-[9px] text-zinc-500 font-medium">{otherUser?.email || ""}</p>
              </div>
            </>
          ) : (
            <>
              <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-500/20">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black italic text-white tracking-tight uppercase">{t("messages.title")}</h3>
                <p className="text-[9px] text-zinc-500 font-medium">{t("messages.inbox")}</p>
              </div>
              {totalUnread > 0 && (
                <span className="w-5 h-5 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center text-[8px] font-black text-white shadow-lg shadow-red-500/30 shrink-0">
                  {totalUnread > 9 ? "9+" : totalUnread}
                </span>
              )}
              <div className="ml-auto flex items-center gap-1">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => { setView("contacts"); loadContacts(); }}
                  className={cn("p-2 rounded-xl transition-all", view === "contacts" ? "bg-white/15 text-white" : "text-zinc-500 hover:text-white hover:bg-white/10")}
                >
                  <Users className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => { setView("search"); setSearchQuery(""); setSearchResults([]); setTimeout(() => searchInputRef.current?.focus(), 100); }}
                  className="p-2 text-zinc-500 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                >
                  <Plus className="w-4 h-4" />
                </motion.button>
                {onClose && (
                  <motion.button whileTap={{ scale: 0.9 }} onClick={onClose} className="p-2 text-zinc-500 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                    <X className="w-4 h-4" />
                  </motion.button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Search view */}
      {view === "search" && (
        <div className="flex-1 flex flex-col p-4 md:p-5 dark:bg-zinc-900">
          <div className="relative mb-4">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder={t("messages.search_placeholder")}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 text-sm outline-none focus:bg-white dark:focus:bg-zinc-800 focus:border-red-200 dark:focus:border-red-500 focus:shadow-lg focus:shadow-red-100/50 dark:focus:shadow-red-900/20 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-zinc-950 dark:text-white"
            />
          </div>
          <div className="flex-1 overflow-y-auto space-y-1 dark:bg-zinc-900">
            {searching && (
              <div className="flex items-center justify-center py-12 text-zinc-400">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            )}
            {!searching && searchQuery.length >= 2 && searchResults.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
                <User className="w-10 h-10 mb-3 text-zinc-200 dark:text-zinc-700" />
                <p className="text-sm font-medium">{t("messages.no_results")}</p>
              </div>
            )}
            {searchResults.map(user => (
              <motion.button
                key={user._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => createConversation(user)}
                className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all text-left group"
              >
                <Avatar name={user.name || user.email} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-zinc-950 dark:text-white truncate">{user.name || user.email.split("@")[0]}</p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate">{user.email}</p>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); addContact(user.email); }}
                  className="p-2 text-zinc-300 dark:text-zinc-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </motion.button>
            ))}
            {searchQuery.length < 2 && (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
                <Search className="w-10 h-10 mb-3 text-zinc-200 dark:text-zinc-700" />
                <p className="text-sm font-medium">{t("messages.min_chars")}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contacts view */}
      {view === "contacts" && (
        <div className="flex-1 overflow-y-auto p-4 md:p-5 dark:bg-zinc-900">
          {contacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
              <Users className="w-12 h-12 mb-4 text-zinc-200 dark:text-zinc-700" />
              <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">{t("messages.no_contacts")}</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">{t("messages.no_contacts_desc")}</p>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => { setView("search"); setSearchQuery(""); setTimeout(() => searchInputRef.current?.focus(), 100); }}
                className="mt-5 px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl text-xs font-black italic hover:from-red-700 hover:to-red-800 transition-all shadow-lg shadow-red-200/50 dark:shadow-red-900/30"
              >
                {t("messages.search_users")}
              </motion.button>
            </div>
          ) : (
            <div className="space-y-1">
              {contacts.map(contact => (
                <div key={contact._id} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all group">
                  <Avatar name={contact.contactName || contact.contactEmail} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-zinc-950 dark:text-white truncate">{contact.contactName || t("messages.no_name")}</p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate">{contact.contactEmail}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => createConversation({ _id: contact.contactUserId, email: contact.contactEmail, name: contact.contactName })}
                      className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => removeContact(contact._id)}
                      className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </motion.button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
              <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">{t("messages.no_conversations")}</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">{t("messages.no_conversations_desc")}</p>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => { setView("search"); setSearchQuery(""); setTimeout(() => searchInputRef.current?.focus(), 100); }}
                className="mt-5 px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl text-xs font-black italic hover:from-red-700 hover:to-red-800 transition-all shadow-lg shadow-red-200/50 dark:shadow-red-900/30"
              >
                {t("messages.new_conversation")}
              </motion.button>
            </div>
          ) : (
            conversations.map((conv, idx) => {
              const other = otherParticipant(conv);
              if (!other) return null;
              const unread = unreadMap[conv._id] || 0;
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
                  <Avatar name={other.name} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn("text-sm truncate", unread > 0 ? "font-black italic text-zinc-950 dark:text-white" : "font-bold text-zinc-800 dark:text-zinc-200")}>{other.name}</p>
                      {conv.lastMessageAt && (
                        <span className="text-[9px] text-zinc-400 dark:text-zinc-500 whitespace-nowrap shrink-0 font-medium">{formatMessageTime(conv.lastMessageAt, t)}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {conv.lastSenderId && conv.lastSenderId === currentUser?._id && (
                        <CheckCheck className={cn("w-3 h-3 shrink-0", unread > 0 ? "text-blue-400" : "text-zinc-300 dark:text-zinc-600")} />
                      )}
                      <p className={cn("text-xs truncate", unread > 0 ? "font-bold text-zinc-700 dark:text-zinc-300" : "text-zinc-400 dark:text-zinc-500")}>
                        {conv.lastMessage || t("messages.no_messages")}
                      </p>
                    </div>
                  </div>
                  {unread > 0 && (
                    <span className="w-5 h-5 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center text-[8px] font-black text-white shadow-sm shrink-0">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </motion.button>
              );
            })
          )}
        </div>
      )}

      {/* Message thread */}
      {view === "thread" && activeConvId && (
        <>
          <div ref={threadRef} className="flex-1 overflow-y-auto p-4 md:p-5 space-y-1 dark:bg-zinc-900">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
                <MessageSquare className="w-10 h-10 mb-3 text-zinc-200 dark:text-zinc-700" />
                <p className="text-sm font-medium">{t("messages.no_messages_yet")}</p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{t("messages.write_first")}</p>
              </div>
            ) : (
              <>
                {messages.map((msg, i) => {
                  const isMine = msg.senderId === currentUser?._id;
                  const showAvatar = i === 0 || messages[i - 1]?.senderId !== msg.senderId;
                  const showDateSep = i === 0 || new Date(msg.createdAt).toDateString() !== new Date(messages[i - 1]?.createdAt).toDateString();
                  return (
                    <React.Fragment key={msg._id}>
                      {showDateSep && (
                        <div className="flex items-center gap-3 py-3">
                          <div className="flex-1 h-px bg-zinc-100 dark:bg-zinc-800" />
                          <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest shrink-0">{formatDateSeparator(msg.createdAt, t, language)}</span>
                          <div className="flex-1 h-px bg-zinc-100 dark:bg-zinc-800" />
                        </div>
                      )}
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.2 }}
                        className={cn("flex items-end gap-2 max-w-full", isMine ? "flex-row-reverse ml-auto" : "")}
                      >
                        {showAvatar ? (
                          <div className="shrink-0 mb-1">
                            {isMine ? (
                              <div className="w-7 h-7 bg-gradient-to-br from-zinc-600 to-zinc-800 rounded-xl flex items-center justify-center text-white text-[9px] font-black italic shadow-sm">
                                {currentUser?.name?.[0] || "U"}
                              </div>
                            ) : (
                              <div className="w-7 h-7 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center text-white text-[9px] font-black italic shadow-sm">
                                {msg.senderName?.[0] || "U"}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="w-7 shrink-0" />
                        )}
                        <div className={cn("max-w-[75%] md:max-w-[65%]", isMine ? "items-end" : "items-start")}>
                          {showAvatar && !isMine && (
                            <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 mb-1 ml-1">{msg.senderName}</p>
                          )}
                          <div className={cn(
                            "px-3.5 py-2.5 text-sm leading-relaxed overflow-wrap-anywhere shadow-sm",
                            isMine
                              ? "bg-gradient-to-br from-red-600 to-red-700 text-white rounded-2xl rounded-br-md"
                              : "bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-2xl rounded-bl-md border border-zinc-100 dark:border-zinc-700"
                          )}>
                            {msg.mediaUrl && msg.mediaType === "image" && (
                              <img
                                src={msg.mediaUrl}
                                alt=""
                                className="max-w-full rounded-lg mb-1.5 cursor-pointer"
                                onClick={() => window.open(msg.mediaUrl, "_blank")}
                                loading="lazy"
                              />
                            )}
                            {msg.mediaUrl && msg.mediaType === "video" && (
                              <video
                                src={msg.mediaUrl}
                                controls
                                className="max-w-full rounded-lg mb-1.5"
                                preload="metadata"
                              />
                            )}
                            {msg.content}
                          </div>
                          <div className={cn("flex items-center gap-1 mt-0.5 px-1", isMine ? "justify-end" : "")}>
                            <span className="text-[8px] text-zinc-400 dark:text-zinc-500 font-medium">{formatMessageTime(msg.createdAt, t)}</span>
                            {isMine && (
                              msg.readAt
                                ? <CheckCheck className="w-2.5 h-2.5 text-blue-500" />
                                : <CheckCheck className="w-2.5 h-2.5 text-zinc-300 dark:text-zinc-600" />
                            )}
                          </div>
                        </div>
                      </motion.div>
                    </React.Fragment>
                  );
                })}
              </>
            )}
          </div>

          {/* Input */}
          <div className="px-4 md:px-5 py-3.5 border-t border-zinc-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm shrink-0">
            <div className="flex items-center gap-2.5">
              <label className="shrink-0 cursor-pointer">
                <input type="file" accept="image/*,video/*" className="hidden" onChange={handleAttach} disabled={uploading} />
                <div className="w-11 h-11 bg-zinc-50/80 dark:bg-zinc-800/80 border border-zinc-100 dark:border-zinc-700 rounded-2xl flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all text-zinc-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                </div>
              </label>
              <input
                ref={inputRef}
                type="text"
                placeholder={t("messages.write_placeholder")}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                className="flex-1 bg-zinc-50/80 dark:bg-zinc-800/80 px-4 py-3 rounded-2xl border border-zinc-100 dark:border-zinc-700 text-sm outline-none focus:bg-white dark:focus:bg-zinc-800 focus:border-red-200 dark:focus:border-red-500 focus:shadow-lg focus:shadow-red-100/30 dark:focus:shadow-red-900/20 transition-all text-zinc-950 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
              />
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => handleSend()}
                disabled={!input.trim() || sending}
                className="w-11 h-11 bg-gradient-to-br from-red-600 to-red-700 text-white rounded-2xl flex items-center justify-center hover:from-red-700 hover:to-red-800 transition-all disabled:opacity-40 shrink-0 shadow-lg shadow-red-200/40 dark:shadow-red-900/30"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </motion.button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}