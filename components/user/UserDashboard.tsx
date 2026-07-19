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
  Bot,
  Layers,
  Mail,
  Zap,
  ArrowRight,
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
import { LanguageCarousel } from "@/components/ui/LanguageCarousel";
import { useTheme } from "@/components/public/ThemeProvider";
import { useToast } from "@/components/ui/Toast";
import { PLANS, FREE_PLAN } from "@/lib/plans";

interface UserDashboardProps {
  user: {
    email: string;
    subscription: string | null;
    subscriptionExpiry: Date | null;
    isSuspended: boolean;
    emailVerified?: boolean;
  };

  userStores: any[];
  transactions: any[];

  onNavigate: (tab: any) => void;

  onSelectStore?: (storeId: string | number) => void;
  onCreateStore?: (store: any) => void;
  onEditStore?: (storeId: string | number, data: any) => void;
  onDeleteStore?: (storeId: string | number) => void;
}

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
  const { t } = useLanguage();
  const { theme, toggle } = useTheme();
  const { showToast, ToastComponent } = useToast();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [allPlans, setAllPlans] = useState<any[]>(PLANS);

  useEffect(() => {
    fetch("/api/plans").then(r => r.ok ? r.json() : null).then(d => { if (d?.plans?.length > 0) setAllPlans(d.plans); }).catch(() => {});
  }, []);

  const getPlanName = (planId: string | null) => {
    if (!planId || planId === "free") return t("user.free");
    const found = allPlans.find((p: any) => p.id === planId);
    return found ? t(found.nameKey ?? found.name) : planId.replace(/^plan_/i, "").replace(/_/g, " ");
  };

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
  const [showChangePlan, setShowChangePlan] = useState(false);
  const [changePlanLoading, setChangePlanLoading] = useState(false);
  const [changePlanError, setChangePlanError] = useState("");

  const [editingStoreId, setEditingStoreId] =
    useState<string | number | null>(null);

  const [confirmDelete, setConfirmDelete] =
    useState<string | number | null>(null);

  const [storeForm, setStoreForm] = useState({
    name: "",
    desc: "",
    industry: "tecnologia",
    type: "",
    modules: ["services"] as string[],
  });

  const [step, setStep] = useState(1);

  const [myInvoices, setMyInvoices] = useState<any[]>([]);
  const [myPayments, setMyPayments] = useState<any[]>([]);
  const [paymentSearch, setPaymentSearch] = useState("");
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [storeSearch, setStoreSearch] = useState("");
  const [storePage, setStorePage] = useState(1);
  const PAGE_SIZE = 10;

  const isFree = !user.subscription || isExpired;

  const stores = Array.isArray(userStores)
    ? userStores
    : [];

  const storeCount = stores.length;

  const maxStores = isFree
    ? FREE_PLAN.limits.maxStores
    : 999;

  const atLimit = storeCount >= maxStores;

  const filteredStores = stores.filter(s =>
    !storeSearch || s.name?.toLowerCase().includes(storeSearch.toLowerCase()) ||
    s.industry?.toLowerCase().includes(storeSearch.toLowerCase()) ||
    (s.typeLabel || s.type || "")?.toLowerCase().includes(storeSearch.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filteredStores.length / PAGE_SIZE));
  const safePage = Math.min(storePage, totalPages);
  const pagedStores = filteredStores.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

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

  useEffect(() => {
    if (user?.email) {
      setLoadingPayments(true);
      fetch(`/api/stripe/payments?customerEmail=${encodeURIComponent(user.email)}`)
        .then((res) => res.json())
        .then((data) => setMyPayments(data.payments || []))
        .catch(() => {})
        .finally(() => setLoadingPayments(false));
    }
  }, [user?.email]);

  const filteredPayments = myPayments.filter((p: any) =>
    !paymentSearch ||
    p.customerEmail?.toLowerCase().includes(paymentSearch.toLowerCase()) ||
    p.customerName?.toLowerCase().includes(paymentSearch.toLowerCase()) ||
    p.description?.toLowerCase().includes(paymentSearch.toLowerCase()) ||
    p.receiptNumber?.toLowerCase().includes(paymentSearch.toLowerCase()) ||
    p.displayDescription?.toLowerCase().includes(paymentSearch.toLowerCase())
  );

  const downloadReceipt = async (paymentId: string) => {
    try {
      const res = await fetch(`/api/receipts/${paymentId}`);
      if (!res.ok) throw new Error("Error");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Recibo_${paymentId.slice(-8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
  };

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
  const MONTHS = [t("appointments.month_1"),t("appointments.month_2"),t("appointments.month_3"),t("appointments.month_4"),t("appointments.month_5"),t("appointments.month_6"),t("appointments.month_7"),t("appointments.month_8"),t("appointments.month_9"),t("appointments.month_10"),t("appointments.month_11"),t("appointments.month_12")];
  const DAYS = [t("appointments.day_0"),t("appointments.day_1"),t("appointments.day_2"),t("appointments.day_3"),t("appointments.day_4"),t("appointments.day_5"),t("appointments.day_6")];

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
      modules: ["services"],
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
      modules: store.modules?.length ? store.modules : ["services"],
    });

    setStep(2);

    setShowCreateStore(true);
  };

  const handleCreateStore = () => {
    if (!storeForm.type || !storeForm.name)
      return;

    const typeLabels: Record<string, string> = {
      general: t("user.store_type_general"),
      ventas: t("user.store_type_sales"),
      saas: t("user.store_type_saas"),
      crm: t("user.store_type_crm"),
      tienda: t("user.store_type_online"),
      educacion: t("user.store_type_educational"),
      otro: t("user.store_type_other"),
    };

    const storeData = {
      name: storeForm.name,
      desc: storeForm.desc,
      industry: storeForm.industry,
      type: storeForm.type,
      typeLabel: typeLabels[storeForm.type] || storeForm.type,
      modules: storeForm.modules,
    };

    if (editingStoreId && editingStore) {
      onEditStore?.(editingStoreId, { ...editingStore, ...storeData });
    } else {
      onCreateStore?.({ ...storeData, createdAt: new Date().toISOString(), ownerEmail: user.email });
    }

    setStoreForm({
      name: "",
      desc: "",
      industry: "tecnologia",
      type: "",
      modules: ["services"],
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

  const [verifyResending, setVerifyResending] = useState(false);
  const [verifyResent, setVerifyResent] = useState(false);

  const handleResendVerification = async () => {
    setVerifyResending(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) setVerifyResent(true);
    } catch {}
    setVerifyResending(false);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-5 max-[400px]:space-y-5 space-y-6 sm:space-y-10 pb-20 px-3 sm:px-6">

      {/* EMAIL VERIFICATION BANNER */}
      {user.emailVerified === false && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 p-4 sm:p-5 rounded-[2rem] sm:rounded-[2.5rem]"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-black italic text-rose-900">{t("user.verify_email_title")}</p>
                <p className="text-[10px] font-medium text-rose-600 italic">{t("user.verify_warning")}</p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              {verifyResent ? (
                <span className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-100 text-emerald-700 rounded-xl text-[10px] font-bold italic">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Reenviado
                </span>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleResendVerification}
                  disabled={verifyResending}
                  className="px-4 py-2.5 bg-rose-600 text-white rounded-xl text-[10px] font-bold italic hover:bg-rose-700 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
                >
                  {verifyResending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Mail className="w-3.5 h-3.5" />
                  )}
                  {t("user.resend_verification")}
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* HEADER */}

      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 max-[400px]:gap-5 gap-6 bg-zinc-950 p-5 sm:p-8 lg:p-10 rounded-[2rem] sm:rounded-[3rem] text-white shadow-3xl relative">

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

              <motion.span
                key={user.subscription || "free"}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={cn(
                  "px-2 max-[400px]:px-2 px-3 py-1 rounded-full text-[9px] max-[400px]:text-[9px] text-[10px] font-black uppercase tracking-wide sm:tracking-widest italic inline-flex items-center gap-1.5",
                  user.subscription
                    ? "bg-red-600 text-white"
                    : "bg-zinc-800 text-zinc-400"
                )}
              >
                {user.subscription && <Zap className="w-2.5 h-2.5" />}
                {user.subscription
                  ? `${t("user.plan")} ${getPlanName(user.subscription)}`
                  : t("user.free")}
              </motion.span>

              {user.subscription && (
                <motion.span
                  key={isExpired ? "expired" : "active"}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={cn(
                    "flex items-center gap-1 text-[9px] max-[400px]:text-[9px] text-[10px] font-black uppercase tracking-wide sm:tracking-widest italic",
                    isExpired
                      ? "text-red-500"
                      : "text-emerald-500"
                  )}
                >
                  <Clock className="w-2.5 h-2.5 max-[400px]:w-2.5 max-[400px]:h-2.5 w-3 h-3" />
                  {isExpired || daysLeft <= 0
                    ? t("user.expired")
                    : t("user.days_left").replace("{n}", String(daysLeft))}
                </motion.span>
              )}
            </div>
          </div>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row gap-3 w-full lg:w-auto">

          <LanguageCarousel />

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggle}
            className="flex items-center justify-center w-10 h-10 bg-white/10 backdrop-blur-xl rounded-xl border border-white/10 hover:bg-white/20 transition-all shrink-0"
            aria-label={theme === "dark" ? "Modo claro" : "Modo oscuro"}
          >
            {theme === "dark" ? (
              <svg className="w-4 h-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onNavigate("chat")}
            className="w-full sm:w-auto px-5 py-3 bg-white text-zinc-950 rounded-2xl font-black text-[10px] max-[400px]:text-[10px] text-xs uppercase tracking-wide sm:tracking-widest hover:bg-red-600 hover:text-white transition-all italic shadow-2xl"
          >
            {t("user.ai_support")}
          </motion.button>

          {(user.subscription && user.subscription !== "free" && !isExpired) && (
            <>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowChangePlan(true)}
                className="w-full sm:w-auto px-5 py-3 bg-white/20 backdrop-blur-xl text-white border border-white/20 rounded-2xl font-black text-[10px] max-[400px]:text-[10px] text-xs uppercase tracking-wide sm:tracking-widest hover:bg-white hover:text-zinc-950 transition-all italic shadow-2xl flex items-center justify-center gap-2"
              >
                <Zap className="w-3 h-3" />
                {t("user.update_plan") || "ACTUALIZAR PLAN"}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCancelConfirm(true)}
                className="w-full sm:w-auto px-5 py-3 bg-white/10 backdrop-blur-xl text-white/70 border border-white/10 rounded-2xl font-black text-[10px] max-[400px]:text-[10px] text-xs uppercase tracking-wide sm:tracking-widest hover:bg-red-600 hover:text-white hover:border-red-600 transition-all italic shadow-2xl flex items-center justify-center gap-2"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                {t("user.cancel_plan") || "CANCELAR PLAN"}
              </motion.button>
            </>
          )}

          {((!user.subscription || user.subscription === "free" || isExpired)) && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate("pricing")}
              className="w-full sm:w-auto px-5 py-3 bg-red-600 text-white rounded-2xl font-black text-[10px] max-[400px]:text-[10px] text-xs uppercase tracking-wide sm:tracking-widest hover:bg-red-700 transition-all italic shadow-2xl flex items-center justify-center gap-2"
            >
              <Zap className="w-3 h-3" />
              {isExpired ? (t("user.reactivate_plan") || "REACTIVAR PLAN") : (t("user.get_plan") || "OBTENER PLAN")}
            </motion.button>
          )}
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

          {!atLimit ? (
            <motion.button
              data-tour="create_btn"
              whileTap={{ scale: 0.95 }}
              onClick={openCreateStore}
              className="w-full sm:w-auto px-5 max-[400px]:px-5 px-6 py-2.5 max-[400px]:py-2.5 py-3 bg-red-600 text-white rounded-2xl font-black text-[10px] max-[400px]:text-[10px] text-xs italic hover:bg-red-700 transition-all shadow-xl flex items-center justify-center gap-2"
            >
              <Plus className="w-3.5 h-3.5 max-[400px]:w-3.5 max-[400px]:h-3.5 w-4 h-4" />
              {t("user.new_store")}
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate("pricing")}
              className="w-full sm:w-auto px-5 max-[400px]:px-5 px-6 py-2.5 max-[400px]:py-2.5 py-3 bg-amber-500 text-white rounded-2xl font-black text-[10px] max-[400px]:text-[10px] text-xs italic hover:bg-amber-600 transition-all shadow-xl flex items-center justify-center gap-2"
            >
              <Zap className="w-3.5 h-3.5 max-[400px]:w-3.5 max-[400px]:h-3.5 w-4 h-4" />
              {t("user.upgrade")}
            </motion.button>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
          <input type="text" value={storeSearch} onChange={e => { setStoreSearch(e.target.value); setStorePage(1); }}
            placeholder={t("biz.search_stores")}
            className="w-full bg-zinc-50 pl-11 pr-4 py-3 rounded-2xl border border-zinc-100 outline-none font-bold text-sm focus:bg-white focus:border-red-200 transition-all italic" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">

          {pagedStores.length > 0 ? pagedStores.map((store) => (
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
          )          ) : (
            <div className="col-span-full text-center py-12">
              <Store className="w-10 h-10 text-zinc-200 mx-auto mb-3" />
              <p className="text-sm font-bold text-zinc-300 italic">{storeSearch ? t("biz.no_search_results").replace("{query}", storeSearch) : t("user.no_stores_yet")}</p>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-2">
            <button onClick={() => setStorePage(p => Math.max(1, p - 1))} disabled={safePage <= 1}
              className="p-2 rounded-xl bg-zinc-50 text-zinc-400 hover:bg-zinc-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-black italic text-zinc-400">
              {safePage} / {totalPages}
            </span>
            <button onClick={() => setStorePage(p => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages}
              className="p-2 rounded-xl bg-zinc-50 text-zinc-400 hover:bg-zinc-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* AGENDA */}

      <div className="space-y-4 max-[400px]:space-y-4 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 max-[400px]:gap-3 gap-4">
          <div>
            <h3 className="text-xl max-[400px]:text-xl text-2xl font-black italic text-zinc-950 uppercase tracking-tight">
              {t("appointments.title")}
            </h3>
            <p className="text-[9px] max-[400px]:text-[9px] text-[10px] font-black text-zinc-400 uppercase tracking-wide sm:tracking-widest mt-0.5 max-[400px]:mt-0.5 mt-1 italic">
              {apptStats.today} {t("appointments.stat_today")} · {apptStats.upcoming} {t("appointments.stat_upcoming")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1 bg-zinc-50 rounded-xl p-0.5 border border-zinc-100">
              <button onClick={() => setApptViewMode("list")}
                className={cn("px-3 py-1.5 rounded-lg text-[9px] font-black italic transition-all flex items-center gap-1.5",
                  apptViewMode === "list" ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-400 hover:text-zinc-600"
                )}>
                <List className="w-3 h-3" /> {t("appointments.view_list")}
              </button>
              <button onClick={() => setApptViewMode("calendar")}
                className={cn("px-3 py-1.5 rounded-lg text-[9px] font-black italic transition-all flex items-center gap-1.5",
                  apptViewMode === "calendar" ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-400 hover:text-zinc-600"
                )}>
                <CalendarDays className="w-3 h-3" /> {t("appointments.view_calendar")}
              </button>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={openCreateAppt}
              className="px-4 py-1.5 bg-red-600 text-white rounded-xl font-black text-[9px] italic hover:bg-red-700 transition-all shadow-lg flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3 h-3" />
              {t("appointments.new_btn")}
            </motion.button>
          </div>
        </div>

        {/* Stats mini cards */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {[
            { label: t("appointments.stat_today"), value: apptStats.today, color: "text-red-600", bg: "bg-red-50" },
            { label: t("appointments.stat_upcoming"), value: apptStats.upcoming, color: "text-amber-600", bg: "bg-amber-50" },
            { label: t("appointments.stat_completed"), value: apptStats.completed, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: t("appointments.stat_cancelled"), value: apptStats.cancelled, color: "text-zinc-600", bg: "bg-zinc-50" },
          ].map((stat, i) => (
            <div key={i} className={`${stat.bg} rounded-2xl p-3 sm:p-4 text-center border border-transparent`}>
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
              {t("appointments.list_empty")}
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
                        {a.customerInfo?.name || t("appointments.no_name")}
                      </p>
                      <p className="text-[9px] font-bold text-zinc-400 italic">
                        {a.date} · {a.time}
                      </p>
                      {a.storeId && (
                        <p className="text-[8px] font-black text-red-500 italic truncate mt-0.5">
                          {getStoreName(a.storeId) || t("user.store_fallback")}
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
                      {a.status === "pending" ? t("appointments.status_pending") : a.status === "confirmed" ? t("appointments.status_confirmed") : a.status === "completed" ? t("appointments.status_completed") : a.status === "cancelled" ? t("appointments.status_cancelled") : a.status}
                    </span>
                    <select
                      value={a.status}
                      onChange={(e) => handleApptStatus(a._id, e.target.value)}
                      className="text-[8px] font-black italic bg-transparent outline-none cursor-pointer text-zinc-400 hover:text-zinc-600 transition-all"
                    >
                      <option value="pending">{t("appointments.status_pending")}</option>
                      <option value="confirmed">{t("appointments.status_confirmed")}</option>
                      <option value="completed">{t("appointments.status_completed")}</option>
                      <option value="cancelled">{t("appointments.status_cancelled")}</option>
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
                          <span className="text-[6px] font-black text-zinc-400 italic">{t("appointments.calendar_more").replace("{n}", String(dayApps.length - 2))}</span>
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
                <Clock className="w-3.5 h-3.5 text-amber-500" /> {t("appointments.today_title")}
              </h4>
              {apptsToday.length === 0 ? (
                <p className="text-[10px] text-zinc-400 italic text-center py-6">{t("appointments.today_empty")}</p>
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
                      {a.status === "pending" ? t("appointments.status_pending").slice(0,4) : a.status === "confirmed" ? t("appointments.status_confirmed").slice(0,4) : a.status === "completed" ? t("appointments.status_completed").slice(0,4) : a.status === "cancelled" ? t("appointments.status_cancelled").slice(0,4) : a.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl border border-zinc-100 p-4 md:p-5 shadow-sm space-y-3">
              <h4 className="text-[10px] font-black italic text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                <ArrowRight className="w-3.5 h-3.5 text-emerald-500" /> {t("appointments.upcoming_title")}
              </h4>
              {upcomingAppts.length === 0 ? (
                <p className="text-[10px] text-zinc-400 italic text-center py-6">{t("appointments.upcoming_empty")}</p>
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

      {/* MIS PAGOS / RECIBOS */}
      <div className="space-y-4 max-[400px]:space-y-4 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 max-[400px]:gap-3 gap-4">
          <div>
            <h3 className="text-xl max-[400px]:text-xl text-2xl font-black italic text-zinc-950 uppercase tracking-tight">
              {t("payments.title")}
            </h3>
            <p className="text-[9px] max-[400px]:text-[9px] text-[10px] font-black text-zinc-400 uppercase tracking-wide sm:tracking-widest mt-0.5 max-[400px]:mt-0.5 mt-1 italic">
              {filteredPayments.length === 1
                ? t("payments.receipts_count_singular")
                : t("payments.receipts_count").replace("{count}", String(filteredPayments.length))}
            </p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
          <input
            type="text"
            value={paymentSearch}
            onChange={e => setPaymentSearch(e.target.value)}
            placeholder={t("payments.search_placeholder")}
            className="w-full bg-zinc-50 pl-11 pr-4 py-3 rounded-2xl border border-zinc-100 outline-none font-bold text-sm focus:bg-white focus:border-red-200 transition-all italic"
          />
        </div>

        {loadingPayments ? (
          <div className="bg-white border border-zinc-100 rounded-[1.5rem] md:rounded-[2.5rem] p-12 text-center">
            <Loader2 className="w-6 h-6 text-zinc-300 animate-spin mx-auto" />
            <p className="text-[10px] font-black text-zinc-300 italic mt-3 uppercase tracking-widest">{t("payments.loading")}</p>
          </div>
        ) : filteredPayments.length > 0 ? (
          <div className="bg-white border border-zinc-100 rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden shadow-xl overflow-x-auto">
            <table className="w-full text-left min-w-[500px]">
              <thead className="bg-zinc-50 border-b border-zinc-100">
                <tr>
                  <th className="px-5 md:px-8 py-4 md:py-5 text-[9px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest">{t("payments.col_date")}</th>
                  <th className="px-5 md:px-8 py-4 md:py-5 text-[9px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest">{t("payments.col_description")}</th>
                  <th className="px-5 md:px-8 py-4 md:py-5 text-[9px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest">{t("payments.col_amount")}</th>
                  <th className="px-5 md:px-8 py-4 md:py-5 text-[9px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest">{t("payments.col_method")}</th>
                  <th className="px-5 md:px-8 py-4 md:py-5 text-[9px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">{t("payments.col_receipt")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((p: any) => (
                  <tr key={p._id} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                    <td className="px-5 md:px-8 py-4 md:py-5">
                      <p className="text-[10px] md:text-xs font-black text-zinc-950 italic">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-[9px] md:text-[10px] text-zinc-400 font-bold">
                        {p.receiptNumber || `#${p._id?.slice(-6)}`}
                      </p>
                    </td>
                    <td className="px-5 md:px-8 py-4 md:py-5">
                      <p className="text-[10px] md:text-xs font-bold text-zinc-600 italic truncate max-w-[150px] md:max-w-none">
                        {p.displayDescription || p.description || "Pago"}
                      </p>
                    </td>
                    <td className="px-5 md:px-8 py-4 md:py-5">
                      <p className="text-xs md:text-sm font-black text-red-600 italic">
                        {p.displayCurrency} ${p.displayAmount?.toFixed(2)}
                      </p>
                    </td>
                    <td className="px-5 md:px-8 py-4 md:py-5">
                      <span className="px-2 py-0.5 bg-zinc-100 text-zinc-500 rounded-full text-[8px] md:text-[9px] font-black italic uppercase">
                        {p.displayPaymentMethod}
                      </span>
                    </td>
                    <td className="px-5 md:px-8 py-4 md:py-5 text-right">
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => downloadReceipt(p._id)}
                        className="p-2 md:p-3 bg-zinc-50 text-zinc-400 hover:text-red-600 hover:bg-white hover:shadow-lg rounded-xl transition-all"
                      >
                        <Download className="w-4 h-4 md:w-5 md:h-5" />
                      </motion.button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white border border-zinc-100 rounded-[1.5rem] md:rounded-[2.5rem] p-12 text-center">
            <FileText className="w-10 h-10 text-zinc-200 mx-auto mb-3" />
            <p className="text-sm font-bold text-zinc-300 italic">
              {paymentSearch ? t("payments.no_results") : t("payments.empty")}
            </p>
          </div>
        )}
      </div>

      {/* Create/Edit Store modal */}
      <AnimatePresence>
        {showCreateStore && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-6"
            onClick={() => setShowCreateStore(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              className="w-full max-w-md bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-4xl relative"
              onClick={e => e.stopPropagation()}
            >
              <button onClick={() => setShowCreateStore(false)} className="absolute top-4 right-4 p-2 hover:bg-zinc-50 rounded-xl">
                <X className="w-4 h-4 md:w-5 md:h-5 text-zinc-400" />
              </button>
              <h3 className="text-xl md:text-2xl font-black italic text-zinc-950 mb-6 uppercase tracking-tighter">
                {editingStoreId ? t("biz.edit_store") : t("user.new_store_title")}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("biz.config_edit_name")}</label>
                  <input data-tour="form_name" type="text" value={storeForm.name} onChange={e => setStoreForm({...storeForm, name: e.target.value})} placeholder={t("user.store_name_placeholder")} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 text-sm" />
                </div>
                <div>
                  <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("biz.config_edit_desc")}</label>
                  <textarea data-tour="form_desc" value={storeForm.desc} onChange={e => setStoreForm({...storeForm, desc: e.target.value})} placeholder={t("user.desc_placeholder")} className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all resize-none h-24 mt-1 text-sm" />
                </div>
                <div>
                  <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("biz.config_field_industry")}</label>
                  <select data-tour="form_industry" value={storeForm.industry} onChange={e => setStoreForm({...storeForm, industry: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 text-sm italic">
                    <option value="tecnologia">{t("biz.industry_technology")}</option>
                    <option value="comercio">{t("biz.industry_commerce")}</option>
                    <option value="servicios">{t("biz.industry_services")}</option>
                    <option value="salud">{t("biz.industry_health")}</option>
                    <option value="educacion">{t("biz.industry_education")}</option>
                    <option value="otro">{t("biz.industry_other")}</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("biz.config_field_type")}</label>
                  <select data-tour="form_type" value={storeForm.type} onChange={e => setStoreForm({...storeForm, type: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 text-sm italic">
                    <option value="" disabled>{t("user.select_type")}</option>
                    <option value="general">{t("user.store_type_general")}</option>
                    <option value="ventas">{t("user.store_type_sales")}</option>
                    <option value="saas">{t("user.store_type_saas")}</option>
                    <option value="crm">{t("user.store_type_crm")}</option>
                    <option value="tienda">{t("user.store_type_online")}</option>
                    <option value="educacion">{t("user.store_type_educational")}</option>
                    <option value="otro">{t("user.store_type_other")}</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">MÓDULOS</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {["services", "documents", "inventory", "education"].map((mod) => {
                      const labels: Record<string, string> = {
                        services: "Servicios",
                        documents: "Documentos",
                        inventory: "Inventario",
                        education: "Educación",
                      };
                      const selected = storeForm.modules.includes(mod);
                      return (
                        <button
                          key={mod}
                          type="button"
                          onClick={() => {
                            const next = selected
                              ? storeForm.modules.filter((m: string) => m !== mod)
                              : [...storeForm.modules, mod];
                            setStoreForm({...storeForm, modules: next.length ? next : ["services"]});
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold italic transition-all ${
                            selected
                              ? "bg-red-600 text-white shadow-md"
                              : "bg-zinc-100 text-zinc-400 hover:bg-zinc-200"
                          }`}
                        >
                          {labels[mod]}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[8px] text-zinc-300 italic mt-1 ml-1">Define qué módulos usa tu negocio. El agente IA solo usará herramientas de los módulos activos.</p>
                </div>
                <button
                  data-tour="form_submit"
                  onClick={handleCreateStore}
                  disabled={!storeForm.name || !storeForm.type}
                  className="w-full py-4 bg-red-600 text-white rounded-2xl font-black italic text-sm hover:bg-red-700 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {editingStoreId ? t("biz.config_btn_save") : t("user.create")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                {editingApptId ? t("appointments.form_edit") : t("appointments.form_new")}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("appointments.form_customer_label")}</label>
                  <input type="text" value={apptForm.customerName} onChange={e => setApptForm({...apptForm, customerName: e.target.value})} placeholder={t("appointments.form_name_placeholder")} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("appointments.form_email")}</label>
                    <input type="email" value={apptForm.customerEmail} onChange={e => setApptForm({...apptForm, customerEmail: e.target.value})} placeholder={t("appointments.form_email")} className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 text-sm" />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("appointments.form_phone")}</label>
                    <input type="tel" value={apptForm.customerPhone} onChange={e => setApptForm({...apptForm, customerPhone: e.target.value})} placeholder={t("appointments.form_phone")} className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("appointments.form_store")}</label>
                  <select value={apptForm.storeId} onChange={e => setApptForm({...apptForm, storeId: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 text-sm italic">
                    <option value="">{t("appointments.no_store")}</option>
                    {stores.map((s: any) => (
                      <option key={s._id || s.id} value={s._id || s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("appointments.form_date")}</label>
                    <input type="date" value={apptForm.date} onChange={e => setApptForm({...apptForm, date: e.target.value})} className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 text-sm" />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("appointments.form_time")}</label>
                    <input type="time" value={apptForm.time} onChange={e => setApptForm({...apptForm, time: e.target.value})} className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("appointments.form_duration")}</label>
                    <input type="number" value={apptForm.duration} onChange={e => setApptForm({...apptForm, duration: e.target.value})} className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 text-sm" />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("appointments.form_status")}</label>
                    <select value={apptForm.status} onChange={e => setApptForm({...apptForm, status: e.target.value})} className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 text-sm italic">
                      <option value="pending">{t("appointments.status_pending")}</option>
                      <option value="confirmed">{t("appointments.status_confirmed")}</option>
                      <option value="completed">{t("appointments.status_completed")}</option>
                      <option value="cancelled">{t("appointments.status_cancelled")}</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("appointments.form_notes")}</label>
                  <textarea value={apptForm.notes} onChange={e => setApptForm({...apptForm, notes: e.target.value})} placeholder={t("appointments.form_notes_placeholder")} className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all resize-none h-20 mt-1 text-sm" />
                </div>
                <button
                  onClick={handleSaveAppt}
                  disabled={apptSaving || !apptForm.customerName || !apptForm.date || !apptForm.time}
                  className="w-full py-4 bg-red-600 text-white rounded-2xl font-black italic text-sm hover:bg-red-700 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {apptSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingApptId ? t("appointments.form_save") : t("appointments.form_create")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Change Plan Modal */}
      <AnimatePresence>
        {showChangePlan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => { setShowChangePlan(false); setChangePlanError(""); }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="w-full max-w-lg bg-white rounded-[2.5rem] p-8 shadow-4xl relative max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => { setShowChangePlan(false); setChangePlanError(""); }}
                className="absolute top-4 right-4 p-2 hover:bg-zinc-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-zinc-400" />
              </button>

              <div className="text-center mb-8">
                <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-7 h-7 text-red-600" />
                </div>
                <h3 className="text-xl font-black italic text-zinc-950 uppercase tracking-tighter">
                  {t("user.update_plan") || "Actualizar Plan"}
                </h3>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1 italic">
                  Plan actual: <span className="text-red-600">{getPlanName(user.subscription)}</span>
                </p>
              </div>

              <div className="space-y-3 mb-6">
                {[
                  { id: "starter", name: "Starter", priceUsd: 29, desc: "Perfecto para emprender" },
                  { id: "business", name: "Business", priceUsd: 79, desc: "La más completa", popular: true },
                  { id: "enterprise", name: "Enterprise", priceUsd: 199, desc: "Potencia y control total" },
                ].filter(p => p.id !== user.subscription).map((plan) => (
                  <motion.button
                    key={plan.id}
                    whileTap={{ scale: 0.97 }}
                    disabled={changePlanLoading}
                    onClick={async () => {
                      setChangePlanLoading(true);
                      setChangePlanError("");
                      try {
                        const res = await fetch("/api/stripe/change-plan", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ newPlanId: plan.id }),
                        });
                        const data = await res.json();
                        if (data.url) {
                          window.location.href = data.url;
                        } else {
                          setChangePlanError(data.error || "Error al cambiar plan");
                          setChangePlanLoading(false);
                        }
                      } catch {
                        setChangePlanError("Error de conexión");
                        setChangePlanLoading(false);
                      }
                    }}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left",
                      plan.popular
                        ? "border-red-200 bg-red-50 hover:border-red-300"
                        : "border-zinc-100 hover:border-zinc-200 hover:shadow-md"
                    )}
                  >
                    <div className={cn(
                      "p-2.5 rounded-xl",
                      plan.popular ? "bg-red-100" : "bg-zinc-100"
                    )}>
                      <Zap className={cn("w-5 h-5", plan.popular ? "text-red-600" : "text-zinc-500")} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-black italic text-zinc-950">{plan.name}</p>
                      <p className="text-[10px] text-zinc-400 font-bold">{plan.desc}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black italic text-zinc-950">${plan.priceUsd}</p>
                      <p className="text-[9px] text-zinc-400 font-bold">USD/mes</p>
                    </div>
                  </motion.button>
                ))}
              </div>

              {changePlanError && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
                  <p className="text-xs font-bold text-red-700 italic">{changePlanError}</p>
                </div>
              )}

              {changePlanLoading && (
                <div className="flex items-center justify-center gap-3 py-4">
                  <Loader2 className="w-5 h-5 text-red-600 animate-spin" />
                  <p className="text-xs font-bold italic text-zinc-400">Redirigiendo a Stripe...</p>
                </div>
              )}

              <p className="text-[9px] text-zinc-300 font-bold text-center mt-4 italic">
                Se cancelará tu plan actual y se creará uno nuevo. Puedes cambiar cuando quieras.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCancelConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowCancelConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[2rem] p-6 md:p-8 max-w-sm w-full shadow-2xl border border-zinc-100 space-y-5"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-center">
                <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center">
                  <AlertCircle className="w-7 h-7 text-red-600" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-black italic text-zinc-950 uppercase">{t("user.cancel_plan") || "Cancelar Plan"}</h3>
                <p className="text-xs font-bold text-zinc-400 italic">{t("user.cancel_plan_confirm") || "Se cancelará al final del periodo de facturación. No se realiza reembolso."}</p>
              </div>
              <div className="flex gap-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={async () => {
                    setShowCancelConfirm(false);
                    try {
                      const res = await fetch("/api/stripe/cancel-subscription", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ immediately: false }) });
                      const data = await res.json();
                      if (data.error) { showToast(data.error, "error"); return; }
                      showToast(data.message || "Plan cancelado correctamente", "success");
                    } catch { showToast("Error al cancelar", "error"); }
                  }}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl font-black italic text-xs hover:bg-red-700 transition-all"
                >
                  {t("user.cancel_plan_confirm_yes") || "Sí, cancelar"}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 py-3 bg-zinc-50 text-zinc-500 rounded-xl font-black italic text-xs hover:bg-zinc-100 transition-all"
                >
                  {t("user.cancel_plan_confirm_no") || "No, mantener"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {ToastComponent}

    </div>
  );
}