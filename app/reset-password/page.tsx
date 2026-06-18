"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowRight, Lock, CheckCircle2, XCircle, Loader2, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

function ResetContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      setMessage("La contraseña debe tener al menos 6 caracteres");
      setStatus("error");
      return;
    }
    if (!token) {
      setMessage("Token de restablecimiento no encontrado");
      setStatus("error");
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus("success");
        setMessage("Contraseña actualizada exitosamente");
      } else {
        setStatus("error");
        setMessage(data.error || "Error al restablecer contraseña");
      }
    } catch {
      setStatus("error");
      setMessage("Error de conexión");
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
        <div className="w-full max-w-md bg-white rounded-[2.5rem] border border-zinc-100 p-10 md:p-14 text-center shadow-2xl">
          <div className="w-20 h-20 bg-red-50 rounded-[2rem] flex items-center justify-center mx-auto">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-black italic text-zinc-950 mt-6">Enlace Inválido</h1>
          <p className="text-sm text-zinc-500 font-medium mt-2">Este enlace de restablecimiento no es válido o ha expirado.</p>
          <Link href="/" className="inline-flex items-center gap-2 px-8 py-4 bg-zinc-950 text-white rounded-2xl font-black text-sm italic hover:bg-zinc-800 transition-all shadow-xl mt-6">
            SOLICITAR NUEVO ENLACE
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] border border-zinc-100 p-10 md:p-14 shadow-2xl">
        {status === "success" ? (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-black italic text-zinc-950">¡Contraseña Actualizada!</h1>
            <p className="text-sm text-zinc-500 font-medium">{message}</p>
            <Link href="/" className="inline-flex items-center gap-2 px-8 py-4 bg-red-600 text-white rounded-2xl font-black text-sm italic hover:bg-red-700 transition-all shadow-xl">
              INICIAR SESIÓN <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-red-600 to-red-700 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-2xl shadow-red-200">
                <Lock className="w-7 h-7 md:w-9 md:h-9 text-white" />
              </div>
              <h1 className="text-2xl md:text-3xl font-black italic text-zinc-950 uppercase tracking-tighter">Nueva Contraseña</h1>
              <p className="text-[9px] md:text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1 md:mt-2 italic">Elige una contraseña segura</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative group">
                <Lock className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-zinc-300 group-focus-within:text-red-500 transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Nueva contraseña (mín. 6 caracteres)"
                  className="w-full bg-zinc-50 p-3 md:p-5 pl-11 md:pl-14 pr-12 rounded-xl md:rounded-2xl border border-zinc-100 outline-none font-medium text-sm focus:bg-white focus:border-red-200 focus:ring-2 focus:ring-red-600/10 transition-all"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-zinc-500 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {message && (
                <p className={`text-xs font-bold italic text-center ${status === "error" ? "text-red-600" : "text-zinc-500"}`}>
                  {message}
                </p>
              )}

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full py-4 md:py-5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-2xl font-black text-base md:text-xl flex items-center justify-center gap-2 md:gap-3 hover:scale-[1.02] transition-all shadow-2xl shadow-red-200 italic tracking-wider uppercase disabled:opacity-50"
              >
                {status === "loading" ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>ACTUALIZAR <ArrowRight className="w-4 h-4 md:w-5 md:h-5" /></>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
        <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
      </div>
    }>
      <ResetContent />
    </Suspense>
  );
}
