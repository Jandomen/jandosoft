"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, CheckCheck, Bot, Zap, Info, AlertTriangle, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

interface Notification {
  _id: string;
  type: "automation" | "system" | "alert" | "info";
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

export default function NotificationPanel({ token, onNavigate }: { token: string | null; onNavigate?: (tab: string) => void }) {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const opts: RequestInit = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : { credentials: "include" };
      const res = await fetch("/api/notifications?limit=20", opts);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {}
  }, [token]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    let es: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let closed = false;

    const connect = () => {
      if (closed) return;
      if (es) { try { es.close(); } catch {} }
      const streamUrl = token
        ? `/api/notifications/stream?token=${encodeURIComponent(token)}`
        : "/api/notifications/stream";
      es = new EventSource(streamUrl, token ? undefined : { withCredentials: true } as any);
      eventSourceRef.current = es;

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "notification:new" && data.payload) {
            setNotifications(prev => [data.payload, ...prev].slice(0, 50));
            setUnreadCount(prev => prev + 1);
          }
        } catch {}
      };

      es.onerror = () => {
        es?.close();
        eventSourceRef.current = null;
        if (!closed) {
          reconnectTimer = setTimeout(connect, 3000);
        }
      };
    };

    connect();

    return () => {
      closed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      es?.close();
      eventSourceRef.current = null;
    };
  }, [token]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const markAllRead = async () => {
    try {
      const opts: RequestInit = token
        ? { method: "PATCH", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ markAllRead: true }) }
        : { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ markAllRead: true }) };
      await fetch("/api/notifications", opts);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
  };

  const markRead = async (id: string) => {
    try {
      const opts: RequestInit = token
        ? { method: "PATCH", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ notificationId: id }) }
        : { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notificationId: id }) };
      await fetch("/api/notifications", opts);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "automation": return <Zap className="w-4 h-4 text-amber-500" />;
      case "system": return <Bot className="w-4 h-4 text-red-500" />;
      case "alert": return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getTypeBg = (type: string) => {
    switch (type) {
      case "automation": return "bg-amber-50";
      case "system": return "bg-red-50";
      case "alert": return "bg-rose-50";
      default: return "bg-blue-50";
    }
  };

  return (
    <div ref={panelRef} className="relative">
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen(!open)}
        className="relative p-2 hover:bg-zinc-50 rounded-xl transition-all"
      >
        <Bell className="w-5 h-5 text-zinc-500 hover:text-zinc-950 transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[8px] font-bold flex items-center justify-center rounded-full">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-zinc-100 shadow-2xl z-[200] overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-red-600" />
                <span className="text-sm font-bold text-zinc-950">{t("notifications.title")}</span>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-red-50 text-red-600 rounded-full text-[8px] font-bold">{unreadCount}</span>
                )}
              </div>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-[9px] font-bold text-red-600 hover:text-red-700 transition-colors uppercase tracking-wider">
                  {t("notifications.mark_all_read")}
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-10 text-center text-xs font-medium text-zinc-400 italic">
                  {t("notifications.empty")}
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n._id}
                    className={cn(
                      "px-4 py-3 border-b border-zinc-50 last:border-b-0 cursor-pointer hover:bg-zinc-50 transition-all group",
                      !n.read ? "bg-red-50/30" : ""
                    )}
                    onClick={() => {
                      markRead(n._id);
                      if (n.link) {
                        if (n.link.startsWith("/")) {
                          const sectionMatch = n.link.match(/[?&]section=([^&]+)/);
                          if (sectionMatch && onNavigate) {
                            onNavigate(sectionMatch[1]);
                          } else {
                            window.open(n.link, "_blank");
                          }
                        } else {
                          window.open(n.link, "_blank");
                        }
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5", getTypeBg(n.type))}>
                        {getTypeIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-xs leading-tight", !n.read ? "font-bold text-zinc-950" : "font-medium text-zinc-600")}>
                          {n.title}
                        </p>
                        {n.message && (
                          <p className="text-[10px] text-zinc-400 mt-0.5 line-clamp-2">{n.message}</p>
                        )}
                        <p className="text-[8px] text-zinc-300 mt-1">
                          {new Date(n.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {n.link && <ExternalLink className="w-3 h-3 text-zinc-300" />}
                        {!n.read && (
                          <button onClick={(e) => { e.stopPropagation(); markRead(n._id); }} className="p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
