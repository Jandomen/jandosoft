"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  User,
  ShieldCheck,
  Clock,
  AlertCircle,
  Plus,
  Download,
  FileText,
  Store,
  Building2,
  X,
  CheckCircle2,
  Zap,
  Bot,
  Layers,
  ArrowRight,
  Globe,
  CalendarDays,
  List,
  Loader2,
  Calendar as CalendarIcon,
  Search,
  Edit3,
  Trash2,
  Save,
  Ban,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { generateInvoicePDF } from "@/lib/pdf-utils";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

interface UserDashboardProps {
  user: {
    email: string;
    subscription: string | null;
    subscriptionExpiry: Date | null;
    isSuspended: boolean;
  };

  userStores: any[];
  transactions: any[];

  onNavigate: (tab: any) => void;

  onSelectStore?: (storeId: string | number) => void;
  onCreateStore?: (store: any) => void;
  onEditStore?: (storeId: string | number, data: any) => void;
  onDeleteStore?: (storeId: string | number) => void;
}

const MAX_FREE_STORES = 3;

export default function UserDashboard({
  user,
  userStores,
  transactions,
  onNavigate,
  onSelectStore,
  onCreateStore,
  onEditStore,
  onDeleteStore,
}: UserDashboardProps) {
  const { language, setLanguage, t } = useLanguage();
  const expiryDate = user.subscriptionExpiry
    ? new Date(user.subscriptionExpiry)
    : null;

  const isExpired = expiryDate
    ? new Date() > expiryDate
    : false;

  const daysLeft = expiryDate
    ? Math.ceil(
        (expiryDate.getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  const [showCreateStore, setShowCreateStore] = useState(false);

  const [editingStoreId, setEditingStoreId] =
    useState<string | number | null>(null);

  const [confirmDelete, setConfirmDelete] =
    useState<string | number | null>(null);

  const [storeForm, setStoreForm] = useState({
    name: "",
    desc: "",
    industry: "tecnologia",
    type: "",
  });

  const [step, setStep] = useState(1);

  const [myInvoices, setMyInvoices] = useState<any[]>([]);

  const isFree = !user.subscription || isExpired;

  const stores = Array.isArray(userStores)
    ? userStores
    : [];

  const storeCount = stores.length;

  const maxStores = isFree
    ? MAX_FREE_STORES
    : 999;

  const atLimit = storeCount >= maxStores;

  const editingStore = editingStoreId
    ? stores.find(
        (s) =>
          s._id === editingStoreId ||
          s.id === editingStoreId
      )
    : null;

  useEffect(() => {
    if (user?.email) {
      fetch(
        `/api/invoices?email=${encodeURIComponent(
          user.email
        )}`
      )
        .then((res) => res.json())
        .then((data) =>
          setMyInvoices(data.invoices || [])
        )
        .catch(() => {});
    }
  }, [user?.email]);

  const [appointments, setAppointments] = useState<any[]>([]);
  const [apptLoading, setApptLoading] = useState(true);
  const [apptStats, setApptStats] = useState({ today: 0, upcoming: 0, completed: 0, cancelled: 0 });
  const [showApptForm, setShowApptForm] = useState(false);
  const [editingApptId, setEditingApptId] = useState<string | null>(null);
  const [apptForm, setApptForm] = useState({
    storeId: "", customerName: "", customerEmail: "", customerPhone: "",
    date: "", time: "", duration: "60", notes: "", status: "pending",
  });

  const getStoreName = (id: string) => {
    if (!id) return "";
    const s = stores.find(st => (st._id === id || st.id === id));
    return s?.name || "";
  };
  const [apptSaving, setApptSaving] = useState(false);

  const loadAppointments = useCallback(async () => {
    if (!user?.email) return;
    try {
      setApptLoading(true);
      const res = await fetch(`/api/user-appointments?ownerEmail=${encodeURIComponent(user.email)}&limit=200`);
      const data = await res.json();
      setAppointments(data.appointments || []);
    } catch {
      setAppointments([]);
    } finally {
      setApptLoading(false);
    }
  }, [user?.email]);

  const loadApptStats = useCallback(async () => {
    if (!user?.email) return;
    try {
      const res = await fetch(`/api/user-appointments/stats?ownerEmail=${encodeURIComponent(user.email)}`);
      const data = await res.json();
      if (data.today !== undefined) setApptStats(data);
    } catch {}
  }, [user?.email]);

  useEffect(() => { loadAppointments(); loadApptStats(); }, [loadAppointments, loadApptStats]);

  const handleSaveAppt = async () => {
    if (!apptForm.date || !apptForm.time || !apptForm.customerName) return;
    setApptSaving(true);
    try {
      const payload = {
        storeId: apptForm.storeId || undefined,
        ownerEmail: user?.email,
        createdBy: "owner",
        customerInfo: { name: apptForm.customerName, email: apptForm.customerEmail, phone: apptForm.customerPhone },
        service: { id: 0, name: "Personal", price: 0, duration: parseInt(apptForm.duration) || 60 },
        date: apptForm.date,
        time: apptForm.time,
        duration: parseInt(apptForm.duration) || 60,
        notes: apptForm.notes,
        status: apptForm.status,
      };
      if (editingApptId) {
        await fetch(`/api/appointments/${editingApptId}`, {
          method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/appointments", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
        });
      }
      setShowApptForm(false);
      setEditingApptId(null);
      loadAppointments();
      loadApptStats();
    } catch {}
    setApptSaving(false);
  };

  const handleDeleteAppt = async (id: string) => {
    try {
      await fetch(`/api/appointments/${id}`, { method: "DELETE" });
      loadAppointments();
      loadApptStats();
    } catch {}
  };

  const handleApptStatus = async (id: string, status: string) => {
    try {
      await fetch(`/api/appointments/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }),
      });
      loadAppointments();
      loadApptStats();
    } catch {}
  };

  const openCreateAppt = () => {
    setEditingApptId(null);
    const today = new Date().toISOString().split("T")[0];
    const firstStoreId = stores.length > 0 ? (stores[0]._id || stores[0].id) : "";
    setApptForm({ storeId: firstStoreId, customerName: "", customerEmail: "", customerPhone: "", date: today, time: "10:00", duration: "60", notes: "", status: "pending" });
    setShowApptForm(true);
  };

  const openEditAppt = (a: any) => {
    setEditingApptId(a._id);
    setApptForm({
      storeId: a.storeId || "",
      customerName: a.customerInfo?.name || "",
      customerEmail: a.customerInfo?.email || "",
      customerPhone: a.customerInfo?.phone || "",
      date: a.date,
      time: a.time,
      duration: a.duration?.toString() || "60",
      notes: a.notes || "",
      status: a.status || "pending",
    });
    setShowApptForm(true);
  };

  const todayStr = new Date().toISOString().split("T")[0];
  const apptsToday = appointments.filter(a => a.date === todayStr);
  const upcomingAppts = appointments.filter(a => a.date >= todayStr && (a.status === "pending" || a.status === "confirmed"));

  const [apptViewMode, setApptViewMode] = useState<"list" | "calendar">("calendar");
  const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const DAYS = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];

  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [calDate, setCalDate] = useState(todayStr);

  const getMonthDays = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  };

  const getApptsForDay = (year: number, month: number, day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return appointments.filter(a => a.date === dateStr);
  };

  const monthDays = getMonthDays(calYear, calMonth);

  const prevMonth = () => { if (calMonth === 0) { setCalYear(calYear - 1); setCalMonth(11); } else setCalMonth(calMonth - 1); };
  const nextMonth = () => { if (calMonth === 11) { setCalYear(calYear + 1); setCalMonth(0); } else setCalMonth(calMonth + 1); };

  const openCreateStore = () => {
    setEditingStoreId(null);

    setStoreForm({
      name: "",
      desc: "",
      industry: "tecnologia",
      type: "",
    });

    setStep(1);

    setShowCreateStore(true);
  };

  const openEditStore = (store: any) => {
    setEditingStoreId(store._id || store.id);

    setStoreForm({
      name: store.name,
      desc: store.desc || "",
      industry: store.industry || "tecnologia",
      type: store.type || "",
    });

    setStep(2);

    setShowCreateStore(true);
  };

  const handleCreateStore = () => {
    if (!storeForm.type || !storeForm.name)
      return;

    const typeLabels: Record<string, string> = {
      ventas: "Sistema de Ventas",
      saas: "SaaS",
      crm: "CRM",
      tienda: "Tienda Online",
      educacion: "Plataforma Educativa",
      otro: "Otro",
    };

    if (editingStoreId && editingStore) {
      onEditStore?.(editingStoreId, {
        ...editingStore,
        name: storeForm.name,
        desc: storeForm.desc,
        industry: storeForm.industry,
        type: storeForm.type,
        typeLabel:
          typeLabels[storeForm.type] ||
          storeForm.type,
      });
    } else {
      onCreateStore?.({
        name: storeForm.name,
        desc: storeForm.desc,
        industry: storeForm.industry,
        type: storeForm.type,
        typeLabel:
          typeLabels[storeForm.type] ||
          storeForm.type,
        createdAt: new Date().toISOString(),
        ownerEmail: user.email,
      });
    }

    setStoreForm({
      name: "",
      desc: "",
      industry: "tecnologia",
      type: "",
    });

    setEditingStoreId(null);

    setStep(1);

    setShowCreateStore(false);
  };

  const handleDeleteStore = (
    storeId: string | number
  ) => {
    onDeleteStore?.(storeId);

    setConfirmDelete(null);

    setShowCreateStore(false);
  };

  if (user.isSuspended) {
    return (
      <div className="max-w-2xl mx-auto py-16 max-[400px]:py-16 py-20 text-center space-y-6 max-[400px]:space-y-6 space-y-8 px-4">
        <div className="w-20 h-20 max-[400px]:w-20 max-[400px]:h-20 w-24 h-24 bg-red-50 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-red-100">
          <AlertCircle className="w-10 h-10 max-[400px]:w-10 max-[400px]:h-10 w-12 h-12" />
        </div>

        <h2 className="text-2xl max-[400px]:text-2xl text-3xl sm:text-4xl font-black italic text-zinc-950 uppercase tracking-tight">
          {t("user.suspended_title")}
        </h2>

        <p className="text-zinc-500 font-medium text-sm max-[400px]:text-sm text-base sm:text-lg italic">
          {t("user.suspended_desc")}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-5 max-[400px]:space-y-5 space-y-6 sm:space-y-10 pb-20 px-3 sm:px-6">

      {/* HEADER */}

      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 max-[400px]:gap-5 gap-6 bg-zinc-950 p-5 sm:p-8 lg:p-10 rounded-[2rem] sm:rounded-[3rem] text-white shadow-3xl relative overflow-hidden">

        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/20 rounded-full blur-[100px] -mr-32 -mt-32" />

        <div className="relative z-10 flex items-center gap-4 sm:gap-6">

          <div className="w-14 h-14 max-[400px]:w-14 max-[400px]:h-14 w-16 h-16 sm:w-20 sm:h-20 bg-white/10 backdrop-blur-xl rounded-3xl flex items-center justify-center border border-white/10 shadow-2xl shrink-0">
            <User className="w-7 h-7 max-[400px]:w-7 max-[400px]:h-7 w-8 h-8 sm:w-10 sm:h-10 text-red-500" />
          </div>

          <div className="min-w-0">
            <h2 className="text-xl max-[400px]:text-xl text-2xl sm:text-3xl font-black italic tracking-tight uppercase break-all">
              {user?.email?.split?.("@")?.[0] ||
                user?.email ||
                t("user.fallback")}
            </h2>

            <div className="flex flex-wrap items-center gap-1.5 max-[400px]:gap-1.5 gap-2 mt-1.5 max-[400px]:mt-1.5 mt-2">

              <span
                className={cn(
                  "px-2 max-[400px]:px-2 px-3 py-1 rounded-full text-[9px] max-[400px]:text-[9px] text-[10px] font-black uppercase tracking-wide sm:tracking-widest italic",
                  user.subscription
                    ? "bg-red-600 text-white"
                    : "bg-zinc-800 text-zinc-400"
                )}
              >
                  {user.subscription
                    ? `${t("user.plan")} ${user.subscription.toUpperCase()}`
                    : t("user.free")}
              </span>

              {user.subscription && (
                <span
                  className={cn(
                    "flex items-center gap-1 text-[9px] max-[400px]:text-[9px] text-[10px] font-black uppercase tracking-wide sm:tracking-widest italic",
                    isExpired
                      ? "text-red-500"
                      : "text-emerald-500"
                  )}
                >
                  <Clock className="w-2.5 h-2.5 max-[400px]:w-2.5 max-[400px]:h-2.5 w-3 h-3" />
                  {isExpired
                    ? t("user.expired")
                    : t("user.days_left").replace("{n}", String(daysLeft))}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row gap-3 w-full lg:w-auto">

          <div className="flex items-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10">
            <Globe className="w-3.5 h-3.5 text-white/60" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="bg-transparent text-[10px] font-black italic text-white outline-none cursor-pointer uppercase tracking-wider"
            >
              <option className="text-zinc-950" value="es">Español</option>
              <option className="text-zinc-950" value="en">English</option>
              <option className="text-zinc-950" value="fr">Français</option>
              <option className="text-zinc-950" value="zh">中文</option>
              <option className="text-zinc-950" value="hi">हिन्दी</option>
            </select>
          </div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onNavigate("chat")}
            className="w-full sm:w-auto px-5 py-3 bg-white text-zinc-950 rounded-2xl font-black text-[10px] max-[400px]:text-[10px] text-xs uppercase tracking-wide sm:tracking-widest hover:bg-red-600 hover:text-white transition-all italic shadow-2xl"
          >
            {t("user.ai_support")}
          </motion.button>
        </div>
      </header>

      {/* PLAN */}

      {isFree && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-amber-50 to-amber-100/50 border border-amber-200 p-5 sm:p-8 rounded-[2rem] sm:rounded-[3rem] space-y-5 max-[400px]:space-y-5 space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 max-[400px]:gap-4 gap-5">

            <div className="flex items-center gap-3 max-[400px]:gap-3 gap-4">

              <div className="w-12 h-12 max-[400px]:w-12 max-[400px]:h-12 w-14 h-14 bg-amber-600 text-white rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                <Zap className="w-6 h-6 max-[400px]:w-6 max-[400px]:h-6 w-7 h-7" />
              </div>

              <div>
                <h4 className="text-lg max-[400px]:text-lg text-xl font-black italic text-zinc-950 uppercase tracking-tight">
                  {t("user.free_plan_title")}
                </h4>

                <p className="text-[9px] max-[400px]:text-[9px] text-[10px] font-bold text-amber-600 uppercase tracking-wide sm:tracking-widest italic">
                  {t("user.free_plan_subtitle")}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-[400px]:gap-3 gap-4">

            <div className="bg-white/80 p-4 max-[400px]:p-4 p-5 rounded-2xl border border-amber-200/50 flex items-center gap-3 max-[400px]:gap-3 gap-4">
              <Layers className="w-7 h-7 max-[400px]:w-7 max-[400px]:h-7 w-8 h-8 text-amber-500 shrink-0" />
              <div>
                <p className="text-[8px] max-[400px]:text-[8px] text-[9px] font-black text-zinc-400 uppercase tracking-wide sm:tracking-widest italic">
                  {t("user.data")}
                </p>

                <p className="text-base max-[400px]:text-base text-lg font-black italic text-zinc-950">
                  {t("user.records").replace("{n}", "10")}
                </p>
              </div>
            </div>

            <div className="bg-white/80 p-4 max-[400px]:p-4 p-5 rounded-2xl border border-amber-200/50 flex items-center gap-3 max-[400px]:gap-3 gap-4">
              <Bot className="w-7 h-7 max-[400px]:w-7 max-[400px]:h-7 w-8 h-8 text-amber-500 shrink-0" />
              <div>
                <p className="text-[8px] max-[400px]:text-[8px] text-[9px] font-black text-zinc-400 uppercase tracking-wide sm:tracking-widest italic">
                  {t("user.ai_chat")}
                </p>

                <p className="text-base max-[400px]:text-base text-lg font-black italic text-zinc-950">
                  {t("user.questions").replace("{n}", "10")}
                </p>
              </div>
            </div>

            <div className="bg-white/80 p-4 max-[400px]:p-4 p-5 rounded-2xl border border-amber-200/50 flex items-center gap-3 max-[400px]:gap-3 gap-4">
              <Store className="w-7 h-7 max-[400px]:w-7 max-[400px]:h-7 w-8 h-8 text-amber-500 shrink-0" />
              <div>
                <p className="text-[8px] max-[400px]:text-[8px] text-[9px] font-black text-zinc-400 uppercase tracking-wide sm:tracking-widest italic">
                  {t("user.stores_label")}
                </p>

                <p className="text-base max-[400px]:text-base text-lg font-black italic text-zinc-950">
                  {storeCount}/{maxStores}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* STORES */}

      <div className="space-y-4 max-[400px]:space-y-4 space-y-5">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 max-[400px]:gap-3 gap-4">

          <div>
            <h3 className="text-xl max-[400px]:text-xl text-2xl font-black italic text-zinc-950 uppercase tracking-tight">
              {t("user.my_stores")}
            </h3>

            <p className="text-[9px] max-[400px]:text-[9px] text-[10px] font-black text-zinc-400 uppercase tracking-wide sm:tracking-widest mt-0.5 max-[400px]:mt-0.5 mt-1 italic">
              {storeCount} {t("user.of")}{" "}
              {isFree
                ? maxStores
                : t("user.unlimited")}{" "}
              {t("user.created")}
            </p>
          </div>

          {!atLimit && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={openCreateStore}
              className="w-full sm:w-auto px-5 max-[400px]:px-5 px-6 py-2.5 max-[400px]:py-2.5 py-3 bg-red-600 text-white rounded-2xl font-black text-[10px] max-[400px]:text-[10px] text-xs italic hover:bg-red-700 transition-all shadow-xl flex items-center justify-center gap-2"
            >
              <Plus className="w-3.5 h-3.5 max-[400px]:w-3.5 max-[400px]:h-3.5 w-4 h-4" />
              {t("user.new_store")}
            </motion.button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">

          {stores.map((store) => (
            <motion.div
              key={store._id || store.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[1.8rem] sm:rounded-[2.5rem] border border-zinc-100 shadow-sm p-4 max-[400px]:p-4 p-5 sm:p-6 space-y-4 max-[400px]:space-y-4 space-y-5 group hover:border-red-200 hover:shadow-xl transition-all cursor-pointer relative"
              onClick={() =>
                onSelectStore?.(
                  store._id || store.id
                )
              }
            >
              <div className="flex items-start justify-between">

                <div className="w-12 h-12 max-[400px]:w-12 max-[400px]:h-12 w-14 h-14 bg-gradient-to-br from-red-600 to-red-700 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-100 shrink-0">
                  <Store className="w-6 h-6 max-[400px]:w-6 max-[400px]:h-6 w-7 h-7" />
                </div>

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditStore(store);
                  }}
                  className="p-1.5 max-[400px]:p-1.5 p-2 rounded-xl hover:bg-zinc-50 text-zinc-300 hover:text-red-600 transition-all"
                >
                  <Building2 className="w-3.5 h-3.5 max-[400px]:w-3.5 max-[400px]:h-3.5 w-4 h-4" />
                </motion.button>
              </div>

              <div>
                <h4 className="text-base max-[400px]:text-base text-lg font-black italic text-zinc-950 uppercase tracking-tight break-words">
                  {store.name}
                </h4>

                <div className="flex flex-wrap items-center gap-1.5 max-[400px]:gap-1.5 gap-2 mt-1.5 max-[400px]:mt-1.5 mt-2">
                  <span className="px-2 max-[400px]:px-2 px-2.5 py-0.5 bg-red-50 text-red-600 rounded-full text-[8px] max-[400px]:text-[8px] text-[9px] font-black italic uppercase">
                    {store.typeLabel ||
                      store.type}
                  </span>

                  <span className="text-[8px] max-[400px]:text-[8px] text-[9px] text-zinc-400 font-black italic">
                    {store.industry}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[9px] max-[400px]:text-[9px] text-[10px] font-black uppercase tracking-wide sm:tracking-widest text-red-600 italic">
                {t("user.enter")}
                <ArrowRight className="w-3 h-3 max-[400px]:w-3 max-[400px]:h-3 w-3.5 h-3.5" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* AGENDA */}

      <div className="space-y-4 max-[400px]:space-y-4 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 max-[400px]:gap-3 gap-4">
          <div>
            <h3 className="text-xl max-[400px]:text-xl text-2xl font-black italic text-zinc-950 uppercase tracking-tight">
              Agenda
            </h3>
            <p className="text-[9px] max-[400px]:text-[9px] text-[10px] font-black text-zinc-400 uppercase tracking-wide sm:tracking-widest mt-0.5 max-[400px]:mt-0.5 mt-1 italic">
              {apptStats.today} hoy · {apptStats.upcoming} próximas
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1 bg-zinc-50 rounded-xl p-0.5 border border-zinc-100">
              <button onClick={() => setApptViewMode("list")}
                className={cn("px-3 py-1.5 rounded-lg text-[9px] font-black italic transition-all flex items-center gap-1.5",
                  apptViewMode === "list" ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-400 hover:text-zinc-600"
                )}>
                <List className="w-3 h-3" /> Lista
              </button>
              <button onClick={() => setApptViewMode("calendar")}
                className={cn("px-3 py-1.5 rounded-lg text-[9px] font-black italic transition-all flex items-center gap-1.5",
                  apptViewMode === "calendar" ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-400 hover:text-zinc-600"
                )}>
                <CalendarDays className="w-3 h-3" /> Calendario
              </button>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={openCreateAppt}
              className="px-4 py-1.5 bg-red-600 text-white rounded-xl font-black text-[9px] italic hover:bg-red-700 transition-all shadow-lg flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3 h-3" />
              NUEVA
            </motion.button>
          </div>
        </div>

        {/* Stats mini cards */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {[
            { label: "Hoy", value: apptStats.today, color: "text-red-600", bg: "bg-red-50" },
            { label: "Próximas", value: apptStats.upcoming, color: "text-amber-600", bg: "bg-amber-50" },
            { label: "Completadas", value: apptStats.completed, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Canceladas", value: apptStats.cancelled, color: "text-zinc-600", bg: "bg-zinc-50" },
          ].map(stat => (
            <div key={stat.label} className={`${stat.bg} rounded-2xl p-3 sm:p-4 text-center border border-transparent`}>
              <p className={`text-lg sm:text-2xl font-black italic ${stat.color}`}>{stat.value}</p>
              <p className="text-[7px] sm:text-[8px] font-black italic uppercase text-zinc-400 tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Main content: list or calendar */}
        {apptLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-zinc-300 animate-spin" />
          </div>
        ) : apptViewMode === "list" ? (
          appointments.length === 0 ? (
            <div className="py-12 text-center italic font-black uppercase tracking-widest text-zinc-200">
              No tienes citas agendadas
            </div>
          ) : (
            <div className="space-y-2">
              {appointments.map((a: any) => (
                <motion.div
                  key={a._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl border border-zinc-100 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-red-200 hover:shadow-lg transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
                      <CalendarIcon className="w-5 h-5 text-zinc-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black italic text-zinc-950 truncate">
                        {a.customerInfo?.name || "Sin nombre"}
                      </p>
                      <p className="text-[9px] font-bold text-zinc-400 italic">
                        {a.date} · {a.time}
                      </p>
                      {a.storeId && (
                        <p className="text-[8px] font-black text-red-500 italic truncate mt-0.5">
                          {getStoreName(a.storeId) || "Tienda"}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[8px] font-black italic uppercase tracking-wider",
                      a.status === "pending" && "bg-amber-50 text-amber-600",
                      a.status === "confirmed" && "bg-emerald-50 text-emerald-600",
                      a.status === "completed" && "bg-zinc-100 text-zinc-500",
                      a.status === "cancelled" && "bg-red-50 text-red-600",
                    )}>
                      {a.status === "pending" ? "Pendiente" : a.status === "confirmed" ? "Confirmada" : a.status === "completed" ? "Completada" : a.status === "cancelled" ? "Cancelada" : a.status}
                    </span>
                    <select
                      value={a.status}
                      onChange={(e) => handleApptStatus(a._id, e.target.value)}
                      className="text-[8px] font-black italic bg-transparent outline-none cursor-pointer text-zinc-400 hover:text-zinc-600 transition-all"
                    >
                      <option value="pending">Pendiente</option>
                      <option value="confirmed">Confirmada</option>
                      <option value="completed">Completada</option>
                      <option value="cancelled">Cancelada</option>
                    </select>
                    <button onClick={() => openEditAppt(a)} className="p-1.5 rounded-lg hover:bg-zinc-50 text-zinc-300 hover:text-red-600 transition-all">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDeleteAppt(a._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-zinc-300 hover:text-red-600 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )
        ) : (
          /* Calendar view */
          <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between p-3 md:p-4 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <motion.button whileTap={{ scale: 0.9 }} onClick={prevMonth}
                  className="p-1.5 hover:bg-zinc-50 rounded-lg transition-all">
                  <ChevronLeft className="w-4 h-4 text-zinc-500" />
                </motion.button>
                <h4 className="text-xs md:text-sm font-black italic text-zinc-950 uppercase tracking-tighter min-w-[140px] text-center">
                  {MONTHS[calMonth]} {calYear}
                </h4>
                <motion.button whileTap={{ scale: 0.9 }} onClick={nextMonth}
                  className="p-1.5 hover:bg-zinc-50 rounded-lg transition-all">
                  <ChevronRight className="w-4 h-4 text-zinc-500" />
                </motion.button>
              </div>
            </div>
            <div className="p-3 md:p-4">
              <div className="grid grid-cols-7 gap-px bg-zinc-100 rounded-xl overflow-hidden">
                {DAYS.map(d => (
                  <div key={d} className="bg-zinc-50 p-1.5 md:p-2 text-center text-[8px] md:text-[9px] font-black text-zinc-400 uppercase italic">{d}</div>
                ))}
                {monthDays.map((day, i) => {
                  if (day === null) return <div key={`e${i}`} className="bg-white p-1.5 md:p-2 min-h-[60px] md:min-h-[80px]" />;
                  const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const dayApps = getApptsForDay(calYear, calMonth, day);
                  const isToday = dateStr === todayStr;
                  return (
                    <div key={day}
                      className={cn("bg-white p-1.5 md:p-2 min-h-[60px] md:min-h-[80px] cursor-pointer hover:bg-zinc-50 transition-all border-b border-zinc-50",
                        isToday && "bg-red-50/30"
                      )}>
                      <span className={cn("text-[9px] md:text-[10px] font-black italic inline-flex items-center justify-center w-5 h-5 rounded-full",
                        isToday && "bg-red-600 text-white w-5 h-5"
                      )}>{day}</span>
                      <div className="space-y-0.5 mt-0.5">
                        {dayApps.slice(0, 2).map(a => (
                          <div key={a._id} onClick={() => openEditAppt(a)}
                            className={cn("text-[6px] md:text-[7px] font-black italic px-1 py-0.5 rounded truncate leading-tight",
                              a.status === "confirmed" ? "bg-emerald-100 text-emerald-700" :
                              a.status === "completed" ? "bg-zinc-100 text-zinc-500" :
                              a.status === "cancelled" ? "bg-red-100 text-red-500" :
                              "bg-amber-100 text-amber-700"
                            )}>
                            {a.time} {getStoreName(a.storeId)?.split(" ")[0] || a.customerInfo?.name?.split(" ")[0]}
                          </div>
                        ))}
                        {dayApps.length > 2 && (
                          <span className="text-[6px] font-black text-zinc-400 italic">+{dayApps.length - 2} más</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Today/Upcoming summary cards (only in calendar mode) */}
        {apptViewMode === "calendar" && (
          <div className="grid md:grid-cols-2 gap-4 md:gap-6">
            <div className="bg-white rounded-2xl border border-zinc-100 p-4 md:p-5 shadow-sm space-y-3">
              <h4 className="text-[10px] font-black italic text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-500" /> Citas de Hoy
              </h4>
              {apptsToday.length === 0 ? (
                <p className="text-[10px] text-zinc-400 italic text-center py-6">Sin citas para hoy</p>
              ) : apptsToday.slice(0, 5).map(a => (
                <div key={a._id} className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-zinc-100 hover:border-red-200 transition-all">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-7 h-7 bg-zinc-50 rounded-lg flex items-center justify-center shrink-0">
                      <User className="w-3.5 h-3.5 text-zinc-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black italic text-zinc-700 truncate">{a.customerInfo?.name}</p>
                      <p className="text-[8px] text-zinc-400 font-medium">{a.time}</p>
                      {a.storeId && (
                        <p className="text-[7px] font-black text-red-500 italic truncate">{getStoreName(a.storeId)}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className={cn("px-1.5 py-0.5 rounded text-[7px] font-black italic",
                      a.status === "pending" && "bg-amber-50 text-amber-600",
                      a.status === "confirmed" && "bg-emerald-50 text-emerald-600",
                      a.status === "completed" && "bg-zinc-100 text-zinc-500",
                      a.status === "cancelled" && "bg-red-50 text-red-600",
                    )}>
                      {a.status === "pending" ? "Pend" : a.status === "confirmed" ? "Conf" : a.status === "completed" ? "Comp" : a.status === "cancelled" ? "Canc" : a.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl border border-zinc-100 p-4 md:p-5 shadow-sm space-y-3">
              <h4 className="text-[10px] font-black italic text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                <ArrowRight className="w-3.5 h-3.5 text-emerald-500" /> Próximas Citas
              </h4>
              {upcomingAppts.length === 0 ? (
                <p className="text-[10px] text-zinc-400 italic text-center py-6">Sin próximas citas</p>
              ) : upcomingAppts.slice(0, 5).map(a => (
                <div key={a._id} className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-zinc-100 hover:border-red-200 transition-all">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-7 h-7 bg-zinc-50 rounded-lg flex items-center justify-center shrink-0">
                      <User className="w-3.5 h-3.5 text-zinc-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black italic text-zinc-700 truncate">{a.customerInfo?.name}</p>
                      <p className="text-[8px] text-zinc-400 font-medium">{a.date} · {a.time}</p>
                      {a.storeId && (
                        <p className="text-[7px] font-black text-red-500 italic truncate">{getStoreName(a.storeId)}</p>
                      )}
                    </div>
                  </div>
                  <button onClick={() => openEditAppt(a)} className="p-1 hover:bg-zinc-50 rounded-lg transition-all">
                    <Edit3 className="w-3 h-3 text-zinc-400" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Appointment form modal */}
      <AnimatePresence>
        {showApptForm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-6"
            onClick={() => setShowApptForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              className="w-full max-w-md bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-4xl relative"
              onClick={e => e.stopPropagation()}
            >
              <button onClick={() => setShowApptForm(false)} className="absolute top-4 right-4 p-2 hover:bg-zinc-50 rounded-xl">
                <X className="w-4 h-4 md:w-5 md:h-5 text-zinc-400" />
              </button>
              <h3 className="text-xl md:text-2xl font-black italic text-zinc-950 mb-6 uppercase tracking-tighter">
                {editingApptId ? "EDITAR CITA" : "NUEVA CITA"}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Cliente</label>
                  <input type="text" value={apptForm.customerName} onChange={e => setApptForm({...apptForm, customerName: e.target.value})} placeholder="Nombre del cliente" className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Email</label>
                    <input type="email" value={apptForm.customerEmail} onChange={e => setApptForm({...apptForm, customerEmail: e.target.value})} placeholder="Email" className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 text-sm" />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Teléfono</label>
                    <input type="tel" value={apptForm.customerPhone} onChange={e => setApptForm({...apptForm, customerPhone: e.target.value})} placeholder="Teléfono" className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Tienda / Empresa</label>
                  <select value={apptForm.storeId} onChange={e => setApptForm({...apptForm, storeId: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 text-sm italic">
                    <option value="">Sin tienda</option>
                    {stores.map((s: any) => (
                      <option key={s._id || s.id} value={s._id || s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Fecha</label>
                    <input type="date" value={apptForm.date} onChange={e => setApptForm({...apptForm, date: e.target.value})} className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 text-sm" />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Hora</label>
                    <input type="time" value={apptForm.time} onChange={e => setApptForm({...apptForm, time: e.target.value})} className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Duración (min)</label>
                    <input type="number" value={apptForm.duration} onChange={e => setApptForm({...apptForm, duration: e.target.value})} className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 text-sm" />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Estado</label>
                    <select value={apptForm.status} onChange={e => setApptForm({...apptForm, status: e.target.value})} className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 text-sm italic">
                      <option value="pending">Pendiente</option>
                      <option value="confirmed">Confirmada</option>
                      <option value="completed">Completada</option>
                      <option value="cancelled">Cancelada</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Notas</label>
                  <textarea value={apptForm.notes} onChange={e => setApptForm({...apptForm, notes: e.target.value})} placeholder="Notas..." className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all resize-none h-20 mt-1 text-sm" />
                </div>
                <button
                  onClick={handleSaveAppt}
                  disabled={apptSaving || !apptForm.customerName || !apptForm.date || !apptForm.time}
                  className="w-full py-4 bg-red-600 text-white rounded-2xl font-black italic text-sm hover:bg-red-700 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {apptSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingApptId ? "GUARDAR CAMBIOS" : "CREAR CITA"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}