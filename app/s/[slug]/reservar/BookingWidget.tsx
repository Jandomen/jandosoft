"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import {
  ChevronLeft, ChevronRight, CheckCircle2, Loader2, Clock,
  User, Phone, Mail, FileText, ArrowRight, CalendarDays, Briefcase, AlertCircle,
  CreditCard, Wallet, Bitcoin, Shield
} from "lucide-react";

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DAYS = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];

interface Service {
  id: number;
  name: string;
  desc: string;
  price: number;
  duration?: number;
}

interface AvailableSlot {
  time: string;
  available: boolean;
  conflictWith?: string;
}

interface PaymentIntegration {
  provider: string;
  enabled: boolean;
  credentials?: Record<string, string>;
}

const PAYMENT_METHODS: Record<string, { label: string; icon: any; color: string }> = {
  stripe: { label: "booking.credit_card", icon: CreditCard, color: "text-violet-600 bg-violet-50 border-violet-200" },
  nowpayments: { label: "booking.crypto", icon: Bitcoin, color: "text-blue-600 bg-blue-50 border-blue-200" },
};

export default function BookingWidget({ slug, services, storeId, paymentIntegrations = [], paymentPolicy = "optional" }: { slug: string; services: Service[]; storeId?: string; paymentIntegrations?: PaymentIntegration[]; paymentPolicy?: "always" | "optional" | "none" }) {
  const { t, language } = useLanguage();
  const MONTHS = t("booking.months").split(",");
  const DAYS = t("booking.days").split(",");
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", notes: "" });
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<string>("");
  const [processingPayment, setProcessingPayment] = useState(false);
  const [payLater, setPayLater] = useState(false);

  const activePayments = paymentIntegrations.filter(p => p.enabled);
  const hasPayments = activePayments.length > 0;
  const hasPrice = (selectedService?.price || 0) > 0;
  const requiresPayment = paymentPolicy === "always" && hasPayments && hasPrice;
  const optionalPayment = paymentPolicy === "optional" && hasPayments && hasPrice;
  const showPaymentStep = requiresPayment || optionalPayment;

  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  const monthDays = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  }, [calYear, calMonth]);

  const canSelectDate = (day: number) => {
    const date = new Date(calYear, calMonth, day);
    const minDate = new Date(today);
    minDate.setDate(minDate.getDate() - 1);
    return date > minDate && date <= new Date(today.getFullYear(), today.getMonth() + 3, 0);
  };

  const fetchAvailableSlots = useCallback(async (date: string) => {
    if (!date || !slug) return;
    setLoadingSlots(true);
    try {
      const res = await fetch(`/api/public/book-appointment?slug=${slug}&date=${date}&slotDuration=30`);
      const data = await res.json();
      setAvailableSlots(data.slots || []);
    } catch {
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [slug]);

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots(selectedDate);
    }
  }, [selectedDate, fetchAvailableSlots]);

  const selectService = (s: Service) => {
    setSelectedService(s);
    setStep(2);
  };

  const selectDate = (day: number) => {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDate(dateStr);
    setSelectedTime("");
  };

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(calYear - 1); setCalMonth(11); }
    else setCalMonth(calMonth - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear(calYear + 1); setCalMonth(0); }
    else setCalMonth(calMonth + 1);
  };

  const handleSubmit = async () => {
    if (!selectedService || !selectedDate || !selectedTime || !form.name) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/public/book-appointment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          serviceId: selectedService.id,
          serviceName: selectedService.name,
          servicePrice: selectedService.price,
          serviceDuration: selectedService.duration || 60,
          date: selectedDate,
          time: selectedTime,
          duration: selectedService.duration || 60,
          name: form.name,
          email: form.email,
          phone: form.phone,
          notes: form.notes,
        }),
      });
      if (res.ok) {
        if (hasPayments && hasPrice) {
          setStep(4);
        } else {
          setSuccess(true);
        }
      } else {
        const data = await res.json();
        if (data.error === "conflict") {
          setError(data.message || t("booking.error_conflict"));
          fetchAvailableSlots(selectedDate);
        } else {
          setError(data.error || t("booking.error_create"));
        }
      }
    } catch {
      setError(t("booking.error_connection"));
    } finally {
      setSending(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedPayment || !selectedService || !storeId) return;
    setProcessingPayment(true);
    setError("");
    try {
      const res = await fetch("/api/store-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId,
          amount: selectedService.price,
          currency: "usd",
          description: `${selectedService.name} — ${selectedDate} ${selectedTime}`,
          customerEmail: form.email,
          customerName: form.name,
          paymentMethod: selectedPayment,
          items: [{ name: selectedService.name, price: selectedService.price, quantity: 1 }],
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || t("booking.error_payment"));
        setProcessingPayment(false);
      }
    } catch {
      setError(t("booking.error_connection"));
      setProcessingPayment(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-16 md:py-20 space-y-6">
        <div className="w-20 h-20 bg-emerald-100 rounded-[2rem] flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>
        <h2 className="text-2xl md:text-3xl font-black italic text-zinc-950 uppercase tracking-tighter">{t("booking.appointment_confirmed")}</h2>
        <p className="text-zinc-500 font-bold text-sm max-w-md mx-auto">
          {t("booking.appointment_registered").replace("{service}", selectedService?.name || "").replace("{date}", new Date(selectedDate + "T" + selectedTime).toLocaleDateString(language, { weekday: "long", day: "numeric", month: "long", year: "numeric" })).replace("{time}", selectedTime)}
        </p>
        <p className="text-[10px] text-zinc-400 italic">{t("booking.appointment_reminder")}</p>
        <motion.button whileTap={{ scale: 0.95 }}
          onClick={() => { setStep(1); setSelectedService(null); setSelectedDate(""); setSelectedTime(""); setForm({ name: "", email: "", phone: "", notes: "" }); setSuccess(false); setSelectedPayment(""); setPayLater(false); }}
          className="px-6 py-3 bg-zinc-50 text-zinc-500 rounded-xl font-black italic text-[10px] hover:bg-zinc-100 transition-all">
          {t("booking.book_another")}
        </motion.button>
      </div>
    );
  }

  const stepLabels = showPaymentStep
    ? [t("booking.step_service"), t("booking.step_date"), t("booking.step_data"), t("booking.step_payment")]
    : [t("booking.step_service"), t("booking.step_date"), t("booking.step_data")];

  return (
    <div className="bg-zinc-50 rounded-[2rem] md:rounded-[3rem] border border-zinc-100 p-6 md:p-10 shadow-sm">
      <div className="flex items-center justify-center gap-2 mb-8">
        {(showPaymentStep ? [1, 2, 3, 4] : [1, 2, 3]).map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black italic transition-all",
              step >= s ? "bg-red-600 text-white shadow-md" : "bg-zinc-200 text-zinc-400"
            )}>{s}</div>
            <span className={cn("text-[9px] font-black italic uppercase tracking-wider hidden sm:block",
              step >= s ? "text-zinc-950" : "text-zinc-300"
            )}>
              {stepLabels[s - 1]}
            </span>
            {s < (showPaymentStep ? 4 : 3) && <ChevronRight className="w-3.5 h-3.5 text-zinc-300" />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <h3 className="text-sm md:text-base font-black italic text-zinc-950 uppercase tracking-tighter mb-4">{t("booking.choose_service")}</h3>
          {services.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-zinc-300" />
              </div>
              <p className="text-sm font-black italic text-zinc-300 uppercase">{t("booking.no_services")}</p>
              <p className="text-[10px] text-zinc-400 italic mt-2">{t("booking.no_services_desc")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {services.map(s => (
                <motion.button key={s.id} whileTap={{ scale: 0.97 }}
                  onClick={() => selectService(s)}
                  className={cn("text-left p-5 rounded-2xl border-2 transition-all",
                    selectedService?.id === s.id
                      ? "border-red-600 bg-red-50 shadow-lg"
                      : "border-zinc-100 bg-white hover:border-red-200 hover:shadow-md"
                  )}>
                  <p className="text-sm font-black italic text-zinc-950">{s.name}</p>
                  {s.desc && <p className="text-[10px] text-zinc-500 font-medium mt-1">{s.desc}</p>}
                  <div className="flex items-center gap-3 mt-3">
                    <p className="text-lg font-black italic text-red-600">${s.price.toFixed(2)}</p>
                    {s.duration && (
                      <p className="text-[9px] font-black text-zinc-400 uppercase italic flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {s.duration}min
                      </p>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {step === 2 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm md:text-base font-black italic text-zinc-950 uppercase tracking-tighter">
              {selectedService?.name} — <span className="text-red-600">{t("booking.choose_date")}</span>
            </h3>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setStep(1)}
              className="text-[9px] font-black italic text-zinc-400 hover:text-zinc-600 transition-colors">
              {t("booking.change_service")}
            </motion.button>
          </div>

          <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-zinc-100">
              <motion.button whileTap={{ scale: 0.9 }} onClick={prevMonth}
                className="p-1.5 hover:bg-zinc-50 rounded-lg transition-all">
                <ChevronLeft className="w-4 h-4 text-zinc-500" />
              </motion.button>
              <span className="text-xs font-black italic text-zinc-950 uppercase tracking-tighter">
                {MONTHS[calMonth]} {calYear}
              </span>
              <motion.button whileTap={{ scale: 0.9 }} onClick={nextMonth}
                className="p-1.5 hover:bg-zinc-50 rounded-lg transition-all">
                <ChevronRight className="w-4 h-4 text-zinc-500" />
              </motion.button>
            </div>
            <div className="p-3">
              <div className="grid grid-cols-7 gap-px bg-zinc-100 rounded-xl overflow-hidden">
                {DAYS.map(d => (
                  <div key={d} className="bg-zinc-50 p-1.5 text-center text-[8px] font-black text-zinc-400 uppercase italic">{d}</div>
                ))}
                {monthDays.map((day, i) => {
                  if (day === null) return <div key={`e${i}`} className="bg-white p-1.5" />;
                  const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const isSelectable = canSelectDate(day);
                  const isSelected = selectedDate === dateStr;
                  return (
                    <div key={day}
                      onClick={() => isSelectable && selectDate(day)}
                      className={cn("bg-white p-1.5 text-center transition-all",
                        isSelectable ? "cursor-pointer hover:bg-red-50" : "opacity-30 cursor-not-allowed"
                      )}>
                      <span className={cn("text-[9px] font-black italic inline-flex items-center justify-center w-6 h-6 rounded-full",
                        isSelected && "bg-red-600 text-white"
                      )}>{day}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {selectedDate && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <h4 className="text-[10px] font-black italic text-zinc-500 uppercase tracking-wider">
                {t("booking.available_slots_for")} — {new Date(selectedDate + "T00:00:00").toLocaleDateString(language, { weekday: "long", day: "numeric", month: "long" })}
              </h4>
              {loadingSlots ? (
                <div className="flex items-center justify-center py-8 gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                  <span className="text-[10px] font-black italic text-zinc-400">{t("booking.loading_slots")}</span>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-[10px] font-black italic text-zinc-400">{t("booking.no_slots")}</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                  {availableSlots.map(slot => (
                    <motion.button key={slot.time} whileTap={{ scale: 0.9 }}
                      disabled={!slot.available}
                      onClick={() => slot.available && setSelectedTime(slot.time)}
                      className={cn("py-2 rounded-xl text-[10px] font-black italic border transition-all",
                        !slot.available
                          ? "bg-zinc-100 text-zinc-300 border-zinc-100 cursor-not-allowed line-through"
                          : selectedTime === slot.time
                            ? "bg-red-600 text-white border-red-600 shadow-md"
                            : "bg-white text-zinc-500 border-zinc-100 hover:border-red-200 hover:text-red-600"
                      )}
                      title={slot.conflictWith ? `${t("booking.occupied")}: ${slot.conflictWith}` : ""}>
                      {slot.time}
                    </motion.button>
                  ))}
                </div>
              )}
              {availableSlots.some(s => !s.available) && (
                <p className="text-[9px] text-zinc-400 italic flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {t("booking.slots_occupied_hint")}
                </p>
              )}
            </motion.div>
          )}

          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setStep(3)}
            disabled={!selectedDate || !selectedTime}
            className="w-full py-3 bg-red-600 text-white rounded-xl text-xs font-black italic hover:bg-red-700 transition-all shadow-lg shadow-red-100 disabled:opacity-50 flex items-center justify-center gap-2">
            {t("booking.continue")} <ArrowRight className="w-3.5 h-3.5" />
          </motion.button>
        </motion.div>
      )}

      {step === 3 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm md:text-base font-black italic text-zinc-950 uppercase tracking-tighter">
              {t("booking.your_data")}
            </h3>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setStep(2)}
              className="text-[9px] font-black italic text-zinc-400 hover:text-zinc-600 transition-colors">
              {t("booking.change_date")}
            </motion.button>
          </div>

          <div className="bg-white rounded-2xl border border-zinc-100 p-4 space-y-2">
            <div className="flex items-center gap-2 text-[10px] text-zinc-600 font-medium">
              <Briefcase className="w-3.5 h-3.5 text-red-500" />
              {selectedService?.name}
            </div>
            <div className="flex items-center gap-2 text-[10px] text-zinc-600 font-medium">
              <CalendarDays className="w-3.5 h-3.5 text-red-500" />
              {new Date(selectedDate + "T" + selectedTime).toLocaleDateString(language, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </div>
            <div className="flex items-center gap-2 text-[10px] text-zinc-600 font-medium">
              <Clock className="w-3.5 h-3.5 text-red-500" />
              {selectedTime} ({selectedService?.duration || 60} min)
            </div>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
              <input type="text" placeholder={t("booking.name_placeholder")} value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
                className="w-full bg-white pl-10 pr-4 py-3 rounded-xl border border-zinc-100 outline-none text-xs font-medium focus:border-red-200 transition-all" />
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
              <input type="email" placeholder={t("booking.email_placeholder")} value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
                className="w-full bg-white pl-10 pr-4 py-3 rounded-xl border border-zinc-100 outline-none text-xs font-medium focus:border-red-200 transition-all" />
            </div>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
              <input type="tel" placeholder={t("booking.phone_placeholder")} value={form.phone}
                onChange={e => setForm({...form, phone: e.target.value})}
                className="w-full bg-white pl-10 pr-4 py-3 rounded-xl border border-zinc-100 outline-none text-xs font-medium focus:border-red-200 transition-all" />
            </div>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
              <input type="text" placeholder={t("booking.notes_placeholder")} value={form.notes}
                onChange={e => setForm({...form, notes: e.target.value})}
                className="w-full bg-white pl-10 pr-4 py-3 rounded-xl border border-zinc-100 outline-none text-xs font-medium focus:border-red-200 transition-all" />
            </div>
          </div>

          {error && (
            <p className="text-[10px] font-medium text-red-600 italic bg-red-50 rounded-xl p-3">{error}</p>
          )}

          <motion.button whileTap={{ scale: 0.95 }} onClick={showPaymentStep ? () => setStep(4) : handleSubmit}
            disabled={sending || !form.name}
            className="w-full py-3 bg-red-600 text-white rounded-xl text-xs font-black italic hover:bg-red-700 transition-all shadow-lg shadow-red-100 disabled:opacity-50 flex items-center justify-center gap-2">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : showPaymentStep ? <CreditCard className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            {sending ? t("booking.booking") : showPaymentStep ? t("booking.continue_to_payment") : t("booking.confirm_booking")}
          </motion.button>
        </motion.div>
      )}

      {step === 4 && showPaymentStep && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm md:text-base font-black italic text-zinc-950 uppercase tracking-tighter">
              <span className="text-red-600">{t("booking.payment_title")}</span>
            </h3>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setStep(3)}
              className="text-[9px] font-black italic text-zinc-400 hover:text-zinc-600 transition-colors">
              {t("booking.back")}
            </motion.button>
          </div>

          <div className="bg-white rounded-2xl border border-zinc-100 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-600">{selectedService?.name}</span>
              <span className="text-sm font-black italic text-red-600">${selectedService?.price.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-medium">
              <CalendarDays className="w-3 h-3" />
              {new Date(selectedDate + "T" + selectedTime).toLocaleDateString(language, { weekday: "long", day: "numeric", month: "long" })} — {selectedTime}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-black italic text-zinc-500 uppercase tracking-wider">{t("booking.payment_method")}</p>
            {activePayments.map(p => {
              const method = PAYMENT_METHODS[p.provider] || { label: p.provider, icon: Wallet, color: "text-zinc-600 bg-zinc-50 border-zinc-200" };
              const Icon = method.icon;
              return (
                <motion.button key={p.provider} whileTap={{ scale: 0.97 }}
                  onClick={() => setSelectedPayment(p.provider)}
                  className={cn("w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left",
                    selectedPayment === p.provider
                      ? "border-red-600 bg-red-50 shadow-md"
                      : "border-zinc-100 bg-white hover:border-red-200"
                  )}>
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", method.color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-black italic text-zinc-950">{t(method.label)}</p>
                    <p className="text-[9px] text-zinc-400 font-bold">{t("booking.secure_payment")}</p>
                  </div>
                  <Shield className="w-4 h-4 text-zinc-300 ml-auto" />
                </motion.button>
              );
            })}
          </div>

          {optionalPayment && (
            <motion.button whileTap={{ scale: 0.95 }}
              onClick={() => { setPayLater(true); setSuccess(true); }}
              className="w-full py-3 bg-zinc-100 text-zinc-500 rounded-xl text-[10px] font-black italic hover:bg-zinc-200 transition-all">
              {t("booking.pay_later")}
            </motion.button>
          )}

          {requiresPayment && (
            <p className="text-[9px] text-zinc-400 italic text-center">{t("booking.payment_required")}</p>
          )}

          {error && (
            <p className="text-[10px] font-medium text-red-600 italic bg-red-50 rounded-xl p-3">{error}</p>
          )}

          <motion.button whileTap={{ scale: 0.95 }} onClick={handlePayment}
            disabled={!selectedPayment || processingPayment}
            className="w-full py-3 bg-red-600 text-white rounded-xl text-xs font-black italic hover:bg-red-700 transition-all shadow-lg shadow-red-100 disabled:opacity-50 flex items-center justify-center gap-2">
            {processingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
            {processingPayment ? t("booking.processing") : `${t("booking.pay_now")} $${selectedService?.price.toFixed(2)}`}
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}
