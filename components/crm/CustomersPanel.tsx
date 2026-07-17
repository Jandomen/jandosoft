"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { AddressAutocomplete } from "@/components/maps/AddressAutocomplete";
import LeadFinder from "./LeadFinder";
import {
  Search, Plus, User, X, Tag, Mail, Phone, Trash2, Edit3, Loader2,
  Save, AlertCircle, MapPin, Map, List, Upload,
  Globe, Filter, Compass, Send, Settings,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useToast } from "@/components/ui/Toast";

interface CustomerData {
  _id: string;
  storeId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  coordinates: { lat: number; lng: number } | null;
  category: string;
  status: string;
  source: string;
  industry: string;
  tags: string[];
  notes: string;
  createdAt: string;
}

export default function CustomersPanel({ storeId }: { storeId: string }) {
  const { t } = useLanguage();
  const { showToast, ToastComponent } = useToast();

  const STATUS_OPTIONS = [
    { value: "lead", color: "text-blue-600 bg-blue-50" },
    { value: "prospect", color: "text-amber-600 bg-amber-50" },
    { value: "customer", color: "text-emerald-600 bg-emerald-50" },
    { value: "churned", color: "text-zinc-500 bg-zinc-100" },
  ];

  const SOURCE_OPTIONS = [
    { value: "manual" },
    { value: "import" },
    { value: "ai" },
    { value: "referral" },
    { value: "website" },
  ];

  const statusLabel = (status: string) => {
    const k = `customers.status_${status}`;
    const v = t(k);
    return v !== k ? v : status;
  };

  const sourceLabel = (src: string) => {
    const k = `customers.source_${src}`;
    const v = t(k);
    return v !== k ? v : src;
  };

  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<CustomerData | null>(null);
  const [detailCustomer, setDetailCustomer] = useState<CustomerData | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<CustomerData | null>(null);
  const [csvImporting, setCsvImporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showLeadFinder, setShowLeadFinder] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showPromotion, setShowPromotion] = useState(false);
  const [promotion, setPromotion] = useState({ subject: "", message: "" });
  const [promoChannel, setPromoChannel] = useState<"email" | "whatsapp" | "both">("email");
  const [showQuickEmail, setShowQuickEmail] = useState(false);
  const [quickEmail, setQuickEmail] = useState({ to: "", subject: "", body: "" });
  const [sendingQuick, setSendingQuick] = useState(false);
  const [sendingPromotion, setSendingPromotion] = useState(false);
  const [promotionResult, setPromotionResult] = useState("");

  const formDefault = {
    name: "", email: "", phone: "", address: "", coordinates: null as { lat: number; lng: number } | null,
    category: "", status: "lead", source: "manual", industry: "", tags: "" as string, notes: "",
  };
  const [form, setForm] = useState(formDefault);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ storeId });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/customers?${params}`);
      const data = await res.json();
      setCustomers(data.customers || []);
    } catch {
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [storeId, search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setEditing(null);
    setForm(formDefault);
    setError("");
    setShowModal(true);
  };

  const openEdit = (c: CustomerData) => {
    setEditing(c);
    setForm({
      name: c.name, email: c.email, phone: c.phone, address: c.address,
      coordinates: c.coordinates, category: c.category, status: c.status,
      source: c.source, industry: c.industry,
      tags: c.tags.join(", "), notes: c.notes,
    });
    setError("");
    setShowModal(true);
  };

  const sendQuickEmail = async () => {
    if (!quickEmail.to || !quickEmail.subject || !quickEmail.body) return;
    setSendingQuick(true);
    try {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: quickEmail.to, subject: quickEmail.subject, content: quickEmail.body }),
      });
      const data = await res.json();
      if (res.ok) {
        setQuickEmail({ to: "", subject: "", body: "" });
        setShowQuickEmail(false);
        setError("");
      } else {
        setError(data.error || "Error al enviar");
      }
    } catch {
      setError("Error de conexión");
    }
    setSendingQuick(false);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError(t("customers.form_error_name")); return; }
    setSaving(true);
    setError("");
    try {
      const tags = form.tags.split(",").map(t => t.trim()).filter(Boolean);
      const body = {
        storeId,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        coordinates: form.coordinates,
        category: form.category,
        status: form.status,
        source: form.source,
        industry: form.industry,
        tags, notes: form.notes.trim(),
      };

      if (editing) {
        await fetch(`/api/customers/${editing._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ $set: body }),
        });
      } else {
        await fetch("/api/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }
      setShowModal(false);
      load();
    } catch {
      setError(t("customers.form_error_save_generic"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteTarget(null);
    try {
      await fetch(`/api/customers/${id}`, { method: "DELETE" });
      load();
    } catch {}
  };

  const handleLeadImport = async (leads: any[]) => {
    setImporting(true);
    try {
      const res = await fetch("/api/customers/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, customers: leads }),
      });
      const data = await res.json();
      load();
    } finally {
      setImporting(false);
    }
  };

  const handleCsvImport = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv,.xlsx,.xls";
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setCsvImporting(true);
      try {
        const text = await file.text();
        const lines = text.split("\n").filter(Boolean);
        if (lines.length < 2) { showToast(t("customers.csv_empty"), "error"); return; }
        const headers = lines[0].split(",").map((h: string) => h.trim().toLowerCase());
        const rows = lines.slice(1).map((line: string) => {
          const vals = line.split(",").map((v: string) => v.trim().replace(/^"|"$/g, ""));
          const row: any = {};
          headers.forEach((h: string, i: number) => {
            if (h === "name" || h === "nombre") row.name = vals[i];
            else if (h === "email" || h === "correo") row.email = vals[i];
            else if (h === "phone" || h === "teléfono" || h === "telefono") row.phone = vals[i];
            else if (h === "address" || h === "dirección" || h === "direccion") row.address = vals[i];
            else if (h === "category" || h === "categoría" || h === "categoria") row.category = vals[i];
            else if (h === "status" || h === "estado") row.status = vals[i];
            else if (h === "industry" || h === "industria") row.industry = vals[i];
            else if (h === "tags" || h === "etiquetas") row.tags = vals[i];
            else if (h === "notes" || h === "notas") row.notes = vals[i];
          });
          return row;
        }).filter((r: any) => r.name);
        const res = await fetch("/api/customers/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storeId, customers: rows }),
        });
        const data = await res.json();
        load();
        showToast(t("customers.import_success").replace("{created}", String(data.created || 0)).replace("{skipped}", String(data.skipped || 0)), "success");
      } catch (err) {
        showToast(t("customers.import_error"), "error");
      } finally {
        setCsvImporting(false);
      }
    };
    input.click();
  };

  const filtered = customers;

  const statusBadge = (status: string) => {
    const s = STATUS_OPTIONS.find(s => s.value === status);
    if (!s) return null;
    return (
      <span className={`text-[7px] md:text-[8px] font-black italic px-1.5 py-0.5 rounded-md uppercase tracking-wider ${s.color}`}>
        {statusLabel(status)}
      </span>
    );
  };

  const customersWithCoords = customers.filter(c => c.coordinates?.lat && c.coordinates?.lng);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 md:gap-4 flex-wrap">
        <h3 className="max-[400px]:text-xl text-2xl font-black italic text-zinc-950 uppercase tracking-tighter">
          {t("customers.header_title").replace("{count}", String(customers.length))}
        </h3>
        <div className="relative flex-1 min-w-[140px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
          <input type="text" placeholder={t("customers.search_placeholder_full")}
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-zinc-50 pl-10 pr-4 py-2.5 rounded-xl border border-zinc-100 outline-none text-xs font-medium focus:bg-white focus:border-red-200 transition-all"
          />
        </div>
        <button onClick={() => setShowFilters(!showFilters)}
          className={cn("p-2.5 rounded-xl border transition-all", showFilters ? "bg-red-50 border-red-200 text-red-600" : "bg-zinc-50 border-zinc-100 text-zinc-400 hover:text-zinc-600")}>
          <Filter className="w-4 h-4" />
        </button>
        <div className="flex items-center bg-zinc-50 rounded-xl border border-zinc-100 p-0.5">
          <button onClick={() => setViewMode("list")}
            className={cn("p-1.5 rounded-lg transition-all", viewMode === "list" ? "bg-white shadow-sm text-red-600" : "text-zinc-400 hover:text-zinc-600")}>
            <List className="w-4 h-4" />
          </button>
          <button onClick={() => setViewMode("map")}
            className={cn("p-1.5 rounded-lg transition-all", viewMode === "map" ? "bg-white shadow-sm text-red-600" : "text-zinc-400 hover:text-zinc-600")}>
            <Map className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex items-center gap-3 flex-wrap p-3 bg-zinc-50 rounded-2xl border border-zinc-100">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="bg-white px-3 py-2 rounded-xl border border-zinc-100 outline-none text-xs font-medium">
            <option value="">{t("customers.filter_all")}</option>
            {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{statusLabel(s.value)}</option>)}
          </select>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <motion.button whileTap={{ scale: 0.95 }} onClick={openNew}
          className="flex items-center gap-1.5 px-3.5 py-2.5 bg-red-600 text-white rounded-xl text-[10px] md:text-xs font-black italic hover:bg-red-700 transition-all shadow-lg shadow-red-100">
          <Plus className="w-3.5 h-3.5" /> {t("customers.new_lead_btn")}
        </motion.button>
        <motion.button whileTap={{ scale: 0.95 }} onClick={handleCsvImport} disabled={csvImporting}
          className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] md:text-xs font-black italic hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50">
          {csvImporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          {t("customers.import_csv_btn")}
        </motion.button>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowLeadFinder(true)}
          className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] md:text-xs font-black italic hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100">
          <Compass className="w-3.5 h-3.5" />
          {t("customers.find_leads_btn")}
        </motion.button>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setPromotion({ subject: "", message: "" }); setPromotionResult(""); setPromoChannel("email"); setShowPromotion(true); }}
          className="flex items-center gap-1.5 px-3.5 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] md:text-xs font-black italic hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
          <Send className="w-3.5 h-3.5" />
          {t("customers.send_promotion_btn")}
        </motion.button>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setQuickEmail({ to: "", subject: "", body: "" }); setShowQuickEmail(true); }}
          className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white text-red-600 border-2 border-red-200 rounded-xl text-[10px] md:text-xs font-black italic hover:bg-red-50 transition-all">
          <Mail className="w-3.5 h-3.5" />
          Correo rápido
        </motion.button>
      </div>

      {/* Map View */}
      {viewMode === "map" && (
        <div>
          {customersWithCoords.length === 0 ? (
            <div className="py-12 text-center italic font-black uppercase tracking-widest text-zinc-200">
              {t("customers.map_empty")}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-4">
                {customersWithCoords.map(c => (
                  <div key={c._id} className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-4 w-full">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center text-zinc-400 shadow-sm shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black italic text-zinc-950 truncate">{c.name}</p>
                        <p className="text-[9px] text-zinc-400 font-bold italic truncate">{c.address}</p>
                      </div>
                      {statusBadge(c.status)}
                    </div>
                    <StoreMap
                      storeId={storeId}
                      coordinates={c.coordinates!}
                      name={c.name}
                      className="w-full aspect-square"
                      style={{ maxHeight: 280 }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <>
          {loading ? (
            <div className="flex items-center justify-center py-16 text-zinc-300">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 md:py-16 text-center italic font-black uppercase tracking-widest text-zinc-200">
              {search || statusFilter ? t("customers.list_empty_filtered") : t("customers.list_empty_all")}
            </div>
          ) : (
            <div className="grid gap-2 md:gap-3">
              {filtered.map(c => (
                <motion.div key={c._id} layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setDetailCustomer(c)}
                  className="group flex items-center gap-3 max-[400px]:p-3 p-4 bg-zinc-50 rounded-2xl border border-zinc-100 hover:border-zinc-200 transition-all cursor-pointer"
                >
                  <div className="w-9 h-9 md:w-10 md:h-10 bg-white rounded-xl flex items-center justify-center text-zinc-400 shadow-sm shrink-0">
                    <User className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-black italic text-zinc-950 truncate">{c.name}</p>
                      {statusBadge(c.status)}
                      {c.source === "ai" && (
                        <span className="text-[7px] font-black italic px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded-md uppercase tracking-wider">AI</span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 mt-0.5">
                      {c.email && <span className="text-[9px] md:text-[10px] text-zinc-400 font-bold italic flex items-center gap-1"><Mail className="w-2.5 h-2.5" />{c.email}</span>}
                      {c.phone && <span className="text-[9px] md:text-[10px] text-zinc-400 font-bold italic flex items-center gap-1"><Phone className="w-2.5 h-2.5" />{c.phone}</span>}
                      {c.industry && <span className="text-[9px] md:text-[10px] text-zinc-400 font-bold italic flex items-center gap-1"><Globe className="w-2.5 h-2.5" />{c.industry}</span>}
                    </div>
                    {c.address && (
                      <p className="text-[8px] md:text-[9px] text-zinc-300 font-medium italic mt-0.5 flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5" />{c.address}
                      </p>
                    )}
                    {c.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {c.tags.map((t, i) => (
                          <span key={i} className="text-[7px] md:text-[8px] font-black italic px-1.5 py-0.5 bg-red-50 text-red-600 rounded-md uppercase tracking-wider">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                    <button onClick={(e) => { e.stopPropagation(); openEdit(c); }} className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(c); }} className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                      <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }} onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="flex items-center justify-between p-4 md:p-6 border-b border-zinc-100">
                <h4 className="text-sm md:text-base font-black italic uppercase tracking-tighter">
                  {editing ? t("customers.edit_modal_title") : t("customers.new_modal_title")}
                </h4>
                <button onClick={() => setShowModal(false)} className="p-1 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-50 transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 md:p-6 space-y-4">
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-xs font-medium text-red-700">
                    <AlertCircle className="w-4 h-4 shrink-0" />{error}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-[9px] md:text-[10px] font-black italic text-zinc-500 uppercase tracking-wider mb-1.5 block">{t("customers.form_name_label")}</label>
                    <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full bg-zinc-50 px-4 py-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-red-200 transition-all"
                      placeholder={t("customers.form_name_placeholder_lead")} />
                  </div>
                  <div>
                    <label className="text-[9px] md:text-[10px] font-black italic text-zinc-500 uppercase tracking-wider mb-1.5 block">{t("customers.form_email_label")}</label>
                    <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      className="w-full bg-zinc-50 px-4 py-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-red-200 transition-all"
                      placeholder={t("customers.form_email_placeholder")} />
                  </div>
                  <div>
                    <label className="text-[9px] md:text-[10px] font-black italic text-zinc-500 uppercase tracking-wider mb-1.5 block">{t("customers.form_phone_label")}</label>
                    <input type="text" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      className="w-full bg-zinc-50 px-4 py-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-red-200 transition-all"
                      placeholder={t("customers.form_phone_placeholder_mx")} />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[9px] md:text-[10px] font-black italic text-zinc-500 uppercase tracking-wider mb-1.5 block">{t("customers.form_address")}</label>
                    <AddressAutocomplete
                      storeId={storeId}
                      value={form.address}
                      onChange={(address, coords) => setForm(f => ({ ...f, address, coordinates: coords || f.coordinates }))}
                      placeholder={t("customers.form_address_placeholder")}
                      className="w-full bg-zinc-50 px-4 py-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-red-200 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] md:text-[10px] font-black italic text-zinc-500 uppercase tracking-wider mb-1.5 block">{t("customers.form_status")}</label>
                    <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                      className="w-full bg-zinc-50 px-4 py-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-red-200 transition-all">
                      {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{statusLabel(s.value)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] md:text-[10px] font-black italic text-zinc-500 uppercase tracking-wider mb-1.5 block">{t("customers.form_source")}</label>
                    <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                      className="w-full bg-zinc-50 px-4 py-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-red-200 transition-all">
                      {SOURCE_OPTIONS.map(s => <option key={s.value} value={s.value}>{sourceLabel(s.value)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] md:text-[10px] font-black italic text-zinc-500 uppercase tracking-wider mb-1.5 block">{t("customers.form_industry")}</label>
                    <input type="text" value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}
                      className="w-full bg-zinc-50 px-4 py-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-red-200 transition-all"
                      placeholder={t("customers.form_industry_placeholder")} />
                  </div>
                  <div>
                    <label className="text-[9px] md:text-[10px] font-black italic text-zinc-500 uppercase tracking-wider mb-1.5 block">{t("customers.form_category")}</label>
                    <input type="text" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                      className="w-full bg-zinc-50 px-4 py-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-red-200 transition-all"
                      placeholder={t("customers.form_category_placeholder")} />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[9px] md:text-[10px] font-black italic text-zinc-500 uppercase tracking-wider mb-1.5 block">{t("customers.form_tags_label")}</label>
                    <input type="text" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                      className="w-full bg-zinc-50 px-4 py-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-red-200 transition-all"
                      placeholder={t("customers.form_tags_placeholder_lead")} />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[9px] md:text-[10px] font-black italic text-zinc-500 uppercase tracking-wider mb-1.5 block">{t("customers.form_notes_label")}</label>
                    <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                      rows={3}
                      className="w-full bg-zinc-50 px-4 py-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-red-200 transition-all resize-none"
                      placeholder={t("customers.form_notes_placeholder_lead")} />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 p-4 md:p-6 border-t border-zinc-100">
                <button onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 text-xs font-black italic text-zinc-500 hover:text-zinc-700 transition-all">
                  {t("action.cancel")}
                </button>
                <motion.button whileTap={{ scale: 0.95 }} onClick={handleSave} disabled={saving}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-red-600 text-white rounded-xl text-xs font-black italic hover:bg-red-700 transition-all shadow-lg shadow-red-100 disabled:opacity-50">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {editing ? t("action.save") : t("customers.form_create_lead")}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {detailCustomer && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setDetailCustomer(null)}
          >
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }} onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="flex items-center justify-between p-5 md:p-6 border-b border-zinc-100">
                <h3 className="text-sm md:text-base font-black italic uppercase tracking-tighter flex items-center gap-2">
                  <User className="w-4 h-4 text-red-600" /> {detailCustomer.name}
                </h3>
                <button onClick={() => setDetailCustomer(null)} className="p-1 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-50 transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 md:p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <DetailField icon={<Mail className="w-3.5 h-3.5" />} label={t("customers.detail_email")} value={detailCustomer.email} />
                  <DetailField icon={<Phone className="w-3.5 h-3.5" />} label={t("customers.detail_phone")} value={detailCustomer.phone} />
                  <DetailField icon={<MapPin className="w-3.5 h-3.5" />} label={t("customers.detail_address")} value={detailCustomer.address} />
                  <DetailField icon={<Globe className="w-3.5 h-3.5" />} label={t("customers.detail_industry")} value={detailCustomer.industry} />
                  <DetailField icon={<Tag className="w-3.5 h-3.5" />} label={t("customers.detail_category")} value={detailCustomer.category} />
                  <div>
                    <p className="text-[9px] font-black italic text-zinc-400 uppercase tracking-wider mb-1">{t("customers.detail_status")}</p>
                    {statusBadge(detailCustomer.status)}
                  </div>
                  <div>
                    <p className="text-[9px] font-black italic text-zinc-400 uppercase tracking-wider mb-1">{t("customers.detail_source")}</p>
                    <span className="text-[10px] font-bold italic text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-md uppercase">{sourceLabel(detailCustomer.source || "manual")}</span>
                  </div>
                  {detailCustomer.coordinates && (
                    <div className="md:col-span-2">
                      <p className="text-[9px] font-black italic text-zinc-400 uppercase tracking-wider mb-1">{t("customers.detail_coordinates")}</p>
                      <p className="text-[10px] font-bold text-zinc-500">
                        {detailCustomer.coordinates.lat.toFixed(6)}, {detailCustomer.coordinates.lng.toFixed(6)}
                        <a href={`https://www.google.com/maps/search/?api=1&query=${detailCustomer.coordinates.lat},${detailCustomer.coordinates.lng}`}
                          target="_blank" rel="noopener noreferrer"
                          className="ml-2 text-[10px] text-green-600 hover:text-green-700 font-black italic inline-flex items-center gap-0.5">
                          <MapPin className="w-2.5 h-2.5" /> {t("customers.detail_open_maps")}
                        </a>
                      </p>
                    </div>
                  )}
                </div>
                {detailCustomer.tags?.length > 0 && (
                  <div>
                    <p className="text-[9px] font-black italic text-zinc-400 uppercase tracking-wider mb-1.5">{t("customers.detail_tags")}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {detailCustomer.tags.map((t, i) => (
                        <span key={i} className="text-[9px] font-black italic px-2 py-1 bg-red-50 text-red-600 rounded-md">{t}</span>
                      ))}
                    </div>
                  </div>
                )}
                {detailCustomer.notes && (
                  <div>
                    <p className="text-[9px] font-black italic text-zinc-400 uppercase tracking-wider mb-1.5">{t("customers.detail_notes")}</p>
                    <p className="text-xs text-zinc-600 bg-zinc-50 p-3 rounded-xl leading-relaxed whitespace-pre-wrap">{detailCustomer.notes}</p>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <button onClick={() => { setDetailCustomer(null); openEdit(detailCustomer); }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black italic hover:bg-blue-700 transition-all">
                    <Edit3 className="w-3.5 h-3.5" /> {t("customers.detail_edit_btn")}
                  </button>
                  <button onClick={() => setDetailCustomer(null)}
                    className="px-4 py-2.5 bg-zinc-100 text-zinc-600 rounded-xl text-[10px] font-black italic hover:bg-zinc-200 transition-all">
                    {t("customers.detail_close_btn")}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <LeadFinder
        storeId={storeId}
        open={showLeadFinder}
        onClose={() => setShowLeadFinder(false)}
        onImport={handleLeadImport}
      />

      <ConfirmModal
        open={!!deleteTarget}
        title={t("customers.delete_title_lead")}
        message={t("customers.delete_message_lead").replace("{name}", deleteTarget?.name || "")}
        confirmLabel={t("customers.delete_confirm_lead")}
        cancelLabel={t("customers.delete_cancel_lead")}
        variant="danger"
        onConfirm={() => handleDelete(deleteTarget!._id)}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Promotion Modal */}
      <AnimatePresence>
        {showPromotion && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowPromotion(false)}
          >
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }} onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="flex items-center justify-between p-4 md:p-6 border-b border-zinc-100">
                <h4 className="text-sm md:text-base font-black italic uppercase tracking-tighter">
                  {t("customers.promotion_title")}
                </h4>
                <button onClick={() => setShowPromotion(false)} className="p-1 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-50 transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 md:p-6 space-y-4">
                <div>
                  <label className="text-[9px] md:text-[10px] font-black italic text-zinc-500 uppercase tracking-wider mb-1.5 block">{t("customers.promotion_channel")}</label>
                  <div className="flex gap-2">
                    {([["email", t("customers.promotion_email")], ["whatsapp", t("customers.promotion_whatsapp")], ["both", t("customers.promotion_both")]] as const).map(([val, label]) => (
                      <button key={val} onClick={() => setPromoChannel(val)}
                        className={cn("flex-1 px-4 py-2.5 rounded-xl border text-[10px] md:text-xs font-black italic transition-all",
                          promoChannel === val
                            ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100"
                            : "bg-zinc-50 text-zinc-500 border-zinc-100 hover:border-zinc-200"
                        )}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                {promoChannel !== "whatsapp" && (
                  <div>
                    <label className="text-[9px] md:text-[10px] font-black italic text-zinc-500 uppercase tracking-wider mb-1.5 block">
                      {promoChannel === "both" ? t("customers.promotion_subject_email") : t("customers.promotion_subject")}
                    </label>
                    <input type="text" value={promotion.subject} onChange={e => setPromotion(p => ({ ...p, subject: e.target.value }))}
                      className="w-full bg-zinc-50 px-4 py-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-blue-200 transition-all"
                      placeholder={t("customers.promotion_subject_placeholder")} />
                  </div>
                )}
                <div>
                  <label className="text-[9px] md:text-[10px] font-black italic text-zinc-500 uppercase tracking-wider mb-1.5 block">
                    {t("customers.promotion_message_label")}
                  </label>
                  <textarea value={promotion.message} onChange={e => setPromotion(p => ({ ...p, message: e.target.value }))}
                    rows={6}
                    className="w-full bg-zinc-50 px-4 py-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-blue-200 transition-all resize-none"
                    placeholder={promoChannel === "whatsapp"
                      ? t("customers.promotion_message_placeholder_wa")
                      : t("customers.promotion_message_placeholder")} />
                </div>

                {promotionResult && (
                  <div className={cn("p-3 rounded-xl text-xs font-medium", promotionResult.startsWith("Promoción enviada") || promotionResult.startsWith("Promotion sent") ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-amber-50 text-amber-700 border border-amber-200")}>
                    <p>{promotionResult}</p>
                    {promotionResult.includes("WhatsApp no configurado") && (
                      <button onClick={() => { setShowPromotion(false); window.dispatchEvent(new CustomEvent("navigate-to-integrations")); }}
                        className="mt-2 px-3 py-1.5 bg-amber-600 text-white rounded-lg text-[8px] font-black italic hover:bg-amber-700 transition-all">
                        {t("customers.promotion_config_whatsapp")}
                      </button>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button onClick={() => setShowPromotion(false)}
                    className="px-4 py-2.5 text-xs font-black italic text-zinc-500 hover:text-zinc-700 transition-all">
                    {t("customers.promotion_cancel")}
                  </button>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={async () => {
                    const needsSubject = promoChannel === "email" || promoChannel === "both";
                    if ((needsSubject && !promotion.subject.trim()) || !promotion.message.trim()) return;
                    setSendingPromotion(true);
                    setPromotionResult("");
                    const eligible = customers.filter(c => promoChannel === "whatsapp" ? c.phone : c.email);
                    try {
                      const res = await fetch("/api/promotions/send", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          storeId,
                          customerIds: eligible.map(c => c._id),
                          subject: promotion.subject.trim(),
                          message: promotion.message.trim(),
                          channel: promoChannel,
                        }),
                      });
                      const data = await res.json();
                      setPromotionResult(data.message || data.error || t("customers.promotion_connection_error"));
                    } catch {
                      setPromotionResult(t("customers.promotion_connection_error"));
                    } finally {
                      setSendingPromotion(false);
                    }
                  }} disabled={sendingPromotion || !promotion.message.trim() || (promoChannel !== "whatsapp" && !promotion.subject.trim())}
                    className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] md:text-xs font-black italic hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50">
                    {sendingPromotion ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    {sendingPromotion ? t("customers.promotion_sending") : t("customers.promotion_send_to").replace("{count}", String(customers.filter(c => promoChannel === "whatsapp" ? c.phone : c.email).length))}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Email Modal */}
      <AnimatePresence>
        {showQuickEmail && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowQuickEmail(false)}
          >
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }} onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between p-4 md:p-6 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-red-50 rounded-xl"><Mail className="w-4 h-4 text-red-600" /></div>
                  <h4 className="text-sm md:text-base font-black italic uppercase tracking-tighter">Correo rápido</h4>
                </div>
                <button onClick={() => setShowQuickEmail(false)} className="p-1 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-50 transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 md:p-6 space-y-4">
                <div>
                  <label className="text-[9px] md:text-[10px] font-black italic text-zinc-500 uppercase tracking-wider mb-1.5 block">Para</label>
                  <input type="email" placeholder="correo@ejemplo.com" value={quickEmail.to} onChange={e => setQuickEmail({...quickEmail, to: e.target.value})}
                    className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none text-xs font-medium focus:bg-white focus:border-red-200 transition-all" />
                </div>
                <div>
                  <label className="text-[9px] md:text-[10px] font-black italic text-zinc-500 uppercase tracking-wider mb-1.5 block">Asunto</label>
                  <input type="text" placeholder="Asunto del correo" value={quickEmail.subject} onChange={e => setQuickEmail({...quickEmail, subject: e.target.value})}
                    className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none text-xs font-medium focus:bg-white focus:border-red-200 transition-all" />
                </div>
                <div>
                  <label className="text-[9px] md:text-[10px] font-black italic text-zinc-500 uppercase tracking-wider mb-1.5 block">Mensaje</label>
                  <textarea placeholder="Escribe tu mensaje..." value={quickEmail.body} onChange={e => setQuickEmail({...quickEmail, body: e.target.value})}
                    className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none text-xs font-medium focus:bg-white focus:border-red-200 transition-all resize-none h-28" />
                </div>
                {error && <p className="text-[10px] text-red-500 font-bold italic">{error}</p>}
                <motion.button whileTap={{ scale: 0.97 }} onClick={sendQuickEmail}
                  disabled={!quickEmail.to || !quickEmail.subject || !quickEmail.body || sendingQuick}
                  className="w-full flex items-center justify-center gap-1.5 px-5 py-3 bg-red-600 text-white rounded-xl text-xs font-black italic hover:bg-red-700 transition-all shadow-lg shadow-red-100 disabled:opacity-50">
                  {sendingQuick ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  {sendingQuick ? "Enviando..." : "Enviar correo"}
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
import { loadGoogleMaps } from "@/lib/maps/loader";
import { DARK_MAP_STYLES, isDarkMode } from "@/lib/maps/dark-mode";

function StoreMap({ coordinates, name, className = "", style, storeId }: {
  coordinates: { lat: number; lng: number };
  name?: string;
  className?: string;
  style?: React.CSSProperties;
  storeId?: string;
}) {
  const { t } = useLanguage();
  const [ready, setReady] = useState(false);
  const [dark, setDark] = useState(false);
  const [configError, setConfigError] = useState("");
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadGoogleMaps(storeId).then(r => {
      if (r.success) setReady(true);
      else setConfigError(r.error || "Error");
    });
  }, [storeId]);

  useEffect(() => {
    setDark(isDarkMode());
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    try {
      const map = new google.maps.Map(mapRef.current, {
        center: coordinates,
        zoom: 16,
        disableDefaultUI: true,
        zoomControl: true,
        styles: dark ? DARK_MAP_STYLES : undefined,
      });
      new google.maps.Marker({ position: coordinates, map, title: name });
    } catch {
      setConfigError(t("customers.map_error"));
      setReady(false);
    }
  }, [ready, coordinates, name, dark, t]);

  if (configError) {
    return <div className={`bg-amber-50 border border-amber-200 rounded-2xl flex flex-col items-center justify-center ${className}`} style={{ minHeight: 180, ...style }}>
      <div className="text-center p-4">
        <Settings className="w-5 h-5 text-amber-500 mx-auto mb-1" />
        <p className="text-[10px] text-amber-700 font-medium mb-2">{configError}</p>
        <div className="flex gap-1.5 justify-center">
          <button onClick={() => { setConfigError(""); loadGoogleMaps(storeId).then(r => { if (r.success) setReady(true); else setConfigError(r.error || "Error"); }); }}
            className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-[8px] font-black italic hover:bg-amber-700 transition-all">
            {t("customers.map_retry")}
          </button>
          <button onClick={() => window.dispatchEvent(new CustomEvent("navigate-to-integrations"))}
            className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-[8px] font-black italic hover:bg-amber-700 transition-all">
            {t("customers.map_configure")}
          </button>
        </div>
      </div>
    </div>;
  }

  if (!ready) {
    return <div className={`bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center ${className}`} style={{ minHeight: 180, ...style }}>
      <span className="text-xs text-zinc-400 font-medium">{t("customers.map_loading")}</span>
    </div>;
  }

  return <div ref={mapRef} className={`rounded-2xl overflow-hidden ${className}`} style={{ minHeight: 180, ...style }} />;
}

function DetailField({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[9px] font-black italic text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1">{icon}{label}</p>
      <p className="text-xs font-bold text-zinc-700">{value}</p>
    </div>
  );
}
