"use client";

import { useState, useEffect } from "react";
import { FileText, Plus, X, Search, Loader2, DollarSign, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";

interface Invoice {
  _id: string;
  invoiceNumber: string;
  userEmail: string;
  userName: string;
  amount: number;
  currency: string;
  items: string[];
  paymentMethod: string;
  status: string;
  createdAt: string;
}

export default function InvoicesPanel({ storeId, userEmail }: { storeId: string | number; userEmail: string }) {
  const { showToast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ userEmail: "", userName: "", amount: "", currency: "USD", paymentMethod: "Transferencia", items: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [creating, setCreating] = useState(false);

  const load = async () => {
    try {
      const res = await fetch(`/api/invoices?email=${encodeURIComponent(userEmail)}`);
      const data = await res.json();
      if (data.invoices) setInvoices(data.invoices);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [userEmail]);

  const create = async () => {
    if (!form.userEmail || !form.amount) return;
    setCreating(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId,
          userEmail: form.userEmail,
          userName: form.userName,
          amount: parseFloat(form.amount),
          currency: form.currency,
          paymentMethod: form.paymentMethod,
          items: form.items.split("\n").filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "Error al crear factura", "error"); return; }
      showToast(`Factura ${data.invoice.invoiceNumber} creada`, "success");
      setShowForm(false);
      setForm({ userEmail: "", userName: "", amount: "", currency: "USD", paymentMethod: "Transferencia", items: "" });
      await load();
    } catch {
      showToast("Error de conexión", "error");
    } finally {
      setCreating(false);
    }
  };

  const filtered = invoices.filter(i =>
    !searchQuery || i.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) || i.userEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalAmount = invoices.reduce((s, i) => s + i.amount, 0);

  if (loading) {
    return (
      <div className="space-y-8">
        <h3 className="text-2xl max-[400px]:text-xl font-black italic text-zinc-950 uppercase tracking-tighter"><FileText className="w-6 h-6 max-[400px]:w-5 max-[400px]:h-5 inline mr-3 text-red-600" />Facturas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-[400px]:gap-4 gap-5">
          {[1, 2, 3].map(i => <div key={i} className="h-28 max-[400px]:h-28 h-32 bg-zinc-50 rounded-[2rem] animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3 max-[400px]:gap-3 gap-4">
        <h3 className="text-2xl max-[400px]:text-xl font-black italic text-zinc-950 uppercase tracking-tighter">
          <FileText className="w-6 h-6 max-[400px]:w-5 max-[400px]:h-5 inline mr-3 text-red-600" />Facturas
          <span className="text-zinc-400 text-base max-[400px]:text-sm ml-3">{invoices.length}</span>
        </h3>
        <div className="flex items-center gap-2 max-[400px]:gap-2 gap-3 w-full max-[400px]:w-full sm:w-auto">
          <div className="relative flex-1 max-[400px]:flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 max-[400px]:w-3.5 max-[400px]:h-3.5 w-4 h-4 text-zinc-300" />
            <input type="text" placeholder="Buscar factura..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full sm:w-40 max-[400px]:w-full bg-zinc-50 pl-9 max-[400px]:pl-9 pl-10 pr-3 max-[400px]:pr-3 pr-4 py-2 max-[400px]:py-2 py-2.5 rounded-xl border border-zinc-100 outline-none text-[11px] max-[400px]:text-[11px] text-xs font-medium focus:bg-white focus:border-red-200 transition-all" />
          </div>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowForm(true)} className="px-5 max-[400px]:px-5 px-6 py-2.5 max-[400px]:py-2.5 py-3 bg-red-600 text-white rounded-2xl font-black text-[10px] max-[400px]:text-[10px] text-xs italic hover:bg-red-700 transition-all shadow-xl flex items-center gap-2 shrink-0">
            <Plus className="w-3.5 h-3.5 max-[400px]:w-3.5 max-[400px]:h-3.5 w-4 h-4" /> NUEVA FACTURA
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-[400px]:gap-4 gap-5">
        <div className="bg-white p-5 max-[400px]:p-5 p-6 rounded-[2rem] border border-zinc-100 shadow-sm space-y-2 max-[400px]:space-y-2 space-y-3">
          <div className="p-2.5 max-[400px]:p-2.5 p-3 bg-red-50 rounded-xl w-fit"><FileText className="w-4 h-4 max-[400px]:w-4 max-[400px]:h-4 w-5 h-5 text-red-600" /></div>
          <p className="text-[8px] max-[400px]:text-[8px] text-[9px] font-black text-zinc-400 uppercase italic">Total facturas</p>
          <p className="text-2xl max-[400px]:text-2xl text-3xl font-black italic text-zinc-950">{invoices.length}</p>
        </div>
        <div className="bg-white p-5 max-[400px]:p-5 p-6 rounded-[2rem] border border-zinc-100 shadow-sm space-y-2 max-[400px]:space-y-2 space-y-3">
          <div className="p-2.5 max-[400px]:p-2.5 p-3 bg-emerald-50 rounded-xl w-fit"><DollarSign className="w-4 h-4 max-[400px]:w-4 max-[400px]:h-4 w-5 h-5 text-emerald-600" /></div>
          <p className="text-[8px] max-[400px]:text-[8px] text-[9px] font-black text-zinc-400 uppercase italic">Facturado</p>
          <p className="text-2xl max-[400px]:text-2xl text-3xl font-black italic text-zinc-950">${totalAmount.toFixed(2)}</p>
        </div>
        <div className="bg-white p-5 max-[400px]:p-5 p-6 rounded-[2rem] border border-zinc-100 shadow-sm space-y-2 max-[400px]:space-y-2 space-y-3">
          <div className="p-2.5 max-[400px]:p-2.5 p-3 bg-blue-50 rounded-xl w-fit"><Calendar className="w-4 h-4 max-[400px]:w-4 max-[400px]:h-4 w-5 h-5 text-blue-600" /></div>
          <p className="text-[8px] max-[400px]:text-[8px] text-[9px] font-black text-zinc-400 uppercase italic">Última factura</p>
          <p className="text-lg max-[400px]:text-lg text-xl font-black italic text-zinc-950">{invoices.length > 0 ? new Date(invoices[0].createdAt).toLocaleDateString("es") : "—"}</p>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-20 text-center italic font-black uppercase tracking-widest text-zinc-200">
          {searchQuery ? `Sin resultados para "${searchQuery}"` : "No hay facturas aún. Crea tu primera factura."}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(inv => (
            <div key={inv._id} className="flex items-center justify-between p-4 max-[400px]:p-4 p-5 bg-white rounded-2xl border border-zinc-100 group hover:border-red-200 transition-all shadow-sm">
              <div className="flex items-center gap-3 max-[400px]:gap-3 gap-4 min-w-0 flex-1">
                <div className="w-10 h-10 max-[400px]:w-10 max-[400px]:h-10 w-12 h-12 bg-gradient-to-br from-red-600 to-red-700 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0">
                  <FileText className="w-5 h-5 max-[400px]:w-5 max-[400px]:h-5 w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <p className="font-black italic text-zinc-950 text-sm truncate">{inv.invoiceNumber}</p>
                  <div className="flex items-center gap-1.5 max-[400px]:gap-1.5 gap-2 mt-0.5 max-[400px]:mt-0.5 mt-1 flex-wrap">
                    <span className="text-[9px] max-[400px]:text-[9px] text-[10px] font-bold text-zinc-400 italic truncate max-w-[120px] max-[400px]:max-w-[120px]">{inv.userName || inv.userEmail}</span>
                    <span className="text-zinc-200 text-[8px]">·</span>
                    <span className="text-[9px] max-[400px]:text-[9px] text-[10px] font-bold text-zinc-400 italic">{new Date(inv.createdAt).toLocaleDateString("es")}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 max-[400px]:gap-3 gap-4 shrink-0">
                <div className="text-right">
                  <p className="font-black italic text-zinc-950 text-sm">{inv.currency === "USD" ? "$" : inv.currency}{inv.amount.toFixed(2)}</p>
                  <span className={cn("px-1.5 max-[400px]:px-1.5 px-2 py-0.5 rounded-full text-[7px] max-[400px]:text-[7px] text-[8px] font-black uppercase italic", inv.status === "Pagado" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600")}>
                    {inv.status}
                  </span>
                </div>
                {inv.items.length > 0 && (
                  <span className="text-[8px] max-[400px]:text-[8px] text-[9px] text-zinc-400 font-bold italic hidden md:block">{inv.items.length} item{inv.items.length > 1 ? "s" : ""}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-6" onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full max-w-lg bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-4xl relative" onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowForm(false)} className="absolute top-4 md:top-6 right-4 md:right-6 p-2 hover:bg-zinc-50 rounded-xl"><X className="w-4 h-4 md:w-5 md:h-5 text-zinc-400" /></button>
              <h3 className="text-xl md:text-2xl font-black italic text-zinc-950 mb-4 md:mb-6 uppercase tracking-tighter">Nueva Factura</h3>
              <div className="space-y-3 md:space-y-5 max-h-[70vh] overflow-y-auto pr-1 md:pr-2">
                <div>
                  <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Cliente Email</label>
                  <input type="email" placeholder="cliente@ejemplo.com" value={form.userEmail} onChange={e => setForm({...form, userEmail: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 text-sm" />
                </div>
                <div>
                  <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Nombre del cliente (opcional)</label>
                  <input type="text" placeholder="Juan Pérez" value={form.userName} onChange={e => setForm({...form, userName: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 text-sm" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Monto</label>
                    <input type="number" step="0.01" placeholder="0.00" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 text-sm" />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Moneda</label>
                    <select value={form.currency} onChange={e => setForm({...form, currency: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 text-sm italic text-sm">
                      <option value="USD">USD $</option>
                      <option value="MXN">MXN</option>
                      <option value="EUR">EUR</option>
                      <option value="COP">COP</option>
                      <option value="ARS">ARS</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Método de pago</label>
                  <select value={form.paymentMethod} onChange={e => setForm({...form, paymentMethod: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 text-sm italic text-sm">
                    <option value="Transferencia">Transferencia</option>
                    <option value="Tarjeta">Tarjeta crédito/débito</option>
                    <option value="Efectivo">Efectivo</option>
                    <option value="Crypto">Crypto</option>
                    <option value="PayPal">PayPal</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Conceptos (uno por línea)</label>
                  <textarea placeholder="Ej. Consultoría desarrollo web&#10;Hosting 12 meses&#10;Soporte técnico" value={form.items} onChange={e => setForm({...form, items: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all resize-none h-24 mt-1 text-sm" />
                </div>
                <button onClick={create} disabled={!form.userEmail || !form.amount || creating} className="w-full py-4 md:py-5 bg-red-600 text-white rounded-2xl font-black italic text-sm md:text-base hover:bg-red-700 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2">
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  CREAR FACTURA
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
