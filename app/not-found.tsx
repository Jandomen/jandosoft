"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, ChevronLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full text-center space-y-10">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative inline-block"
        >
          <div className="absolute inset-0 bg-red-600/10 blur-3xl rounded-full" />
          <div className="w-32 h-32 bg-red-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-red-200 relative">
            <AlertTriangle className="w-16 h-16 text-white" />
          </div>
        </motion.div>

        <div className="space-y-4">
          <h1 className="text-8xl font-black text-zinc-900 tracking-tight">404</h1>
          <h2 className="text-2xl font-bold text-red-600">Página no encontrada</h2>
          <p className="text-zinc-500 leading-relaxed">
            Parece que te has perdido en la nube de <span className="font-wallpoet tracking-[0.2em] text-red-600">JANDOSOFT</span>. La página que buscas no existe o ha sido movida.
          </p>
        </div>

        <div className="flex flex-col gap-4">
           <Link 
            href="/"
            className="w-full py-5 bg-red-600 text-white rounded-xl font-semibold text-base flex items-center justify-center gap-3 hover:bg-red-700 transition-all shadow-lg shadow-red-100"
           >
              <Home className="w-5 h-5" /> VOLVER AL INICIO
            </Link>
            <button 
              onClick={() => window.history.back()}
              className="w-full py-5 bg-zinc-50 text-zinc-500 rounded-xl text-xs font-medium flex items-center justify-center gap-2 hover:bg-zinc-100 transition-all"
            >
              <ChevronLeft className="w-4 h-4" /> Ir Atrás
            </button>
        </div>

        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-300"><span className="font-wallpoet">JANDOSOFT</span> Engine v4.0 Error System</p>
      </div>
    </div>
  );
}
