"use client";

import React, { useState } from "react";
import { Calendar as CalendarIcon, Clock, ChevronRight, CheckCircle2, User, Mail, MessageSquare } from "lucide-react";
import { format, addDays, startOfDay, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const TIME_SLOTS = [
  "09:00", "10:00", "11:00", "12:00", "13:00", "15:00", "16:00", "17:00", "18:00"
];

export default function Booking() {
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const days = Array.from({ length: 14 }).map((_, i) => addDays(startOfDay(new Date()), i));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1500);
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center max-[400px]:p-5 p-12 bg-white rounded-3xl border border-zinc-200 shadow-xl text-center max-w-lg mx-auto overflow-hidden relative">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-6"
        >
          <CheckCircle2 className="w-10 h-10" />
        </motion.div>
        <h3 className="text-2xl font-bold mb-2 italic">¡Cita Agendada!</h3>

        <p className="text-zinc-500 mb-8 max-w-xs">
          Hemos recibido tu solicitud para el <strong>{format(selectedDate, "d 'de' MMMM", { locale: es })}</strong> a las <strong>{selectedTime}</strong>.
        </p>
        <button 
          onClick={() => { setIsSuccess(false); setStep(1); setSelectedTime(null); }}
          className="px-6 py-2.5 bg-brand text-white rounded-xl font-medium hover:bg-brand/90 transition-all shadow-lg shadow-brand/20"
        >
          Agendar otra
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-zinc-200 shadow-2xl overflow-hidden flex flex-col md:flex-row h-full min-h-[600px]">
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-500",
        step === 2 ? "md:w-1/3 opacity-80" : "w-full"
      )}>
        <div className="p-8 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-brand" /> {step === 1 ? "Agendar Cita" : "Confirmar"}
            </h3>
            <p className="text-xs text-zinc-500 mt-1">Selecciona el mejor horario para hablar de tu proyecto.</p>
          </div>
          <div className="text-xs font-bold text-brand bg-brand/10 px-3 py-1 rounded-full uppercase tracking-widest">Paso {step}/2</div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8">
          {step === 1 && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div>
                <h4 className="text-sm font-semibold mb-4 text-zinc-400">FECHA DISPONIBLE</h4>
                <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar -mx-2 px-2">
                  {days.map((day) => (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className={cn(
                        "flex flex-col items-center justify-center min-w-[70px] h-20 rounded-2xl border transition-all",
                        isSameDay(selectedDate, day)
                          ? "bg-brand text-white border-brand shadow-lg shadow-brand/20 scale-105"
                          : "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-brand/40"
                      )}
                    >
                      <span className="text-[10px] opacity-60 uppercase font-bold">{format(day, "eee", { locale: es })}</span>
                      <span className="text-xl font-black">{format(day, "d")}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-4 text-zinc-400">HORA PREFERIDA</h4>
                <div className="grid grid-cols-3 gap-3">
                  {TIME_SLOTS.map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={cn(
                        "flex items-center justify-center py-3 rounded-xl border text-sm font-medium transition-all gap-2",
                        selectedTime === time
                          ? "bg-brand/10 text-brand border-brand ring-1 ring-brand"
                          : "hover:bg-zinc-100 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-800"
                      )}
                    >
                      <Clock className={cn("w-3.5 h-3.5", selectedTime === time ? "text-brand" : "text-zinc-400")} />
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              {selectedTime && (
                <motion.button 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setStep(2)}
                  className="w-full py-4 bg-brand text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-brand/90 transition-all shadow-xl shadow-brand/20 active:scale-95"
                >
                  Continuar <ChevronRight className="w-5 h-5" />
                </motion.button>
              )}
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200 flex items-center justify-between">
                <div className="flex gap-4 items-center">
                  <div className="p-3 bg-brand/10 rounded-xl text-brand font-black text-xs uppercase tracking-tighter w-12 text-center">
                    {format(selectedDate, "MMM", { locale: es })}<br/>{format(selectedDate, "d")}
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Hora Seleccionada</p>
                    <p className="text-lg font-black text-zinc-800 dark:text-zinc-200">{selectedTime} hrs</p>
                  </div>
                </div>
                <button onClick={() => setStep(1)} className="text-xs font-bold text-zinc-400 hover:text-brand transition-colors">CAMBIAR</button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 flex items-center gap-2"><User className="w-3 h-3" /> NOMBRE COMPLETO</label>
                  <input 
                    required
                    type="text" 
                    placeholder="Ej. Juan Pérez"
                    className="w-full h-12 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 text-sm focus:ring-2 focus:ring-brand outline-none transition-all"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 flex items-center gap-2"><Mail className="w-3 h-3" /> EMAIL DE CONTACTO</label>
                  <input 
                    required
                    type="email" 
                    placeholder="juan@ejemplo.com"
                    className="w-full h-12 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 text-sm focus:ring-2 focus:ring-brand outline-none transition-all"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 flex items-center gap-2"><MessageSquare className="w-3 h-3" /> CUÉNTANOS TU IDEA</label>
                  <textarea 
                    placeholder="Necesito una web para mi negocio de..."
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-sm focus:ring-2 focus:ring-brand outline-none transition-all min-h-[100px]"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  ></textarea>
                </div>

                <button 
                  disabled={isSubmitting}
                  type="submit"
                  className={cn(
                    "w-full py-4 bg-zinc-950 dark:bg-white text-white dark:text-black rounded-2xl font-black flex items-center justify-center gap-2 transition-all shadow-xl shadow-black/10 active:scale-95",
                    isSubmitting && "opacity-70 pointer-events-none"
                  )}
                >
                  {isSubmitting ? "PROCESANDO..." : "AGENDAR AHORA"}
                </button>
              </form>
            </motion.div>
          )}
        </div>
      </div>
      
      <div className="hidden md:flex w-72 bg-brand p-8 text-white flex-col justify-end relative overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
         <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full -ml-16 -mb-16 blur-2xl" />
         
         <div className="relative z-10 space-y-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <h4 className="text-2xl font-black leading-none">A un paso de empezar.</h4>
            <p className="text-sm text-white/80 leading-relaxed font-medium">
              Al agendar esta cita, un experto de Jandosoft se preparará para analizar los requerimientos de tu proyecto.

            </p>
         </div>
      </div>
    </div>
  );
}
