"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Loader2, CheckCircle2, XCircle, Trash2, RefreshCw, Calendar, Mail, Bell, Bot, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

interface Task {
  _id: string;
  type: string;
  payload: Record<string, any>;
  runAt: string;
  status: string;
  error?: string;
  createdAt: string;
  attempts: number;
  maxAttempts: number;
}

const TASK_ICONS: Record<string, React.ReactNode> = {
  appointment_reminder: <Calendar className="w-4 h-4 md:w-5 md:h-5" />,
  email_campaign: <Mail className="w-4 h-4 md:w-5 md:h-5" />,
  store_notification: <Bell className="w-4 h-4 md:w-5 md:h-5" />,
  ai_followup: <Bot className="w-4 h-4 md:w-5 md:h-5" />,
};

const TASK_COLORS: Record<string, string> = {
  appointment_reminder: "text-amber-600 bg-amber-50",
  email_campaign: "text-blue-600 bg-blue-50",
  store_notification: "text-emerald-600 bg-emerald-50",
  ai_followup: "text-purple-600 bg-purple-50",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock className="w-3.5 h-3.5 md:w-4 md:h-4" />,
  processing: <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin" />,
  done: <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4" />,
  failed: <XCircle className="w-3.5 h-3.5 md:w-4 md:h-4" />,
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  processing: "Ejecutando",
  done: "Completado",
  failed: "Falló",
};

export default function ScheduledTasksPanel() {
  const { t } = useLanguage();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/scheduler/tasks");
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleDelete = async (taskId: string) => {
    try {
      const res = await fetch(`/api/scheduler/tasks?id=${taskId}`, { method: "DELETE" });
      if (res.ok) {
        setTasks(prev => prev.filter(t => t._id !== taskId));
      }
    } catch {
      // silent
    }
  };

  const filteredTasks = filter === "all" ? tasks : tasks.filter(t => t.status === filter);

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      appointment_reminder: "Recordatorio de Cita",
      email_campaign: "Campaña Email",
      store_notification: "Notificación Tienda",
      ai_followup: "Followup IA",
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <h4 className="text-sm md:text-base font-black italic text-zinc-950 uppercase tracking-tighter">
            Tareas Programadas
          </h4>
          <span className="text-[10px] font-black text-zinc-400 italic">
            ({tasks.length})
          </span>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={fetchTasks}
          className="p-2 hover:bg-zinc-50 rounded-xl transition-all"
        >
          <RefreshCw className={cn("w-4 h-4 text-zinc-400", loading && "animate-spin")} />
        </motion.button>
      </div>

      <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
        {["all", "pending", "processing", "done", "failed"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[9px] md:text-[10px] font-black italic uppercase transition-all whitespace-nowrap",
              filter === f
                ? "bg-red-600 text-white shadow-md"
                : "bg-zinc-50 text-zinc-500 hover:bg-zinc-100"
            )}
          >
            {f === "all" ? "Todas" : STATUS_LABELS[f] || f}
          </button>
        ))}
      </div>

      {loading && tasks.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-red-600 animate-spin" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="py-10 text-center italic font-black uppercase tracking-widest text-zinc-200 text-xs">
          No hay tareas programadas
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {filteredTasks.map((task) => (
              <motion.div
                key={task._id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className={cn(
                  "flex items-start gap-3 p-3 md:p-4 rounded-xl md:rounded-2xl border transition-all",
                  task.status === "done" ? "bg-zinc-50 border-zinc-100 opacity-70" :
                  task.status === "failed" ? "bg-red-50 border-red-200" :
                  "bg-white border-zinc-100"
                )}
              >
                <div className={cn(
                  "p-2 md:p-2.5 rounded-lg md:rounded-xl shrink-0",
                  TASK_COLORS[task.type] || "text-zinc-600 bg-zinc-50"
                )}>
                  {TASK_ICONS[task.type] || <Zap className="w-4 h-4 md:w-5 md:h-5" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black italic text-zinc-950 text-xs md:text-sm truncate">
                      {getTypeLabel(task.type)}
                    </span>
                    <span className={cn(
                      "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[7px] md:text-[8px] font-black uppercase italic",
                      task.status === "pending" ? "text-amber-700 bg-amber-50" :
                      task.status === "processing" ? "text-blue-700 bg-blue-50" :
                      task.status === "done" ? "text-emerald-700 bg-emerald-50" :
                      "text-red-700 bg-red-50"
                    )}>
                      {STATUS_ICONS[task.status]}
                      {STATUS_LABELS[task.status] || task.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mt-1 flex-wrap text-[10px] md:text-[11px] text-zinc-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(task.runAt).toLocaleString("es-MX", {
                        day: "2-digit", month: "2-digit", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </span>
                    {task.attempts > 0 && (
                      <span>Intento {task.attempts}/{task.maxAttempts}</span>
                    )}
                  </div>

                  {task.error && (
                    <p className="text-[10px] md:text-[11px] text-red-500 mt-1 italic">
                      {task.error}
                    </p>
                  )}
                </div>

                {(task.status === "pending" || task.status === "failed") && (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleDelete(task._id)}
                    className="p-1.5 text-zinc-300 hover:text-rose-500 transition-all shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </motion.button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
