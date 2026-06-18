"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Token de verificación no encontrado");
      return;
    }
    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    }).then(async (res) => {
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus("success");
        setMessage("¡Correo verificado exitosamente!");

        const sessionKey = "jandosession";
        const saved = localStorage.getItem(sessionKey);
        if (saved && data.token) {
          try {
            const session = JSON.parse(saved);
            session.token = data.token;
            localStorage.setItem(sessionKey, JSON.stringify(session));
          } catch {}
        }

        const meRes = await fetch("/api/auth/me", {
          headers: data.token ? { Authorization: `Bearer ${data.token}` } : {},
        });
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.user) {
            const existing = localStorage.getItem(sessionKey);
            if (existing) {
              try {
                const s = JSON.parse(existing);
                s.email = meData.user.email;
                s.organizationId = meData.user.organizationId;
                localStorage.setItem(sessionKey, JSON.stringify(s));
              } catch {}
            }
          }
        }

        setTimeout(() => {
          router.push("/");
        }, 1500);
      } else {
        setStatus("error");
        setMessage(data.error || "Error al verificar correo");
      }
    }).catch(() => {
      setStatus("error");
      setMessage("Error de conexión");
    });
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] border border-zinc-100 p-10 md:p-14 text-center shadow-2xl">
        {status === "loading" && (
          <div className="space-y-6">
            <Loader2 className="w-16 h-16 text-red-600 mx-auto animate-spin" />
            <p className="text-zinc-500 font-bold italic text-sm">Verificando tu correo...</p>
          </div>
        )}
        {status === "success" && (
          <div className="space-y-6">
            <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-black italic text-zinc-950">¡Correo Verificado!</h1>
            <p className="text-sm text-zinc-500 font-medium">{message}</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-8 py-4 bg-red-600 text-white rounded-2xl font-black text-sm italic hover:bg-red-700 transition-all shadow-xl"
            >
              IR A MI PANEL <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
        {status === "error" && (
          <div className="space-y-6">
            <div className="w-20 h-20 bg-red-50 rounded-[2rem] flex items-center justify-center mx-auto">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-2xl font-black italic text-zinc-950">Error de Verificación</h1>
            <p className="text-sm text-zinc-500 font-medium">{message}</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-8 py-4 bg-zinc-950 text-white rounded-2xl font-black text-sm italic hover:bg-zinc-800 transition-all shadow-xl"
            >
              VOLVER AL INICIO
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
        <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
