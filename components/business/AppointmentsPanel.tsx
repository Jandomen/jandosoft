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

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pending:      { label: "Pendiente",    color: "text-amber-600", bg: "bg-amber-50 border-amber-200", icon: <Clock className="w-3 h-3" /> },
  confirmed:    { label: "Confirmada",   color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", icon: <CheckCircle2 className="w-3 h-3" /> },
  in_progress:  { label: "En curso",     color: "text-blue-600", bg: "bg-blue-50 border-blue-200", icon: <ArrowUpRight className="w-3 h-3" /> },
  completed:    { label: "Finalizada",   color: "text-zinc-600", bg: "bg-zinc-50 border-zinc-200", icon: <CheckCircle className="w-3 h-3" /> },
  cancelled:    { label: "Cancelada",    color: "text-red-600", bg: "bg-red-50 border-red-200", icon: <Ban className="w-3 h-3" /> },
};

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DAYS = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];

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

export default function AppointmentsPanel({ storeId, refreshTrigger = 0 }: { storeId: string; refreshTrigger?: number }) {
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

  const handleSave = async () => {
    if (!formData.date || !formData.time) return;
    setSaving(true);
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
        await fetch(`/api/appointments/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/appointments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      setShowForm(false);
      loadAppointments();
      loadStats();
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
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 md:gap-4 flex-wrap">
        <h3 className="max-[400px]:text-xl text-2xl font-black italic text-zinc-950 uppercase tracking-tighter">
          Agenda
        </h3>
        <div className="flex gap-1 ml-auto">
          <button onClick={() => setViewMode("list")}
            className={cn("flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black italic transition-all",
              viewMode === "list" ? "bg-red-600 text-white shadow-md" : "bg-zinc-50 text-zinc-500 hover:bg-zinc-100"
            )}>
            <List className="w-3 h-3" /> Lista
          </button>
          <button onClick={() => setViewMode("calendar")}
            className={cn("flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black italic transition-all",
              viewMode === "calendar" ? "bg-red-600 text-white shadow-md" : "bg-zinc-50 text-zinc-500 hover:bg-zinc-100"
            )}>
            <CalendarDays className="w-3 h-3" /> Calendario
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        <div className="bg-amber-50 rounded-xl md:rounded-2xl p-3 md:p-4 border border-amber-100 space-y-1">
          <p className="text-[8px] font-black text-amber-600 uppercase italic flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" /> Hoy
          </p>
          <p className="text-lg md:text-2xl font-black italic text-amber-700">{stats.today}</p>
        </div>
        <div className="bg-emerald-50 rounded-xl md:rounded-2xl p-3 md:p-4 border border-emerald-100 space-y-1">
          <p className="text-[8px] font-black text-emerald-600 uppercase italic flex items-center gap-1">
            <ArrowUpRight className="w-2.5 h-2.5" /> Próximas
          </p>
          <p className="text-lg md:text-2xl font-black italic text-emerald-700">{stats.upcoming}</p>
        </div>
        <div className="bg-blue-50 rounded-xl md:rounded-2xl p-3 md:p-4 border border-blue-100 space-y-1">
          <p className="text-[8px] font-black text-blue-600 uppercase italic flex items-center gap-1">
            <CheckCircle className="w-2.5 h-2.5" /> Completadas
          </p>
          <p className="text-lg md:text-2xl font-black italic text-blue-700">{stats.completed}</p>
        </div>
        <div className="bg-red-50 rounded-xl md:rounded-2xl p-3 md:p-4 border border-red-100 space-y-1">
          <p className="text-[8px] font-black text-red-600 uppercase italic flex items-center gap-1">
            <Ban className="w-2.5 h-2.5" /> Canceladas
          </p>
          <p className="text-lg md:text-2xl font-black italic text-red-700">{stats.cancelled}</p>
        </div>
      </div>

      {/* Filters + Create */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="bg-zinc-50 border border-zinc-100 rounded-xl px-2.5 py-1.5 text-[9px] font-black italic text-zinc-500 outline-none">
            <option value="">Todos los estados</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
            className="bg-zinc-50 border border-zinc-100 rounded-xl px-2.5 py-1.5 text-[9px] font-medium text-zinc-600 outline-none w-[130px]" />
        </div>
        <motion.button whileTap={{ scale: 0.95 }} onClick={openCreateForm}
          className="flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black italic hover:bg-red-700 transition-all shadow-lg shadow-red-100">
          <Plus className="w-3 h-3" /> Nueva Cita
        </motion.button>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-zinc-300" /></div>
      ) : viewMode === "list" ? (
        <ListView appointments={appointments} onEdit={openEditForm} onDelete={handleDelete} onStatusChange={handleStatusChange} />
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
        />
      )}

      {/* Today's summary */}
      <div className="grid md:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-white rounded-2xl border border-zinc-100 p-4 md:p-5 shadow-sm space-y-3">
          <h4 className="text-[10px] font-black italic text-zinc-500 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-amber-500" /> Citas de Hoy
          </h4>
          {appointmentsToday.length === 0 ? (
            <p className="text-[10px] text-zinc-400 italic text-center py-6">Sin citas para hoy</p>
          ) : appointmentsToday.slice(0, 5).map(a => (
            <AppointmentRow key={a._id} appointment={a} onEdit={openEditForm} onStatusChange={handleStatusChange} compact />
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-zinc-100 p-4 md:p-5 shadow-sm space-y-3">
          <h4 className="text-[10px] font-black italic text-zinc-500 uppercase tracking-wider flex items-center gap-2">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" /> Próximas Citas
          </h4>
          {upcomingAppts.length === 0 ? (
            <p className="text-[10px] text-zinc-400 italic text-center py-6">Sin próximas citas</p>
          ) : upcomingAppts.slice(0, 5).map(a => (
            <AppointmentRow key={a._id} appointment={a} onEdit={openEditForm} onStatusChange={handleStatusChange} compact />
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
              className="bg-white rounded-[2rem] p-5 md:p-8 max-w-lg w-full shadow-2xl border border-zinc-100 max-h-[90vh] overflow-y-auto space-y-5"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black italic text-zinc-950 uppercase tracking-tighter">
                  {editingId ? "Editar Cita" : "Nueva Cita"}
                </h3>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowForm(false)}
                  className="p-1.5 hover:bg-zinc-50 rounded-xl transition-all">
                  <X className="w-4 h-4 text-zinc-400" />
                </motion.button>
              </div>

              <div className="space-y-4">
                {/* Customer selector */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Cliente existente</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-300" />
                    <input type="text" placeholder="Buscar cliente..." value={customerSearch}
                      onChange={e => setCustomerSearch(e.target.value)}
                      className="w-full bg-zinc-50 pl-8 pr-3 py-2 rounded-xl border border-zinc-100 outline-none text-xs font-medium focus:bg-white focus:border-red-200 transition-all" />
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
                      {filteredCustomers.length === 0 && <p className="text-[10px] text-zinc-400 text-center py-2 italic">Sin resultados</p>}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <InputField label="Nombre" value={formData.customerName} onChange={v => setFormData(prev => ({...prev, customerName: v}))} />
                  <InputField label="Email" type="email" value={formData.customerEmail} onChange={v => setFormData(prev => ({...prev, customerEmail: v}))} />
                </div>
                <InputField label="Teléfono" value={formData.customerPhone} onChange={v => setFormData(prev => ({...prev, customerPhone: v}))} />

                <div className="grid grid-cols-2 gap-3">
                  <InputField label="Servicio" value={formData.serviceName} onChange={v => setFormData(prev => ({...prev, serviceName: v}))} />
                  <InputField label="Precio" type="number" value={formData.servicePrice} onChange={v => setFormData(prev => ({...prev, servicePrice: v}))} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Fecha</label>
                    <input type="date" value={formData.date}
                      onChange={e => setFormData(prev => ({...prev, date: e.target.value}))}
                      className="w-full h-10 bg-zinc-50 border border-zinc-100 rounded-xl px-3 text-xs font-medium outline-none focus:bg-white focus:border-red-200 transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Hora</label>
                    <input type="time" value={formData.time}
                      onChange={e => setFormData(prev => ({...prev, time: e.target.value}))}
                      className="w-full h-10 bg-zinc-50 border border-zinc-100 rounded-xl px-3 text-xs font-medium outline-none focus:bg-white focus:border-red-200 transition-all" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <InputField label="Duración (min)" type="number" value={formData.duration} onChange={v => setFormData(prev => ({...prev, duration: v}))} />
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Estado</label>
                    <select value={formData.status}
                      onChange={e => setFormData(prev => ({...prev, status: e.target.value as AppointmentStatus}))}
                      className="w-full h-10 bg-zinc-50 border border-zinc-100 rounded-xl px-3 text-xs font-medium outline-none focus:bg-white focus:border-red-200 transition-all">
                      {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Notas</label>
                  <textarea value={formData.notes}
                    onChange={e => setFormData(prev => ({...prev, notes: e.target.value}))} rows={3}
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-xl p-3 text-xs font-medium outline-none focus:bg-white focus:border-red-200 transition-all resize-none" />
                </div>
              </div>

              <motion.button whileTap={{ scale: 0.95 }} onClick={handleSave} disabled={saving || !formData.date || !formData.time}
                className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 text-white rounded-xl text-xs font-black italic hover:bg-red-700 transition-all shadow-lg shadow-red-100 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? "Guardando..." : editingId ? "Guardar Cambios" : "Crear Cita"}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── List View ── */
function ListView({ appointments, onEdit, onDelete, onStatusChange }: {
  appointments: AppointmentData[];
  onEdit: (a: AppointmentData) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: AppointmentStatus) => void;
}) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (appointments.length === 0) {
    return (
      <div className="py-16 text-center italic font-black uppercase tracking-widest text-zinc-200 text-xs">
        No hay citas registradas
      </div>
    );
  }

  return (
    <div className="space-y-2 md:space-y-3">
      {appointments.map(a => (
        <div key={a._id} className="bg-white rounded-2xl border border-zinc-100 p-4 md:p-5 shadow-sm hover:border-red-200 transition-all">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs md:text-sm font-black italic text-zinc-950">{a.customerInfo.name}</p>
                <span className={cn("px-2 py-0.5 rounded-full text-[8px] font-black italic border flex items-center gap-1", STATUS_CONFIG[a.status]?.bg, STATUS_CONFIG[a.status]?.color)}>
                  {STATUS_CONFIG[a.status]?.icon}
                  {STATUS_CONFIG[a.status]?.label}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-zinc-500 font-medium flex-wrap">
                <span className="flex items-center gap-1">
                  <CalendarIcon className="w-3 h-3" />
                  {new Date(a.date + "T" + (a.time || "00:00")).toLocaleDateString("es", { day: "numeric", month: "short" })}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {a.time} ({a.duration}min)
                </span>
                {a.service?.name && <span>{a.service.name}</span>}
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
              {a.notes && <p className="text-[10px] text-zinc-400 italic">{a.notes}</p>}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <StatusMenu current={a.status} onChange={(s) => onStatusChange(a._id, s)} />
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => onEdit(a)}
                className="p-1.5 hover:bg-zinc-50 rounded-lg transition-all">
                <Edit3 className="w-3.5 h-3.5 text-zinc-400" />
              </motion.button>
              {confirmDeleteId === a._id ? (
                <div className="flex gap-1">
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => { onDelete(a._id); setConfirmDeleteId(null); }}
                    className="p-1.5 bg-red-100 text-red-600 rounded-lg text-[8px] font-black italic">Sí</motion.button>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => setConfirmDeleteId(null)}
                    className="p-1.5 bg-zinc-100 text-zinc-500 rounded-lg text-[8px] font-black italic">No</motion.button>
                </div>
              ) : (
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setConfirmDeleteId(a._id)}
                  className="p-1.5 hover:bg-rose-50 rounded-lg transition-all">
                  <Trash2 className="w-3.5 h-3.5 text-zinc-300 hover:text-rose-500" />
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
function CalendarView({ view, setView, year, month, setYear, setMonth, date, setDate, monthDays, appointments, getApptsForDay, weekDays, onEdit, onDateClick }: {
  view: CalendarView; setView: (v: CalendarView) => void;
  year: number; month: number; setYear: (y: number) => void; setMonth: (m: number) => void;
  date: string; setDate: (d: string) => void;
  monthDays: (number | null)[]; appointments: AppointmentData[];
  getApptsForDay: (y: number, m: number, d: number) => AppointmentData[];
  weekDays: string[]; onEdit: (a: AppointmentData) => void;
  onDateClick: (d: string) => void;
}) {
  const todayStr = new Date().toISOString().split("T")[0];

  const prevMonth = () => { if (month === 0) { setYear(year - 1); setMonth(11); } else setMonth(month - 1); };
  const nextMonth = () => { if (month === 11) { setYear(year + 1); setMonth(0); } else setMonth(month + 1); };

  const dayAppointments = appointments.filter(a => a.date === date);

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden shadow-sm">
      {/* Calendar nav */}
      <div className="flex items-center justify-between p-3 md:p-4 border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <motion.button whileTap={{ scale: 0.9 }} onClick={prevMonth}
            className="p-1.5 hover:bg-zinc-50 rounded-lg transition-all">
            <ChevronLeft className="w-4 h-4 text-zinc-500" />
          </motion.button>
          <h4 className="text-xs md:text-sm font-black italic text-zinc-950 uppercase tracking-tighter min-w-[140px] text-center">
            {MONTHS[month]} {year}
          </h4>
          <motion.button whileTap={{ scale: 0.9 }} onClick={nextMonth}
            className="p-1.5 hover:bg-zinc-50 rounded-lg transition-all">
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          </motion.button>
        </div>
        <div className="flex gap-1">
          {(["month", "week", "day"] as CalendarView[]).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={cn("px-2.5 py-1 rounded-lg text-[8px] font-black italic uppercase transition-all",
                view === v ? "bg-red-600 text-white" : "text-zinc-400 hover:bg-zinc-50"
              )}>{v === "month" ? "Mes" : v === "week" ? "Sem" : "Día"}</button>
          ))}
        </div>
      </div>

      <div className="p-3 md:p-4">
        {/* Month grid */}
        <div className="grid grid-cols-7 gap-px bg-zinc-100 rounded-xl overflow-hidden">
          {DAYS.map(d => (
            <div key={d} className="bg-zinc-50 p-1.5 md:p-2 text-center text-[8px] md:text-[9px] font-black text-zinc-400 uppercase italic">{d}</div>
          ))}
          {monthDays.map((day, i) => {
            if (day === null) return <div key={`e${i}`} className="bg-white p-1.5 md:p-2 min-h-[60px] md:min-h-[80px]" />;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayApps = getApptsForDay(year, month, day);
            const isToday = dateStr === todayStr;
            return (
              <div key={day} onClick={() => onDateClick(dateStr)}
                className={cn("bg-white p-1.5 md:p-2 min-h-[60px] md:min-h-[80px] cursor-pointer hover:bg-zinc-50 transition-all border-b border-zinc-50",
                  isToday && "bg-red-50/30"
                )}>
                <span className={cn("text-[9px] md:text-[10px] font-black italic inline-flex items-center justify-center w-5 h-5 rounded-full",
                  isToday && "bg-red-600 text-white w-5 h-5"
                )}>{day}</span>
                <div className="space-y-0.5 mt-0.5">
                  {dayApps.slice(0, 2).map(a => (
                    <div key={a._id} onClick={e => { e.stopPropagation(); onEdit(a); }}
                      className={cn("text-[6px] md:text-[7px] font-black italic px-1 py-0.5 rounded truncate leading-tight",
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
                    <span className="text-[6px] font-black text-zinc-400 italic">+{dayApps.length - 2} más</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Day detail (for week/day view — simplified for now) */}
        {view !== "month" && (
          <div className="mt-4 space-y-2">
            <h5 className="text-[10px] font-black italic text-zinc-500 uppercase tracking-wider">
              {view === "day" ? "Citas del día" : "Citas de la semana"}
            </h5>
            {dayAppointments.length === 0 ? (
              <p className="text-[10px] text-zinc-400 italic py-4 text-center">Sin citas</p>
            ) : dayAppointments.map(a => (
              <div key={a._id} className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                <span className={cn("w-2 h-2 rounded-full shrink-0",
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
function StatusMenu({ current, onChange }: { current: AppointmentStatus; onChange: (s: AppointmentStatus) => void }) {
  const [open, setOpen] = useState(false);
  const nextStates: AppointmentStatus[] = ["pending", "confirmed", "in_progress", "completed"];

  return (
    <div className="relative">
      <motion.button whileTap={{ scale: 0.9 }} onClick={() => setOpen(!open)}
        className={cn("px-2 py-1 rounded-lg text-[8px] font-black italic border flex items-center gap-1", STATUS_CONFIG[current]?.bg, STATUS_CONFIG[current]?.color)}>
        {STATUS_CONFIG[current]?.icon}
        <span className="hidden sm:inline">{STATUS_CONFIG[current]?.label}</span>
        <span className="sm:hidden">{STATUS_CONFIG[current]?.label[0]}</span>
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
            className="absolute right-0 top-full mt-1 bg-white border border-zinc-100 rounded-xl shadow-xl z-20 p-1 min-w-[130px]">
            {nextStates.filter(s => s !== current).concat(current !== "cancelled" ? ["cancelled" as AppointmentStatus] : []).map(s => (
              <button key={s} onClick={() => { onChange(s); setOpen(false); }}
                className={cn("w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all hover:bg-zinc-50", STATUS_CONFIG[s]?.color)}>
                {STATUS_CONFIG[s]?.icon} {STATUS_CONFIG[s]?.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Shared Components ── */
function AppointmentRow({ appointment: a, onEdit, onStatusChange, compact }: {
  appointment: AppointmentData;
  onEdit: (a: AppointmentData) => void;
  onStatusChange: (id: string, s: AppointmentStatus) => void;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-2 p-2.5 rounded-xl border transition-all hover:border-red-200",
      STATUS_CONFIG[a.status]?.bg)}>
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center shrink-0">
          <User className="w-3.5 h-3.5 text-zinc-400" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-black italic text-zinc-700 truncate">{a.customerInfo.name}</p>
          <p className="text-[8px] text-zinc-400 font-medium">{a.time} · {a.service?.name || "Sin servicio"}</p>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <StatusMenu current={a.status} onChange={(s) => onStatusChange(a._id, s)} />
        {!compact && (
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => onEdit(a)}
            className="p-1 hover:bg-white rounded-lg transition-all">
            <Edit3 className="w-3 h-3 text-zinc-400" />
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
        className="w-full h-10 bg-zinc-50 border border-zinc-100 rounded-xl px-3 text-xs font-medium outline-none focus:bg-white focus:border-red-200 transition-all" />
    </div>
  );
}
