"use client";

import { useState, useCallback, useEffect } from "react";

export interface StoredMessage {
  role: "user" | "bot";
  content: string;
  timestamp: number;
}

export interface ConversationMeta {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function makeKey(email: string): string {
  return `jandosoft_conversations_${email || "default"}`;
}

function convKey(email: string, id: string): string {
  return `jandosoft_conv_${email || "default"}_${id}`;
}

function activeKey(email: string): string {
  return `jandosoft_active_conv_${email || "default"}`;
}

function initialBotMessage(): StoredMessage {
  return {
    role: "bot",
    content: "¡Hola! Soy el asistente IA de Jandosoft. ¿En qué puedo ayudarte hoy?",
    timestamp: Date.now(),
  };
}

export function useConversations(email?: string) {
  const [convos, setConvos] = useState<ConversationMeta[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Load metadata on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(makeKey(email || "default"));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setConvos(parsed);
        }
      }
    } catch {}
    try {
      const raw = localStorage.getItem(activeKey(email || "default"));
      if (raw) {
        setActiveId(raw);
      }
    } catch {}
    setLoaded(true);
  }, [email]);

  // Persist metadata
  useEffect(() => {
    if (loaded) {
      try {
        localStorage.setItem(makeKey(email || "default"), JSON.stringify(convos));
      } catch {}
    }
  }, [convos, loaded, email]);

  const persistActive = useCallback((id: string | null) => {
    setActiveId(id);
    try {
      if (id) {
        localStorage.setItem(activeKey(email || "default"), id);
      } else {
        localStorage.removeItem(activeKey(email || "default"));
      }
    } catch {}
  }, [email]);

  const loadMessages = useCallback((id: string): StoredMessage[] => {
    try {
      const raw = localStorage.getItem(convKey(email || "default", id));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [initialBotMessage()];
  }, [email]);

  const saveMessages = useCallback((id: string, messages: StoredMessage[]) => {
    try {
      localStorage.setItem(convKey(email || "default", id), JSON.stringify(messages));
    } catch {}
    setConvos(prev => prev.map(c => c.id === id ? { ...c, updatedAt: Date.now(), messageCount: messages.length } : c));
  }, [email]);

  const createConversation = useCallback((firstMessage?: string): string => {
    const id = generateId();
    const title = firstMessage
      ? firstMessage.length > 45
        ? firstMessage.slice(0, 42) + "..."
        : firstMessage
      : "Nueva conversación";
    const now = Date.now();
    const meta: ConversationMeta = { id, title, createdAt: now, updatedAt: now, messageCount: 1 };
    setConvos(prev => [meta, ...prev]);
    const msgs = firstMessage
      ? [initialBotMessage(), { role: "user" as const, content: firstMessage, timestamp: now }]
      : [initialBotMessage()];
    saveMessages(id, msgs);
    persistActive(id);
    return id;
  }, [saveMessages, persistActive]);

  const deleteConversation = useCallback((id: string) => {
    setConvos(prev => prev.filter(c => c.id !== id));
    try {
      localStorage.removeItem(convKey(email || "default", id));
    } catch {}
    if (activeId === id) {
      const remaining = convos.filter(c => c.id !== id);
      if (remaining.length > 0) {
        persistActive(remaining[0].id);
      } else {
        const newId = createConversation();
        persistActive(newId);
      }
    }
  }, [activeId, convos, createConversation, persistActive, email]);

  const switchConversation = useCallback((id: string) => {
    persistActive(id);
  }, [persistActive]);

  const updateTitle = useCallback((id: string, title: string) => {
    setConvos(prev => prev.map(c => c.id === id ? { ...c, title } : c));
  }, []);

  const getActiveMessages = useCallback((): StoredMessage[] => {
    if (!activeId) return [initialBotMessage()];
    return loadMessages(activeId);
  }, [activeId, loadMessages]);

  // Ensure at least one conversation exists
  useEffect(() => {
    if (loaded && convos.length === 0) {
      createConversation();
    }
  }, [loaded, convos.length, createConversation]);

  return {
    convos,
    activeId,
    loaded,
    createConversation,
    deleteConversation,
    switchConversation,
    loadMessages,
    saveMessages,
    getActiveMessages,
    updateTitle,
  };
}
