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
          <h1 className="text-8xl font-black italic text-zinc-950 tracking-tighter">404</h1>
          <h2 className="text-2xl font-black italic text-red-600 uppercase">Página no encontrada</h2>
          <p className="text-zinc-500 font-medium leading-relaxed">
            Parece que te has perdido en la nube de <span className="text-zinc-950 font-black">Jandosoft</span>. La página que buscas no existe o ha sido movida.
          </p>
        </div>

        <div className="flex flex-col gap-4">
           <Link 
            href="/"
            className="w-full py-5 bg-red-600 text-white rounded-2xl font-black text-xl flex items-center justify-center gap-3 hover:bg-red-700 transition-all shadow-xl shadow-red-100 italic"
           >
             <Home className="w-6 h-6" /> VOLVER AL INICIO
           </Link>
           <button 
             onClick={() => window.history.back()}
             className="w-full py-5 bg-zinc-50 text-zinc-400 rounded-2xl font-black text-xs flex items-center justify-center gap-2 hover:bg-zinc-100 transition-all uppercase tracking-widest"
           >
             <ChevronLeft className="w-4 h-4" /> Ir Atrás
           </button>
        </div>

        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Jandosoft Engine v4.0 Error System</p>
      </div>
    </div>
  );
}
