"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

export const Toast = ({ message, type, onClose }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const config = {
    success: { icon: <CheckCircle2 className="w-5 h-5" />, bg: "bg-emerald-100 dark:bg-emerald-950/60", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-300 dark:border-emerald-800/60" },
    error: { icon: <AlertCircle className="w-5 h-5" />, bg: "bg-rose-50 dark:bg-rose-950/50", text: "text-rose-800 dark:text-rose-300", border: "border-rose-200 dark:border-rose-800/60" },
    info: { icon: <Info className="w-5 h-5" />, bg: "bg-blue-50 dark:bg-yellow-900/20", text: "text-blue-800 dark:text-yellow-300", border: "border-blue-200 dark:border-yellow-700/50" },
  };

  const { icon, bg, text, border } = config[type];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn("fixed bottom-10 right-10 z-[200] flex items-center gap-4 px-6 py-4 rounded-2xl border shadow-2xl", bg, border)}
    >
      <div className={text}>{icon}</div>
      <p className={cn("text-sm font-black italic", text)}>{message}</p>
      <button onClick={onClose} className="ml-2 hover:opacity-50 transition-opacity"><X className="w-4 h-4" /></button>
    </motion.div>
  );
};

export const useToast = () => {
    const [toast, setToast] = useState<{ message: string, type: ToastType } | null>(null);
    const showToast = (message: string, type: ToastType = "info") => {
      setToast({ message, type });
      playNotificationSound(type);
    };
    const hideToast = () => setToast(null);

    const ToastComponent = toast ? <Toast message={toast.message} type={toast.type} onClose={hideToast} /> : null;

    return { showToast, ToastComponent };
};

import { cn, playNotificationSound } from "@/lib/utils";
