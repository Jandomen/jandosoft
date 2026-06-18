"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { Search, Plus, User, X, Tag, Mail, Phone, Trash2, Edit3, Loader2, Save, AlertCircle } from "lucide-react";

interface CustomerData {
  _id: string;
  storeId: string;
  name: string;
  email: string;
  phone: string;
  tags: string[];
  notes: string;
  createdAt: string;
}

export default function CustomersPanel({ storeId }: { storeId: string }) {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<CustomerData | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<CustomerData | null>(null);

  const formDefault = { name: "", email: "", phone: "", tags: "" as string, notes: "" };
  const [form, setForm] = useState(formDefault);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/customers?storeId=${storeId}`);
      const data = await res.json();
      setCustomers(data.customers || []);
    } catch {
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setEditing(null);
    setForm(formDefault);
    setError("");
    setShowModal(true);
  };

  const openEdit = (c: CustomerData) => {
    setEditing(c);
    setForm({ name: c.name, email: c.email, phone: c.phone, tags: c.tags.join(", "), notes: c.notes });
    setError("");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError("El nombre es obligatorio"); return; }
    setSaving(true);
    setError("");
    try {
      const tags = form.tags.split(",").map(t => t.trim()).filter(Boolean);
      const body = { storeId, name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), tags, notes: form.notes.trim() };

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
      setError("Error al guardar cliente");
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

  const filtered = customers.filter(c =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    c.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center gap-3 md:gap-4 flex-wrap">
        <h3 className="max-[400px]:text-xl text-2xl font-black italic text-zinc-950 uppercase tracking-tighter">
          CRM <span className="text-red-600">({customers.length})</span>
        </h3>
        <div className="relative flex-1 min-w-[140px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
          <input
            type="text" placeholder="Buscar cliente..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-zinc-50 pl-10 pr-4 py-2.5 rounded-xl border border-zinc-100 outline-none text-xs font-medium focus:bg-white focus:border-red-200 transition-all"
          />
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={openNew}
          className="ml-auto flex items-center gap-1.5 px-3.5 py-2.5 bg-red-600 text-white rounded-xl text-[10px] md:text-xs font-black italic hover:bg-red-700 transition-all shadow-lg shadow-red-100"
        >
          <Plus className="w-3.5 h-3.5" /> Nuevo Cliente
        </motion.button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-zinc-300">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 md:py-16 text-center italic font-black uppercase tracking-widest text-zinc-200">
          {search ? `Sin resultados para "${search}"` : "No hay clientes registrados"}
        </div>
      ) : (
        <div className="grid gap-2 md:gap-3">
          {filtered.map(c => (
            <motion.div
              key={c._id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="group flex items-center gap-3 max-[400px]:p-3 p-4 bg-zinc-50 rounded-2xl border border-zinc-100 hover:border-zinc-200 transition-all"
            >
              <div className="w-9 h-9 md:w-10 md:h-10 bg-white rounded-xl flex items-center justify-center text-zinc-400 shadow-sm shrink-0">
                <User className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black italic text-zinc-950 truncate">{c.name}</p>
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 mt-0.5">
                  {c.email && <span className="text-[9px] md:text-[10px] text-zinc-400 font-bold italic flex items-center gap-1"><Mail className="w-2.5 h-2.5" />{c.email}</span>}
                  {c.phone && <span className="text-[9px] md:text-[10px] text-zinc-400 font-bold italic flex items-center gap-1"><Phone className="w-2.5 h-2.5" />{c.phone}</span>}
                </div>
                {c.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {c.tags.map((t, i) => (
                      <span key={i} className="text-[7px] md:text-[8px] font-black italic px-1.5 py-0.5 bg-red-50 text-red-600 rounded-md uppercase tracking-wider">{t}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                <button onClick={() => openEdit(c)} className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setDeleteTarget(c)} className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                  <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="flex items-center justify-between p-4 md:p-6 border-b border-zinc-100">
                <h4 className="text-sm md:text-base font-black italic uppercase tracking-tighter">
                  {editing ? "Editar Cliente" : "Nuevo Cliente"}
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
                <div>
                  <label className="text-[9px] md:text-[10px] font-black italic text-zinc-500 uppercase tracking-wider mb-1.5 block">Nombre *</label>
                  <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full bg-zinc-50 px-4 py-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-red-200 transition-all"
                    placeholder="Nombre del cliente" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] md:text-[10px] font-black italic text-zinc-500 uppercase tracking-wider mb-1.5 block">Email</label>
                    <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      className="w-full bg-zinc-50 px-4 py-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-red-200 transition-all"
                      placeholder="correo@ejemplo.com" />
                  </div>
                  <div>
                    <label className="text-[9px] md:text-[10px] font-black italic text-zinc-500 uppercase tracking-wider mb-1.5 block">Teléfono</label>
                    <input type="text" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      className="w-full bg-zinc-50 px-4 py-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-red-200 transition-all"
                      placeholder="+34 600 000 000" />
                  </div>
                </div>
                <div>
                  <label className="text-[9px] md:text-[10px] font-black italic text-zinc-500 uppercase tracking-wider mb-1.5 block">Etiquetas</label>
                  <input type="text" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                    className="w-full bg-zinc-50 px-4 py-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-red-200 transition-all"
                    placeholder="vip, recurrente, potencial (separadas por coma)" />
                </div>
                <div>
                  <label className="text-[9px] md:text-[10px] font-black italic text-zinc-500 uppercase tracking-wider mb-1.5 block">Notas</label>
                  <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    rows={3}
                    className="w-full bg-zinc-50 px-4 py-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-red-200 transition-all resize-none"
                    placeholder="Información adicional..." />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 p-4 md:p-6 border-t border-zinc-100">
                <button onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 text-xs font-black italic text-zinc-500 hover:text-zinc-700 transition-all">
                  Cancelar
                </button>
                <motion.button whileTap={{ scale: 0.95 }} onClick={handleSave} disabled={saving}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-red-600 text-white rounded-xl text-xs font-black italic hover:bg-red-700 transition-all shadow-lg shadow-red-100 disabled:opacity-50">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {editing ? "Guardar Cambios" : "Crear Cliente"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        open={!!deleteTarget}
        title="Eliminar cliente"
        message={`¿Eliminar a ${deleteTarget?.name || "este cliente"}? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={() => handleDelete(deleteTarget!._id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
