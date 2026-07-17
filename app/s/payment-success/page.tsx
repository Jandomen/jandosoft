"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, ArrowRight, ShoppingBag } from "lucide-react";
import Link from "next/link";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    if (!sessionId) {
      setStatus("success");
      return;
    }
    const timer = setTimeout(() => setStatus("success"), 2000);
    return () => clearTimeout(timer);
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl p-8 md:p-12 max-w-md w-full text-center space-y-6 shadow-2xl"
      >
        {status === "loading" ? (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-zinc-100 rounded-full flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-zinc-300 border-t-red-600 rounded-full animate-spin" />
            </div>
            <p className="text-zinc-500 italic font-bold text-sm">Procesando pago...</p>
          </div>
        ) : (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
            >
              <CheckCircle className="w-20 h-20 text-emerald-500 mx-auto" />
            </motion.div>

            <div className="space-y-2">
              <h1 className="text-2xl md:text-3xl font-black italic text-zinc-950 uppercase tracking-tight">
                Pago Exitoso
              </h1>
              <p className="text-zinc-500 font-bold text-sm">
                Tu pago ha sido procesado correctamente. Recibirás un correo de confirmación.
              </p>
            </div>

            {sessionId && (
              <div className="bg-zinc-50 rounded-2xl p-4">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Referencia</p>
                <p className="text-xs font-mono text-zinc-600 break-all">{sessionId}</p>
              </div>
            )}

            <div className="flex flex-col gap-3 pt-2">
              <Link
                href="/"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all"
              >
                <ShoppingBag className="w-4 h-4" />
                Volver a la tienda
              </Link>
              <button
                onClick={() => window.history.back()}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-zinc-100 text-zinc-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-200 transition-all"
              >
                Seguir comprando
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-zinc-300 border-t-red-600 rounded-full animate-spin" />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
