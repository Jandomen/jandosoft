"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  MessageSquare, Send, Search, Plus, ArrowLeft, User, Users, Trash2,
  CheckCheck, Clock, Loader2, X, Phone, Mail, MoreHorizontal, Bot
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSSE } from "@/lib/hooks/useSSE";

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
  createdAt: string;
  readAt: string | null;
}

type PanelView = "list" | "thread" | "search" | "contacts";

export default function MessagesPanel({ onClose }: { onClose?: () => void }) {
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
  const threadRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get current user
  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(data => {
        if (data.user) setCurrentUser(data.user);
      })
      .catch(() => {});
  }, []);

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations");
      const data = await res.json();
      if (data.conversations) setConversations(data.conversations);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load messages for active conversation
  const loadMessages = useCallback(async (convId: string) => {
    try {
      const res = await fetch(`/api/conversations/${convId}/messages`);
      const data = await res.json();
      if (data.messages) setMessages(data.messages);
      // Mark as read
      fetch(`/api/conversations/${convId}/read`, { method: "PATCH" }).catch(() => {});
    } catch {}
  }, []);

  useEffect(() => {
    if (activeConvId) {
      loadMessages(activeConvId);
    }
  }, [activeConvId, loadMessages]);

  // SSE for real-time
  const handleSSEMessage = useCallback((event: any) => {
    if (event.type === "message:new") {
      const msg = event.payload?.message;
      if (msg && msg.conversationId === activeConvId) {
        setMessages(prev => [...prev, msg]);
        // Mark as read immediately
        fetch(`/api/conversations/${activeConvId}/read`, { method: "PATCH" }).catch(() => {});
      }
      loadConversations();
    }
    if (event.type === "message:read") {
      if (event.payload?.conversationId === activeConvId) {
        setMessages(prev => prev.map(m => !m.readAt && m.senderId !== currentUser?._id
          ? { ...m, readAt: event.payload.readAt } : m));
      }
    }
    if (event.type === "conversation:new") {
      loadConversations();
    }
  }, [activeConvId, currentUser, loadConversations]);

  useSSE(activeConvId, handleSSEMessage);

  // Auto-scroll thread
  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [messages]);

  // Search users
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

  // Load contacts
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

  // Create conversation
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

  // Add contact
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

  // Remove contact
  const removeContact = async (id: string) => {
    try {
      await fetch(`/api/contacts?id=${id}`, { method: "DELETE" });
      loadContacts();
    } catch {}
  };

  // Send message
  const handleSend = async () => {
    if (!input.trim() || !activeConvId || sending) return;
    setSending(true);
    const text = input.trim();
    setInput("");
    try {
      await fetch(`/api/conversations/${activeConvId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
    } catch {} finally {
      setSending(false);
    }
  };

  const otherParticipant = (conv: Conversation): Participant | null => {
    if (!currentUser) return null;
    return conv.participants.find(p => p.userId !== currentUser._id) || null;
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "ahora";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };

  const unreadCount = (conv: Conversation): number => {
    if (!currentUser) return 0;
    return messages.filter(m => m.senderId !== currentUser._id && !m.readAt).length;
  };

  return (
    <div className="flex flex-col h-full w-full bg-white rounded-2xl border border-zinc-100 overflow-hidden shadow-sm max-h-[80vh] md:max-h-[600px]">
      {/* Header */}
      <div className="px-3 md:px-4 py-3 border-b border-zinc-100 bg-white flex items-center gap-2 shrink-0">
        {view === "thread" ? (
          <>
            <button
              onClick={() => { setView("list"); setActiveConvId(null); }}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 rounded-lg transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center text-red-600 shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black italic text-zinc-950 truncate">
                {conversations.find(c => c._id === activeConvId)
                  ? otherParticipant(conversations.find(c => c._id === activeConvId)!)?.name || "Usuario"
                  : "Cargando..."}
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center text-white shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-black italic text-zinc-950 uppercase tracking-tight">Mensajes</h3>
            <div className="ml-auto flex items-center gap-1">
              <button
                onClick={() => { setView("contacts"); loadContacts(); }}
                className={cn("p-1.5 rounded-lg transition-all", view === "contacts" ? "bg-red-50 text-red-600" : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50")}
              >
                <Users className="w-4 h-4" />
              </button>
              <button
                onClick={() => { setView("search"); setSearchQuery(""); setSearchResults([]); setTimeout(() => searchInputRef.current?.focus(), 100); }}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 rounded-lg transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
              {onClose && (
                <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 rounded-lg transition-all">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Search view */}
      {view === "search" && (
        <div className="flex-1 flex flex-col p-3 md:p-4">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Buscar por email o nombre..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 rounded-xl border border-zinc-100 text-sm outline-none focus:bg-white focus:border-red-200 transition-all"
            />
          </div>
          <div className="flex-1 overflow-y-auto space-y-1">
            {searching && (
              <div className="flex items-center justify-center py-8 text-zinc-400">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            )}
            {!searching && searchQuery.length >= 2 && searchResults.length === 0 && (
              <p className="text-center text-sm text-zinc-400 py-8">No se encontraron usuarios</p>
            )}
            {searchResults.map(user => (
              <button
                key={user._id}
                onClick={() => createConversation(user)}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-zinc-50 transition-all text-left"
              >
                <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center text-red-600 shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-950 truncate">{user.name || user.email.split("@")[0]}</p>
                  <p className="text-xs text-zinc-400 truncate">{user.email}</p>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); addContact(user.email); }}
                  className="p-1.5 text-zinc-300 hover:text-red-600 rounded-lg hover:bg-red-50 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </button>
            ))}
            {searchQuery.length < 2 && (
              <p className="text-center text-xs text-zinc-400 py-8">Escribe al menos 2 caracteres para buscar</p>
            )}
          </div>
        </div>
      )}

      {/* Contacts view */}
      {view === "contacts" && (
        <div className="flex-1 overflow-y-auto p-3 md:p-4">
          {contacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
              <Users className="w-10 h-10 mb-3" />
              <p className="text-sm font-medium">Sin contactos aún</p>
              <p className="text-xs mt-1">Busca usuarios y agrégalos a tus contactos</p>
              <button
                onClick={() => { setView("search"); setSearchQuery(""); setTimeout(() => searchInputRef.current?.focus(), 100); }}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-black italic hover:bg-red-700 transition-all"
              >
                Buscar usuarios
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              {contacts.map(contact => (
                <div key={contact._id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-zinc-50 transition-all group">
                  <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center text-red-600 shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-950 truncate">{contact.contactName}</p>
                    <p className="text-xs text-zinc-400 truncate">{contact.contactEmail}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      onClick={() => createConversation({ _id: contact.contactUserId, email: contact.contactEmail, name: contact.contactName })}
                      className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => removeContact(contact._id)}
                      className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Conversation list */}
      {view === "list" && (
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-zinc-400">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
              <MessageSquare className="w-10 h-10 mb-3" />
              <p className="text-sm font-medium">Sin conversaciones</p>
              <p className="text-xs mt-1">Busca un usuario para iniciar un chat</p>
              <button
                onClick={() => { setView("search"); setSearchQuery(""); setTimeout(() => searchInputRef.current?.focus(), 100); }}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-black italic hover:bg-red-700 transition-all"
              >
                Nueva conversación
              </button>
            </div>
          ) : (
            conversations.map(conv => {
              const other = otherParticipant(conv);
              if (!other) return null;
              return (
                <button
                  key={conv._id}
                  onClick={() => { setActiveConvId(conv._id); setView("thread"); }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 md:px-4 py-2.5 md:py-3 transition-all text-left hover:bg-zinc-50 border-b border-zinc-50 last:border-0",
                    activeConvId === conv._id && "bg-red-50"
                  )}
                >
                  <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-600 shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-black italic text-zinc-950 truncate">{other.name}</p>
                      {conv.lastMessageAt && (
                        <span className="text-[10px] text-zinc-400 whitespace-nowrap shrink-0">{formatTime(conv.lastMessageAt)}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {conv.lastSenderId && conv.lastSenderId === currentUser?._id && (
                        <CheckCheck className="w-3 h-3 text-zinc-300 shrink-0" />
                      )}
                      <p className="text-xs text-zinc-400 truncate">{conv.lastMessage || "Sin mensajes"}</p>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}

      {/* Message thread */}
      {view === "thread" && activeConvId && (
        <>
          <div ref={threadRef} className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
                <MessageSquare className="w-8 h-8 mb-2" />
                <p className="text-xs">Ningún mensaje aún. Escribe algo...</p>
              </div>
            ) : (
              messages.map((msg, i) => {
                const isMine = msg.senderId === currentUser?._id;
                const showAvatar = i === 0 || messages[i - 1]?.senderId !== msg.senderId;
                return (
                  <div key={msg._id} className={cn("flex items-end gap-1.5 md:gap-2", isMine ? "flex-row-reverse" : "")}>
                    {showAvatar ? (
                      <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-black", isMine ? "bg-zinc-200 text-zinc-600" : "bg-red-50 text-red-600")}>
                        {isMine ? currentUser?.name?.[0] || "U" : msg.senderName?.[0] || "U"}
                      </div>
                    ) : <div className="w-6 shrink-0" />}
                    <div className={cn("max-w-[80%] md:max-w-[70%]")}>
                      <div className={cn(
                        "px-3 py-2 rounded-2xl text-xs md:text-sm leading-relaxed overflow-wrap-anywhere",
                        isMine
                          ? "bg-red-600 text-white rounded-br-md"
                          : "bg-zinc-50 text-zinc-700 rounded-bl-md border border-zinc-100"
                      )}>
                        {msg.content}
                      </div>
                      <div className={cn("flex items-center gap-1 mt-0.5 px-1", isMine ? "justify-end" : "")}>
                        <span className="text-[9px] text-zinc-400">{formatTime(msg.createdAt)}</span>
                        {isMine && (
                          msg.readAt
                            ? <CheckCheck className="w-3 h-3 text-blue-500" />
                            : <CheckCheck className="w-3 h-3 text-zinc-300" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Input */}
          <div className="px-3 md:px-4 py-3 border-t border-zinc-100 bg-white shrink-0">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                placeholder="Escribe un mensaje..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSend()}
                className="flex-1 bg-zinc-50 px-3.5 py-2.5 rounded-xl border border-zinc-100 text-sm outline-none focus:bg-white focus:border-red-200 transition-all"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="w-9 h-9 bg-red-600 text-white rounded-xl flex items-center justify-center hover:bg-red-700 transition-all disabled:opacity-50 shrink-0"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
