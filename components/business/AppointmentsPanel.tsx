"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  CalendarDays, List, Plus, Loader2, Clock, CheckCircle2, XCircle,
  User, Phone, Mail, Search, ChevronLeft, ChevronRight, FileText,
  Calendar as CalendarIcon, AlertCircle, ArrowUpRight, Edit3, Trash2,
  X, Save, Filter, Users, Ban, CheckCircle, MessageSquare, Zap
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

type AppointmentStatus = "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
type ViewMode = "calendar" | "list";
type CalendarView = "month" | "week" | "day";

interface AppointmentData {
  _id: string;
  customerId?: string;
  service: { id: number; name: string; price: number; duration: number };
  customerInfo: { name: string; email: string; phone: string };
  date: string;
  time: string;
  duration: number;
  notes: string;
  status: AppointmentStatus;
  createdBy: "customer" | "owner";
  paymentStatus?: "unpaid" | "pending" | "paid" | "refunded";
  stripePaymentUrl?: string;
  createdAt: string;
}

interface CustomerData {
  _id: string;
  name: string;
  email: string;
  phone: string;
}

interface StatsData {
  today: number;
  upcoming: number;
  completed: number;
  cancelled: number;
}


function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  return days;
}

function formatTime(hour: number, min: number = 0) {
  return `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

const LOCALE_MAP: Record<string, string> = {
  es: "es", en: "en", fr: "fr", zh: "zh-CN", hi: "hi-IN", ko: "ko-KR", ja: "ja-JP", it: "it", pt: "pt-PT",
};

export default function AppointmentsPanel({ storeId, refreshTrigger = 0 }: { storeId: string; refreshTrigger?: number }) {
  const { t, language } = useLanguage();
  const locale = LOCALE_MAP[language] || language;
  const STATUS_CONFIG: Record<AppointmentStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    pending:      { label: t("appointments.status_pending"),     color: "text-amber-600", bg: "bg-amber-50 border-amber-200", icon: <Clock className="w-3 h-3" /> },
    confirmed:    { label: t("appointments.status_confirmed"),   color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", icon: <CheckCircle2 className="w-3 h-3" /> },
    in_progress:  { label: t("appointments.status_in_progress"), color: "text-blue-600", bg: "bg-blue-50 border-blue-200", icon: <ArrowUpRight className="w-3 h-3" /> },
    completed:    { label: t("appointments.status_completed"),   color: "text-zinc-600", bg: "bg-zinc-50 border-zinc-200", icon: <CheckCircle className="w-3 h-3" /> },
    cancelled:    { label: t("appointments.status_cancelled"),   color: "text-red-600", bg: "bg-red-50 border-red-200", icon: <Ban className="w-3 h-3" /> },
  };
  const MONTHS = [t("appointments.month_1"),t("appointments.month_2"),t("appointments.month_3"),t("appointments.month_4"),t("appointments.month_5"),t("appointments.month_6"),t("appointments.month_7"),t("appointments.month_8"),t("appointments.month_9"),t("appointments.month_10"),t("appointments.month_11"),t("appointments.month_12")];
  const DAYS = [t("appointments.day_0"),t("appointments.day_1"),t("appointments.day_2"),t("appointments.day_3"),t("appointments.day_4"),t("appointments.day_5"),t("appointments.day_6")];

  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatsData>({ today: 0, upcoming: 0, completed: 0, cancelled: 0 });
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [calendarView, setCalendarView] = useState<CalendarView>("month");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterDate, setFilterDate] = useState<string>("");
  const [customerSearch, setCustomerSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    customerId: "", customerName: "", customerEmail: "", customerPhone: "",
    serviceName: "", servicePrice: "", serviceDuration: "60",
    date: "", time: "", duration: "60", notes: "", status: "pending" as AppointmentStatus,
  });
  const [saving, setSaving] = useState(false);

  // Calendar state
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calDate, setCalDate] = useState(today.toISOString().split("T")[0]);

  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);
      let url = `/api/appointments?storeId=${storeId}&limit=200`;
      if (filterStatus) url += `&status=${filterStatus}`;
      if (filterDate) url += `&date=${filterDate}`;
      const res = await fetch(url);
      const data = await res.json();
      setAppointments(data.appointments || []);
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [storeId, filterStatus, filterDate]);

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch(`/api/appointments/stats?storeId=${storeId}`);
      const data = await res.json();
      if (data.today !== undefined) setStats(data);
    } catch {}
  }, [storeId]);

  const loadCustomers = useCallback(async () => {
    try {
      const res = await fetch(`/api/customers?storeId=${storeId}`);
      const data = await res.json();
      setCustomers(data.customers || []);
    } catch {}
  }, [storeId]);

  useEffect(() => { loadAppointments(); loadStats(); loadCustomers(); }, [loadAppointments, loadStats, loadCustomers, refreshTrigger]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail || detail.storeId === storeId) {
        loadAppointments();
        loadStats();
      }
    };
    window.addEventListener("appointments-changed", handler);
    return () => window.removeEventListener("appointments-changed", handler);
  }, [storeId, loadAppointments, loadStats]);

  const filteredCustomers = customers.filter(c =>
    !customerSearch ||
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.email.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const getAppointmentsForDay = (year: number, month: number, day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return appointments.filter(a => a.date === dateStr);
  };

  const openCreateForm = () => {
    setEditingId(null);
    setFormData({
      customerId: "", customerName: "", customerEmail: "", customerPhone: "",
      serviceName: "", servicePrice: "", serviceDuration: "60",
      date: today.toISOString().split("T")[0], time: "10:00", duration: "60", notes: "", status: "pending",
    });
    setShowForm(true);
  };

  const openEditForm = (a: AppointmentData) => {
    setEditingId(a._id);
    setFormData({
      customerId: a.customerId || "",
      customerName: a.customerInfo.name,
      customerEmail: a.customerInfo.email,
      customerPhone: a.customerInfo.phone,
      serviceName: a.service?.name || "",
      servicePrice: a.service?.price?.toString() || "",
      serviceDuration: a.service?.duration?.toString() || "60",
      date: a.date,
      time: a.time,
      duration: a.duration.toString(),
      notes: a.notes,
      status: a.status,
    });
    setShowForm(true);
  };

  const canSave = !!formData.date && !!formData.time && (!!formData.customerEmail || !!formData.customerPhone);
  const [conflictError, setConflictError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!formData.date || !formData.time) return;
    if (!formData.customerEmail && !formData.customerPhone) return;
    setSaving(true);
    setConflictError(null);
    try {
      const payload = {
        storeId,
        customerId: formData.customerId || undefined,
        customerInfo: {
          name: formData.customerName,
          email: formData.customerEmail,
          phone: formData.customerPhone,
        },
        service: {
          id: 0,
          name: formData.serviceName || "Sin servicio",
          price: parseFloat(formData.servicePrice) || 0,
          duration: parseInt(formData.serviceDuration) || 60,
        },
        date: formData.date,
        time: formData.time,
        duration: parseInt(formData.duration) || 60,
        notes: formData.notes,
        status: formData.status,
      };

      if (editingId) {
        const res = await fetch(`/api/appointments/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok && data.error === "conflict") {
          setConflictError(data.message || "Conflicto de horario detectado");
          setSaving(false);
          return;
        }
      } else {
        const res = await fetch("/api/appointments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok && data.error === "conflict") {
          setConflictError(data.message || "Conflicto de horario detectado");
          setSaving(false);
          return;
        }
        if (data.appointment?._id && formData.customerEmail && !formData.customerId) {
          try {
            const existing = customers.find(c => c.email === formData.customerEmail);
            if (!existing) {
              await fetch("/api/customers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  storeId,
                  name: formData.customerName || "Sin nombre",
                  email: formData.customerEmail,
                  phone: formData.customerPhone || "",
                  tags: ["appointment"],
                  notes: `Auto-creado desde cita del ${formData.date}`,
                }),
              });
            }
          } catch {}
        }
      }
      setShowForm(false);
      loadAppointments();
      loadStats();
      loadCustomers();
    } catch {}
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/appointments/${id}`, { method: "DELETE" });
      loadAppointments();
      loadStats();
    } catch {}
  };

  const handleStatusChange = async (id: string, status: AppointmentStatus) => {
    try {
      await fetch(`/api/appointments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      loadAppointments();
      loadStats();
    } catch {}
  };

  const selectCustomer = (c: CustomerData) => {
    setFormData(prev => ({
      ...prev,
      customerId: c._id,
      customerName: c.name,
      customerEmail: c.email,
      customerPhone: c.phone,
    }));
    setCustomerSearch("");
  };

  const monthDays = getMonthDays(calYear, calMonth);

  const weekStart = new Date(calDate);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekDays: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    weekDays.push(d.toISOString().split("T")[0]);
  }

  const appointmentsToday = appointments.filter(a => a.date === today.toISOString().split("T")[0]);
  const upcomingAppts = appointments.filter(a => a.date >= today.toISOString().split("T")[0] && (a.status === "pending" || a.status === "confirmed"));

  return (
    <div className="space-y-3 md:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 md:gap-4 flex-wrap">
        <h3 className="text-lg md:text-xl font-black italic text-zinc-950 uppercase tracking-tighter">
          {t("appointments.title")}
        </h3>
        <div className="flex gap-1 ml-auto">
          <button onClick={() => setViewMode("list")}
            className={cn("flex items-center gap-1 md:gap-1.5 px-2.5 py-1.5 md:px-3 md:py-2 rounded-xl text-[9px] md:text-[10px] font-black italic transition-all",
              viewMode === "list" ? "bg-red-600 text-white shadow-md" : "bg-zinc-50 text-zinc-500 hover:bg-zinc-100"
            )}>
            <List className="w-3 h-3" /> {t("appointments.view_list")}
          </button>
          <button onClick={() => setViewMode("calendar")}
            className={cn("flex items-center gap-1 md:gap-1.5 px-2.5 py-1.5 md:px-3 md:py-2 rounded-xl text-[9px] md:text-[10px] font-black italic transition-all",
              viewMode === "calendar" ? "bg-red-600 text-white shadow-md" : "bg-zinc-50 text-zinc-500 hover:bg-zinc-100"
            )}>
            <CalendarDays className="w-3 h-3" /> {t("appointments.view_calendar")}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 md:gap-3">
        <div className="bg-amber-50 rounded-xl md:rounded-2xl p-2 md:p-4 border border-amber-100 space-y-0.5 md:space-y-1">
          <p className="text-[7px] md:text-[8px] font-black text-amber-600 uppercase italic flex items-center gap-1">
            <Clock className="w-2 h-2 md:w-2.5 md:h-2.5" /> {t("appointments.stat_today")}
          </p>
          <p className="text-base md:text-2xl font-black italic text-amber-700">{stats.today}</p>
        </div>
        <div className="bg-emerald-50 rounded-xl md:rounded-2xl p-2 md:p-4 border border-emerald-100 space-y-0.5 md:space-y-1">
          <p className="text-[7px] md:text-[8px] font-black text-emerald-600 uppercase italic flex items-center gap-1">
            <ArrowUpRight className="w-2 h-2 md:w-2.5 md:h-2.5" /> {t("appointments.stat_upcoming")}
          </p>
          <p className="text-base md:text-2xl font-black italic text-emerald-700">{stats.upcoming}</p>
        </div>
        <div className="bg-blue-50 rounded-xl md:rounded-2xl p-2 md:p-4 border border-blue-100 space-y-0.5 md:space-y-1">
          <p className="text-[7px] md:text-[8px] font-black text-blue-600 uppercase italic flex items-center gap-1">
            <CheckCircle className="w-2 h-2 md:w-2.5 md:h-2.5" /> {t("appointments.stat_completed")}
          </p>
          <p className="text-base md:text-2xl font-black italic text-blue-700">{stats.completed}</p>
        </div>
        <div className="bg-red-50 rounded-xl md:rounded-2xl p-2 md:p-4 border border-red-100 space-y-0.5 md:space-y-1">
          <p className="text-[7px] md:text-[8px] font-black text-red-600 uppercase italic flex items-center gap-1">
            <Ban className="w-2 h-2 md:w-2.5 md:h-2.5" /> {t("appointments.stat_cancelled")}
          </p>
          <p className="text-base md:text-2xl font-black italic text-red-700">{stats.cancelled}</p>
        </div>
      </div>

      {/* Filters + Create */}
      <div className="flex items-center justify-between flex-wrap gap-1.5 md:gap-2">
        <div className="flex items-center gap-1 md:gap-1.5 flex-wrap">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="bg-zinc-50 border border-zinc-100 rounded-xl px-2 py-1 md:px-2.5 md:py-1.5 text-[8px] md:text-[9px] font-black italic text-zinc-500 outline-none">
            <option value="">{t("appointments.filter_all")}</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
            className="bg-zinc-50 border border-zinc-100 rounded-xl px-2 py-1 md:px-2.5 md:py-1.5 text-[8px] md:text-[9px] font-medium text-zinc-600 outline-none w-[110px] md:w-[130px]" />
        </div>
        <motion.button whileTap={{ scale: 0.95 }} onClick={openCreateForm}
          className="flex items-center gap-1 md:gap-1.5 px-2.5 py-1.5 md:px-3 md:py-2 bg-red-600 text-white rounded-xl text-[9px] md:text-[10px] font-black italic hover:bg-red-700 transition-all shadow-lg shadow-red-100">
          <Plus className="w-3 h-3" /> {t("appointments.new")}
        </motion.button>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-zinc-300" /></div>
      ) : viewMode === "list" ? (
        <ListView appointments={appointments} onEdit={openEditForm} onDelete={handleDelete} onStatusChange={handleStatusChange} statusConfig={STATUS_CONFIG} t={t} locale={locale} />
      ) : (
        <CalendarView
          view={calendarView} setView={setCalendarView}
          year={calYear} month={calMonth} setYear={setCalYear} setMonth={setCalMonth}
          date={calDate} setDate={setCalDate}
          monthDays={monthDays} appointments={appointments}
          getApptsForDay={getAppointmentsForDay}
          weekDays={weekDays}
          onEdit={openEditForm}
          onDateClick={(d) => { setFilterDate(d); setViewMode("list"); }}
          statusConfig={STATUS_CONFIG} months={MONTHS} days={DAYS} t={t}
        />
      )}

      {/* Today's summary */}
      <div className="grid md:grid-cols-2 gap-3 md:gap-6">
        <div className="bg-white rounded-2xl border border-zinc-100 p-3 md:p-5 shadow-sm space-y-2 md:space-y-3">
          <h4 className="text-[9px] md:text-[10px] font-black italic text-zinc-500 uppercase tracking-wider flex items-center gap-1.5 md:gap-2">
            <Clock className="w-3 h-3 md:w-3.5 md:h-3.5 text-amber-500" /> {t("appointments.today_title")}
          </h4>
          {appointmentsToday.length === 0 ? (
            <p className="text-[9px] md:text-[10px] text-zinc-400 italic text-center py-4 md:py-6">{t("appointments.today_empty")}</p>
          ) : appointmentsToday.slice(0, 5).map(a => (
            <AppointmentRow key={a._id} appointment={a} onEdit={openEditForm} onStatusChange={handleStatusChange} compact statusConfig={STATUS_CONFIG} t={t} />
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-zinc-100 p-3 md:p-5 shadow-sm space-y-2 md:space-y-3">
          <h4 className="text-[9px] md:text-[10px] font-black italic text-zinc-500 uppercase tracking-wider flex items-center gap-1.5 md:gap-2">
            <ArrowUpRight className="w-3 h-3 md:w-3.5 md:h-3.5 text-emerald-500" /> {t("appointments.upcoming_title")}
          </h4>
          {upcomingAppts.length === 0 ? (
            <p className="text-[9px] md:text-[10px] text-zinc-400 italic text-center py-4 md:py-6">{t("appointments.upcoming_empty")}</p>
          ) : upcomingAppts.slice(0, 5).map(a => (
            <AppointmentRow key={a._id} appointment={a} onEdit={openEditForm} onStatusChange={handleStatusChange} compact statusConfig={STATUS_CONFIG} t={t} />
          ))}
        </div>
      </div>

      {/* Appointment Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[2rem] p-4 md:p-6 max-w-lg w-full shadow-2xl border border-zinc-100 max-h-[90vh] overflow-y-auto space-y-3 md:space-y-5"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="text-base md:text-lg font-black italic text-zinc-950 uppercase tracking-tighter">
                  {editingId ? t("appointments.form_edit") : t("appointments.form_new")}
                </h3>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowForm(false)}
                  className="p-1.5 hover:bg-zinc-50 rounded-xl transition-all">
                  <X className="w-4 h-4 text-zinc-400" />
                </motion.button>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-[10px] font-medium text-amber-700">
                  {t("appointments.form_required_contact")}
                </p>
              </div>

              <div className="space-y-4">
                {/* Customer selector */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("appointments.form_customer_label")}</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-300" />
                    <input type="text" placeholder={t("appointments.form_customer_search")} value={customerSearch}
                      onChange={e => setCustomerSearch(e.target.value)}
                      className="w-full bg-zinc-50 pl-8 pr-3 py-2 rounded-xl border border-zinc-100 outline-none text-[11px] md:text-xs font-medium focus:bg-white focus:border-red-200 transition-all" />
                  </div>
                  {customerSearch && (
                    <div className="max-h-[100px] overflow-y-auto space-y-0.5 bg-white border border-zinc-100 rounded-xl p-1">
                      {filteredCustomers.map(c => (
                        <button key={c._id} onClick={() => selectCustomer(c)}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-[10px] font-medium text-zinc-600 hover:bg-zinc-50 flex items-center gap-2">
                          <User className="w-3 h-3 shrink-0 text-zinc-400" />
                          {c.name} {c.email && <span className="text-zinc-400">({c.email})</span>}
                        </button>
                      ))}
                      {filteredCustomers.length === 0 && <p className="text-[10px] text-zinc-400 text-center py-2 italic">{t("appointments.form_no_results")}</p>}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <InputField label={t("appointments.form_name")} value={formData.customerName} onChange={v => setFormData(prev => ({...prev, customerName: v}))} />
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest flex items-center gap-1">
                      {t("appointments.form_email")} <span className="text-red-500">*</span>
                    </label>
                    <input type="email" value={formData.customerEmail}
                      onChange={e => setFormData(prev => ({...prev, customerEmail: e.target.value}))}
                      className="w-full h-9 md:h-10 bg-zinc-50 border border-zinc-100 rounded-xl px-3 text-[11px] md:text-xs font-medium outline-none focus:bg-white focus:border-red-200 transition-all" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest flex items-center gap-1">
                    {t("appointments.form_phone")} <span className="text-red-500">*</span>
                  </label>
                  <input type="text" value={formData.customerPhone}
                    onChange={e => setFormData(prev => ({...prev, customerPhone: e.target.value}))}
                    className="w-full h-9 md:h-10 bg-zinc-50 border border-zinc-100 rounded-xl px-3 text-[11px] md:text-xs font-medium outline-none focus:bg-white focus:border-red-200 transition-all" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <InputField label={t("appointments.form_service")} value={formData.serviceName} onChange={v => setFormData(prev => ({...prev, serviceName: v}))} />
                  <InputField label={t("appointments.form_price")} type="number" value={formData.servicePrice} onChange={v => setFormData(prev => ({...prev, servicePrice: v}))} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("appointments.form_date")}</label>
                    <input type="date" value={formData.date}
                      onChange={e => setFormData(prev => ({...prev, date: e.target.value}))}
                      className="w-full h-9 md:h-10 bg-zinc-50 border border-zinc-100 rounded-xl px-3 text-[11px] md:text-xs font-medium outline-none focus:bg-white focus:border-red-200 transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("appointments.form_time")}</label>
                    <input type="time" value={formData.time}
                      onChange={e => setFormData(prev => ({...prev, time: e.target.value}))}
                      className="w-full h-9 md:h-10 bg-zinc-50 border border-zinc-100 rounded-xl px-3 text-[11px] md:text-xs font-medium outline-none focus:bg-white focus:border-red-200 transition-all" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <InputField label={t("appointments.form_duration")} type="number" value={formData.duration} onChange={v => setFormData(prev => ({...prev, duration: v}))} />
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("appointments.form_status")}</label>
                    <select value={formData.status}
                      onChange={e => setFormData(prev => ({...prev, status: e.target.value as AppointmentStatus}))}
                      className="w-full h-9 md:h-10 bg-zinc-50 border border-zinc-100 rounded-xl px-3 text-[11px] md:text-xs font-medium outline-none focus:bg-white focus:border-red-200 transition-all">
                      {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("appointments.form_notes")}</label>
                  <textarea value={formData.notes}
                    onChange={e => setFormData(prev => ({...prev, notes: e.target.value}))} rows={3}
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-xl p-3 text-[11px] md:text-xs font-medium outline-none focus:bg-white focus:border-red-200 transition-all resize-none" />
                </div>
              </div>

              {conflictError && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-red-600 mt-0.5 shrink-0" />
                  <p className="text-[10px] font-medium text-red-700">{conflictError}</p>
                </div>
              )}

              <motion.button whileTap={{ scale: 0.95 }} onClick={handleSave} disabled={saving || !canSave}
                className="w-full flex items-center justify-center gap-2 py-3 md:py-4 bg-red-600 text-white rounded-xl text-xs font-black italic hover:bg-red-700 transition-all shadow-lg shadow-red-100 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? t("appointments.form_saving") : editingId ? t("appointments.form_save") : t("appointments.form_create")}
              </motion.button>
              {!canSave && !saving && (
                <p className="text-[10px] text-red-500 text-center font-medium italic">
                  {t("appointments.form_required_hint")}
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── List View ── */
function ListView({ appointments, onEdit, onDelete, onStatusChange, statusConfig, t, locale }: {
  appointments: AppointmentData[];
  onEdit: (a: AppointmentData) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: AppointmentStatus) => void;
  statusConfig: Record<AppointmentStatus, { label: string; color: string; bg: string; icon: React.ReactNode }>;
  t: (key: string) => string;
  locale: string;
}) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (appointments.length === 0) {
    return (
      <div className="py-10 md:py-16 text-center italic font-black uppercase tracking-widest text-zinc-200 text-[10px] md:text-xs">
        {t("appointments.list_empty")}
      </div>
    );
  }

  return (
    <div className="space-y-1.5 md:space-y-3">
      {appointments.map(a => (
        <div key={a._id} className="bg-white rounded-xl md:rounded-2xl border border-zinc-100 p-3 md:p-5 shadow-sm hover:border-red-200 transition-all">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-1 md:space-y-1.5">
              <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
                <p className="text-[10px] md:text-sm font-black italic text-zinc-950">{a.customerInfo.name}</p>
                <span className={cn("px-1.5 md:px-2 py-0.5 rounded-full text-[7px] md:text-[8px] font-black italic border flex items-center gap-0.5 md:gap-1", statusConfig[a.status]?.bg, statusConfig[a.status]?.color)}>
                  {statusConfig[a.status]?.icon}
                  {statusConfig[a.status]?.label}
                </span>
              </div>
              <div className="flex items-center gap-2 md:gap-3 text-[8px] md:text-[10px] text-zinc-500 font-medium flex-wrap">
                <span className="flex items-center gap-1">
                  <CalendarIcon className="w-3 h-3" />
                  {new Date(a.date + "T" + (a.time || "00:00")).toLocaleDateString(locale, { day: "numeric", month: "short" })}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {a.time} ({a.duration}min)
                </span>
                {a.service?.name && <span>{a.service.name}</span>}
                {a.paymentStatus && a.paymentStatus !== "paid" && (
                  <span className={cn("px-1.5 py-0.5 rounded text-[7px] font-black uppercase italic",
                    a.paymentStatus === "unpaid" ? "bg-amber-50 text-amber-700" :
                    a.paymentStatus === "pending" ? "bg-blue-50 text-blue-700" :
                    "bg-red-50 text-red-700"
                  )}>
                    {a.paymentStatus === "unpaid" ? "Pendiente de pago" :
                     a.paymentStatus === "pending" ? "Pago en proceso" : a.paymentStatus}
                  </span>
                )}
                {a.stripePaymentUrl && a.paymentStatus === "unpaid" && (
                  <a href={a.stripePaymentUrl} target="_blank" rel="noopener"
                    className="text-[8px] font-black italic text-red-600 hover:text-red-700 underline inline-flex items-center gap-0.5">
                    Pagar ahora
                  </a>
                )}
                {a.customerInfo.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {a.customerInfo.email}
                  </span>
                )}
                {a.customerInfo.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {a.customerInfo.phone}
                  </span>
                )}
              </div>
              {a.notes && <p className="text-[8px] md:text-[10px] text-zinc-400 italic">{a.notes}</p>}
            </div>
            <div className="flex items-center gap-0.5 md:gap-1 shrink-0">
<StatusMenu current={a.status} onChange={(s) => onStatusChange(a._id, s)} statusConfig={statusConfig} />
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => onEdit(a)}
                className="p-1 md:p-1.5 hover:bg-zinc-50 rounded-lg transition-all">
                <Edit3 className="w-3 h-3 md:w-3.5 md:h-3.5 text-zinc-400" />
              </motion.button>
              {confirmDeleteId === a._id ? (
                <div className="flex gap-0.5 md:gap-1">
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => { onDelete(a._id); setConfirmDeleteId(null); }}
                    className="p-1 md:p-1.5 bg-red-100 text-red-600 rounded-lg text-[7px] md:text-[8px] font-black italic">{t("appointments.delete_yes")}</motion.button>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => setConfirmDeleteId(null)}
                    className="p-1 md:p-1.5 bg-zinc-100 text-zinc-500 rounded-lg text-[7px] md:text-[8px] font-black italic">{t("appointments.delete_no")}</motion.button>
                </div>
              ) : (
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setConfirmDeleteId(a._id)}
                  className="p-1 md:p-1.5 hover:bg-rose-50 rounded-lg transition-all">
                  <Trash2 className="w-3 h-3 md:w-3.5 md:h-3.5 text-zinc-300 hover:text-rose-500" />
                </motion.button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Calendar View ── */
function CalendarView({ view, setView, year, month, setYear, setMonth, date, setDate, monthDays, appointments, getApptsForDay, weekDays, onEdit, onDateClick, statusConfig, months, days, t }: {
  view: CalendarView; setView: (v: CalendarView) => void;
  year: number; month: number; setYear: (y: number) => void; setMonth: (m: number) => void;
  date: string; setDate: (d: string) => void;
  monthDays: (number | null)[]; appointments: AppointmentData[];
  getApptsForDay: (y: number, m: number, d: number) => AppointmentData[];
  weekDays: string[]; onEdit: (a: AppointmentData) => void;
  onDateClick: (d: string) => void;
  statusConfig: Record<AppointmentStatus, { label: string; color: string; bg: string; icon: React.ReactNode }>;
  months: string[]; days: string[]; t: (key: string) => string;
}) {
  const todayStr = new Date().toISOString().split("T")[0];

  const prevMonth = () => { if (month === 0) { setYear(year - 1); setMonth(11); } else setMonth(month - 1); };
  const nextMonth = () => { if (month === 11) { setYear(year + 1); setMonth(0); } else setMonth(month + 1); };

  const dayAppointments = appointments.filter(a => a.date === date);

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden shadow-sm">
      {/* Calendar nav */}
      <div className="flex items-center justify-between p-2 md:p-4 border-b border-zinc-100">
        <div className="flex items-center gap-1 md:gap-2">
          <motion.button whileTap={{ scale: 0.9 }} onClick={prevMonth}
            className="p-1 md:p-1.5 hover:bg-zinc-50 rounded-lg transition-all">
            <ChevronLeft className="w-3.5 h-3.5 md:w-4 md:h-4 text-zinc-500" />
          </motion.button>
          <h4 className="text-[10px] md:text-sm font-black italic text-zinc-950 uppercase tracking-tighter min-w-[100px] md:min-w-[140px] text-center">
            {months[month]} {year}
          </h4>
          <motion.button whileTap={{ scale: 0.9 }} onClick={nextMonth}
            className="p-1 md:p-1.5 hover:bg-zinc-50 rounded-lg transition-all">
            <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4 text-zinc-500" />
          </motion.button>
        </div>
        <div className="flex gap-0.5 md:gap-1">
          {(["month", "week", "day"] as CalendarView[]).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={cn("px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-lg text-[7px] md:text-[8px] font-black italic uppercase transition-all",
                view === v ? "bg-red-600 text-white" : "text-zinc-400 hover:bg-zinc-50"
              )}>{v === "month" ? t("appointments.view_month") : v === "week" ? t("appointments.view_week") : t("appointments.view_day")}</button>
          ))}
        </div>
      </div>

      <div className="p-2 md:p-4">
        {/* Month grid */}
        <div className="grid grid-cols-7 gap-px bg-zinc-100 rounded-lg md:rounded-xl overflow-hidden">
          {days.map(d => (
            <div key={d} className="bg-zinc-50 p-1 md:p-2 text-center text-[7px] md:text-[9px] font-black text-zinc-400 uppercase italic">{d}</div>
          ))}
          {monthDays.map((day, i) => {
            if (day === null) return <div key={`e${i}`} className="bg-white p-1 md:p-2 min-h-[40px] md:min-h-[80px]" />;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayApps = getApptsForDay(year, month, day);
            const isToday = dateStr === todayStr;
            return (
              <div key={day} onClick={() => onDateClick(dateStr)}
                className={cn("bg-white p-1 md:p-2 min-h-[40px] md:min-h-[80px] cursor-pointer hover:bg-zinc-50 transition-all border-b border-zinc-50",
                  isToday && "bg-red-50/30"
                )}>
                <span className={cn("text-[8px] md:text-[10px] font-black italic inline-flex items-center justify-center w-4 h-4 md:w-5 md:h-5 rounded-full",
                  isToday && "bg-red-600 text-white w-4 h-4 md:w-5 md:h-5"
                )}>{day}</span>
                <div className="space-y-px md:space-y-0.5 mt-px md:mt-0.5">
                  {dayApps.slice(0, 2).map(a => (
                    <div key={a._id} onClick={e => { e.stopPropagation(); onEdit(a); }}
                      className={cn("text-[5px] md:text-[7px] font-black italic px-0.5 md:px-1 py-px rounded truncate leading-tight",
                        a.status === "confirmed" ? "bg-emerald-100 text-emerald-700" :
                        a.status === "in_progress" ? "bg-blue-100 text-blue-700" :
                        a.status === "completed" ? "bg-zinc-100 text-zinc-500" :
                        a.status === "cancelled" ? "bg-red-100 text-red-500" :
                        "bg-amber-100 text-amber-700"
                      )}>
                      {a.time} {a.customerInfo.name?.split(" ")[0]}
                    </div>
                  ))}
                  {dayApps.length > 2 && (
                    <span className="text-[5px] md:text-[6px] font-black text-zinc-400 italic">{t("appointments.calendar_more").replace("{n}", String(dayApps.length - 2))}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Day detail (for week/day view — simplified for now) */}
        {view !== "month" && (
          <div className="mt-2 md:mt-4 space-y-1.5 md:space-y-2">
            <h5 className="text-[9px] md:text-[10px] font-black italic text-zinc-500 uppercase tracking-wider">
              {view === "day" ? t("appointments.calendar_day_title") : t("appointments.calendar_week_title")}
            </h5>
            {dayAppointments.length === 0 ? (
              <p className="text-[9px] md:text-[10px] text-zinc-400 italic py-3 md:py-4 text-center">{t("appointments.calendar_empty")}</p>
            ) : dayAppointments.map(a => (
              <div key={a._id} className="flex items-center gap-2 md:gap-3 p-2 md:p-3 bg-zinc-50 rounded-lg md:rounded-xl border border-zinc-100">
                <span className={cn("w-1.5 h-1.5 md:w-2 md:h-2 rounded-full shrink-0",
                  a.status === "confirmed" ? "bg-emerald-500" :
                  a.status === "in_progress" ? "bg-blue-500" :
                  a.status === "completed" ? "bg-zinc-400" :
                  a.status === "cancelled" ? "bg-red-500" : "bg-amber-500"
                )} />
                <span className="text-[10px] font-black italic text-zinc-700 w-12">{a.time}</span>
                <span className="text-[10px] font-medium text-zinc-600 truncate flex-1">{a.customerInfo.name}</span>
                {a.service?.name && <span className="text-[9px] text-zinc-400 hidden sm:block">{a.service.name}</span>}
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => onEdit(a)}
                  className="p-1 hover:bg-white rounded-lg transition-all">
                  <Edit3 className="w-3 h-3 text-zinc-400" />
                </motion.button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Status Menu ── */
function StatusMenu({ current, onChange, statusConfig }: { current: AppointmentStatus; onChange: (s: AppointmentStatus) => void; statusConfig: Record<AppointmentStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> }) {
  const [open, setOpen] = useState(false);
  const nextStates: AppointmentStatus[] = ["pending", "confirmed", "in_progress", "completed"];

  return (
    <div className="relative">
      <motion.button whileTap={{ scale: 0.9 }} onClick={() => setOpen(!open)}
        className={cn("px-1.5 py-0.5 md:px-2 md:py-1 rounded-md md:rounded-lg text-[7px] md:text-[8px] font-black italic border flex items-center gap-0.5 md:gap-1", statusConfig[current]?.bg, statusConfig[current]?.color)}>
        {statusConfig[current]?.icon}
        <span className="hidden sm:inline">{statusConfig[current]?.label}</span>
        <span className="sm:hidden">{statusConfig[current]?.label[0]}</span>
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
            className="absolute right-0 top-full mt-1 bg-white border border-zinc-100 rounded-lg md:rounded-xl shadow-xl z-20 p-0.5 md:p-1 min-w-[110px] md:min-w-[130px]">
            {nextStates.filter(s => s !== current).concat(current !== "cancelled" ? ["cancelled" as AppointmentStatus] : []).map(s => (
              <button key={s} onClick={() => { onChange(s); setOpen(false); }}
                className={cn("w-full text-left flex items-center gap-1.5 md:gap-2 px-2 py-1 md:px-2.5 md:py-1.5 rounded-md md:rounded-lg text-[8px] md:text-[10px] font-medium transition-all hover:bg-zinc-50", statusConfig[s]?.color)}>
                {statusConfig[s]?.icon} {statusConfig[s]?.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Shared Components ── */
function AppointmentRow({ appointment: a, onEdit, onStatusChange, compact, statusConfig, t }: {
  appointment: AppointmentData;
  onEdit: (a: AppointmentData) => void;
  onStatusChange: (id: string, s: AppointmentStatus) => void;
  compact?: boolean;
  statusConfig: Record<AppointmentStatus, { label: string; color: string; bg: string; icon: React.ReactNode }>;
  t: (key: string) => string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-1.5 md:gap-2 p-2 md:p-2.5 rounded-lg md:rounded-xl border transition-all hover:border-red-200",
      statusConfig[a.status]?.bg)}>
      <div className="flex items-center gap-1.5 md:gap-2 min-w-0 flex-1">
        <div className="w-5 h-5 md:w-7 md:h-7 bg-white rounded-md md:rounded-lg flex items-center justify-center shrink-0">
          <User className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 text-zinc-400" />
        </div>
        <div className="min-w-0">
          <p className="text-[8px] md:text-[10px] font-black italic text-zinc-700 truncate">{a.customerInfo.name}</p>
          <p className="text-[7px] md:text-[8px] text-zinc-400 font-medium">{a.time} · {a.service?.name || t("appointments.no_service")}</p>
        </div>
      </div>
      <div className="flex items-center gap-0.5 md:gap-1 shrink-0">
        <StatusMenu current={a.status} onChange={(s) => onStatusChange(a._id, s)} statusConfig={statusConfig} />
        {!compact && (
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => onEdit(a)}
            className="p-0.5 md:p-1 hover:bg-white rounded-md md:rounded-lg transition-all">
            <Edit3 className="w-2.5 h-2.5 md:w-3 md:h-3 text-zinc-400" />
          </motion.button>
        )}
      </div>
    </div>
  );
}

function InputField({ label, type = "text", value, onChange }: { label: string; type?: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className="w-full h-9 md:h-10 bg-zinc-50 border border-zinc-100 rounded-xl px-3 text-[11px] md:text-xs font-medium outline-none focus:bg-white focus:border-red-200 transition-all" />
    </div>
  );
}
