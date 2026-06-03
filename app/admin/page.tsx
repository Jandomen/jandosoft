"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Lock, ArrowRight, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

const ADMIN_SESSION_KEY = "jandosession-admin";
const SESS_DURATION = 7 * 24 * 60 * 60 * 1000;

export default function AdminLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({
          isAdmin: true,
          loggedAt: Date.now(),
        }));
        router.push("/admin/dashboard");
      } else {
        setError(data.error || "Credenciales incorrectas");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-red-600 flex items-center justify-center p-4 md:p-8 relative">
      <Link
        href="/"
        className="absolute top-4 md:top-8 left-4 md:left-8 flex items-center gap-2 text-white/70 hover:text-white transition-colors text-[10px] md:text-xs font-black italic uppercase tracking-widest"
      >
        <ArrowLeft className="w-3 h-3 md:w-4 md:h-4" /> Volver
      </Link>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-[2rem] md:rounded-[3.5rem] p-6 md:p-12 shadow-4xl relative overflow-hidden border border-zinc-100"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-red-600" />

        <div className="text-center mb-6 md:mb-10">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-red-600 rounded-2xl md:rounded-3xl mx-auto flex items-center justify-center text-white shadow-xl shadow-red-100 mb-4 md:mb-6">
            <ShieldCheck className="w-8 h-8 md:w-10 md:h-10" />
          </div>
          <h1 className="text-2xl md:text-4xl font-black italic text-zinc-950 uppercase tracking-tighter">
            Admin <span className="text-red-600">Jandosoft</span>
          </h1>
          <p className="text-[9px] md:text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1 md:mt-2 italic">
            Panel de Control Corporativo
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 md:space-y-5">
          <div className="relative group">
            <ArrowRight className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-zinc-300 group-focus-within:text-red-500 transition-colors" />
            <input
              type="email"
              placeholder="admin@jandosoft.com"
              value={form.email}
              onChange={e => setForm(f => ({...f, email: e.target.value}))}
              className="w-full bg-zinc-50 p-3 md:p-5 pl-11 md:pl-14 rounded-xl md:rounded-2xl border border-zinc-100 outline-none font-medium text-sm focus:bg-white focus:border-red-200 focus:ring-2 focus:ring-red-600/10 transition-all"
              required
            />
          </div>
          <div className="relative group">
            <Lock className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-zinc-300 group-focus-within:text-red-500 transition-colors" />
            <input
              type="password"
              placeholder="Contraseña"
              value={form.password}
              onChange={e => setForm(f => ({...f, password: e.target.value}))}
              className="w-full bg-zinc-50 p-3 md:p-5 pl-11 md:pl-14 rounded-xl md:rounded-2xl border border-zinc-100 outline-none font-medium text-sm focus:bg-white focus:border-red-200 focus:ring-2 focus:ring-red-600/10 transition-all"
              required
            />
          </div>
          {error && (
            <p className="text-red-600 text-[10px] md:text-xs font-bold italic text-center">{error}</p>
          )}
          <motion.button
            type="submit"
            whileTap={{ scale: 0.97 }}
            disabled={loading}
            className="w-full py-4 md:py-5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-2xl font-black text-sm md:text-lg flex items-center justify-center gap-2 md:gap-3 hover:scale-[1.02] transition-all shadow-2xl shadow-red-200 italic tracking-wider disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4 md:w-5 md:h-5" />
            {loading ? "VERIFICANDO..." : "INGRESAR"}
          </motion.button>
        </form>
        <p className="text-center text-[8px] md:text-[9px] text-zinc-400 font-bold italic mt-4 md:mt-6">
          Solo personal autorizado · Jandosoft Enterprise
        </p>
      </motion.div>
    </div>
  );
}
