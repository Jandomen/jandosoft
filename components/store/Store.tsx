"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  CreditCard,
  Loader2,
  X,
  Star,
  Zap,
  ArrowRight,
  Check,
  Minus,
  Bitcoin,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useGeoCurrency } from "@/lib/hooks/useGeoCurrency";
import { PLANS, FREE_PLAN, buildComparisonFeatures, inheritFeatures } from "@/lib/plans";

interface PlansProps {
  currency: string;
  isPremium: boolean;
  isLogged: boolean;
  userEmail: string;
  onPaymentSuccess: (transaction: any) => void;
  onLoginRequest?: () => void;
}

export default function Plans({ currency, isLogged, userEmail, onPaymentSuccess, onLoginRequest }: PlansProps) {
  const { showToast } = useToast();
  const { t } = useLanguage();
  const geo = useGeoCurrency();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [isBought, setIsBought] = useState(false);

  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);

  const handleCarouselScroll = useCallback(() => {
    if (!carouselRef.current) return;
    const cards = carouselRef.current.querySelectorAll<HTMLElement>(".snap-start");
    const scrollLeft = carouselRef.current.scrollLeft;
    let closestIdx = 0;
    let closestDist = Infinity;
    cards.forEach((card, idx) => {
      const dist = Math.abs(card.offsetLeft - scrollLeft);
      if (dist < closestDist) { closestDist = dist; closestIdx = idx; }
    });
    setActiveCarouselIndex(closestIdx);
  }, []);

  const [plans, setPlans] = useState<any[]>(PLANS);
  const [freePlan] = useState<any>(FREE_PLAN);
  const [comparisonFeatures, setComparisonFeatures] = useState<any[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingPlanId, setPendingPlanId] = useState<string | null>(null);

  const PLAN_PAYMENT_METHODS = [
    { id: "stripe", label: "Tarjeta de crédito/débito", icon: CreditCard, color: "#635BFF" },
    { id: "nowpayments", label: "Criptomonedas (BTC, ETH, USDT...)", icon: Bitcoin, color: "#6C3EC1" },
  ];

  const handlePlanClick = (planId: string) => {
    if (!isLogged) { onLoginRequest?.(); return; }
    if (!userEmail) { showToast(t("plans.not_logged"), "info"); return; }
    setPendingPlanId(planId);
    setShowPaymentModal(true);
  };

  const handlePayWithMethod = async (paymentMethod: string) => {
    if (!pendingPlanId || !userEmail) return;
    setShowPaymentModal(false);
    setSelectedPlan(pendingPlanId);
    setStripeError(null);
    setIsProcessing(true);

    try {
      const res = await fetch("/api/plan-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          name: userEmail?.split("@")[0] || "Customer",
          planId: pendingPlanId,
          paymentMethod,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setStripeError(data.error || "Error al iniciar pago");
        setIsProcessing(false);
      }
    } catch {
      setStripeError("Error de conexión");
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    fetch("/api/plans")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.plans?.length > 0) {
          setPlans(data.plans);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const resolved = plans.map((p) => ({
      ...p,
      resolvedFeatures: inheritFeatures(p, plans),
    }));
    const allFeatures = buildComparisonFeatures(
      resolved,
      { ...freePlan, features: freePlan.features || [] },
      t
    );
    setComparisonFeatures(allFeatures);
  }, [plans, freePlan, t]);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleCarouselScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleCarouselScroll);
  }, [plans.length, handleCarouselScroll]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stripeSuccess = params.get("stripe_success");
    const stripeCancel = params.get("stripe_cancel");
    const paypalSuccess = params.get("paypal_plan_success");
    const mpSuccess = params.get("mercadopago_plan_success");
    const planParam = params.get("plan");

    if (stripeSuccess || paypalSuccess || mpSuccess) {
      if (planParam) setSelectedPlan(planParam);
      setIsBought(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
    if (stripeCancel) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const handleSelectPlan = async (planId: string) => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;

    if (!isLogged) {
      onLoginRequest?.();
      return;
    }

    if (!userEmail) {
      showToast(t("plans.not_logged"), "info");
      return;
    }

    setSelectedPlan(planId);
    setStripeError(null);
    setIsProcessing(true);

    try {
      const body: any = {
        customerEmail: userEmail,
        customerName: userEmail?.split("@")[0] || "Customer",
        description: `Plan ${plan.name} - Jandosoft`,
        planId: plan.id,
      };

      if (plan.stripePriceId) {
        body.priceId = plan.stripePriceId;
      } else {
        body.amount = plan.price;
        body.currency = plan.currency || "usd";
      }

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setStripeError(data.error || t("plans.payment_error"));
        setIsProcessing(false);
      }
    } catch {
      setStripeError(t("plans.connection_error"));
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (isBought && selectedPlan) {
      const plan = plans.find((p) => p.id === selectedPlan);
      if (!plan) return;
      const transaction = {
        id: Math.random().toString(36).slice(2, 10).toUpperCase(),
        date: new Date().toLocaleString(),
        userEmail: userEmail,
        amount: plan.price,
        currency: "USD",
        items: [`Plan ${plan.name}`],
        paymentMethod: "stripe",
      };
      onPaymentSuccess(transaction);
    }
  }, [isBought]);

  if (isBought) {
    return (
      <div className="flex flex-col items-center justify-center max-[400px]:p-6 p-12 md:p-20 bg-white max-[400px]:rounded-[2rem] rounded-[4rem] border border-zinc-100 shadow-3xl text-center max-w-2xl mx-auto italic overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500" />
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-8 shadow-xl shadow-emerald-50"><CheckCircle2 className="w-12 h-12" /></motion.div>
        <h3 className="max-[400px]:text-2xl text-4xl font-black mb-4 text-zinc-950 uppercase tracking-tighter italic">{t("plans.success_title")}</h3>
        <p className="text-zinc-500 mb-10 max-[400px]:text-sm text-lg font-medium leading-relaxed max-w-sm font-black italic">
          {t("plans.success_desc").replace("{plan}", selectedPlan?.toUpperCase() ?? "")}
        </p>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setIsBought(false); setSelectedPlan(null); }} className="max-[400px]:px-8 max-[400px]:py-4 max-[400px]:text-base px-12 py-5 bg-red-600 text-white rounded-2xl font-black text-xl hover:bg-red-700 transition-all shadow-2xl shadow-red-200 uppercase tracking-widest italic">
          {t("plans.continue")}
        </motion.button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-24 pb-20 italic">
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-full text-xs font-black border border-red-100 italic">
          <Zap className="w-3.5 h-3.5" /> {t("plans.badge")}
        </div>
        {(() => {
          const titleParts = t("plans.title").split("{highlight}");
          return (
            <h2 className="max-[400px]:text-3xl text-4xl md:text-6xl font-black italic text-zinc-950 uppercase tracking-tighter">
              {titleParts[0]}<span className="text-red-600">{t("plans.title_highlight")}</span>{titleParts[1]}
            </h2>
          );
        })()}
        <p className="text-zinc-500 text-sm md:text-lg font-medium max-w-xl mx-auto">
          {t("plans.subtitle")}
        </p>

        <div className="flex items-center justify-center gap-2 mt-4">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Moneda:</span>
          <select
            value={geo.currencyCode}
            onChange={(e) => geo.setCurrency(e.target.value)}
            className="text-xs font-bold text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-red-600/10 focus:border-red-300 cursor-pointer"
          >
            {geo.CURRENCY_OPTIONS.map((opt) => (
              <option key={opt.code} value={opt.code}>
                {opt.flag} {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Carousel */}
      <div className="relative max-w-6xl mx-auto px-4 md:px-6 pt-8 pb-4">
        {/* Screen reader hint for scrollable carousel */}
        {plans.length > 2 && (
          <p className="sr-only" role="status" aria-live="polite">
            {t("plans.carousel_hint") ?? "Usa las flechas o desliza para ver más planes."}
          </p>
        )}

        <div
          ref={carouselRef}
          className="flex overflow-x-auto overflow-y-visible snap-x snap-mandatory scroll-smooth pb-4"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            gap: plans.length > 2 ? "2rem" : "2.5rem",
          }}
        >
          {plans.map((plan, i) => {
            const resolvedFeatures = inheritFeatures(plan, plans);
            const popular = plan.popular;
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={cn(
                  "snap-start shrink-0 relative bg-white rounded-[2.5rem] border-2 p-8 md:p-10 flex flex-col transition-all duration-300",
                  plans.length === 1 && "mx-auto",
                  popular
                    ? "border-red-600 shadow-2xl shadow-red-600/10 z-10"
                    : "border-zinc-100 hover:border-zinc-200 shadow-xl"
                )}
                style={{
                  flex: plans.length <= 2 ? `0 0 calc((100% - ${plans.length > 1 ? "2.5rem" : "0px"}) / ${plans.length})` : "0 0 min(80vw, 440px)",
                  maxWidth: plans.length === 1 ? "500px" : plans.length === 2 ? "500px" : "none",
                  transform: popular && plans.length > 2 ? "scale(1.05)" : popular && plans.length <= 2 ? "scale(1.03)" : "none",
                  zIndex: popular ? 10 : undefined,
                }}
              >
                {popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-1.5 z-20">
                    <Star className="w-3 h-3 fill-current" /> {t("plans.popular")}
                  </div>
                )}

                <div className="space-y-8 flex flex-col flex-1">
                  <div className="text-center">
                    <h3 className="text-2xl md:text-3xl font-black italic text-zinc-950 uppercase tracking-tighter">{t(plan.nameKey ?? plan.name)}</h3>
                    <p className="text-xs text-zinc-500 font-medium mt-3 leading-relaxed">{t(plan.descKey ?? "")}</p>
                  </div>

                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl md:text-6xl font-black italic text-zinc-950 tracking-tighter">{geo.formatPrice(plan.price)}</span>
                    <span className="text-zinc-400 font-black text-sm italic uppercase">{t("plans.per_month")}</span>
                    {geo.currencyCode !== "USD" && (
                      <span className="text-[10px] text-zinc-400 font-medium ml-1">(${plan.price} USD)</span>
                    )}
                  </div>

                  <div className="space-y-3 flex-1">
                    {resolvedFeatures.slice(0, 8).map((feat: string) => (
                      <div key={feat} className="flex items-start gap-3">
                        <div className={cn("p-0.5 rounded-full mt-0.5", popular ? "bg-red-600" : "bg-emerald-500")}>
                          <Check className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-sm font-bold text-zinc-700 italic">{t(feat)}</span>
                      </div>
                    ))}
                    {resolvedFeatures.length > 8 && (
                      <p className="text-[10px] font-bold text-zinc-400 italic pl-7">
                        +{resolvedFeatures.length - 8} más
                      </p>
                    )}
                  </div>

                  <div className="pt-4">
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handlePlanClick(plan.id)}
                      disabled={isProcessing && selectedPlan === plan.id}
                      className={cn(
                        "w-full py-4 rounded-2xl font-black text-sm italic transition-all shadow-lg flex items-center justify-center gap-2 uppercase tracking-wider",
                        popular
                          ? "bg-red-600 text-white hover:bg-red-700 shadow-red-200"
                          : "bg-zinc-950 text-white hover:bg-zinc-800"
                      )}
                    >
                      {isProcessing && selectedPlan === plan.id ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> {t("plans.processing")}</>
                      ) : (
                        <>{t("plans.get_plan")} <ArrowRight className="w-4 h-4" /></>
                      )}
                    </motion.button>
                    <p className="text-[9px] text-zinc-400 font-bold text-center mt-3 italic uppercase tracking-widest">
                      {t("plans.recurring_note")}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Carousel controls - only for 2+ plans */}
        {plans.length > 1 && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => {
                if (!carouselRef.current) return;
                const card = carouselRef.current.querySelector<HTMLElement>(".snap-start");
                if (!card) return;
                const step = card.offsetWidth + (plans.length > 2 ? 32 : 40);
                carouselRef.current.scrollBy({ left: -step, behavior: "smooth" });
              }}
              className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300 hover:text-zinc-800 transition-all shadow-md hover:shadow-lg"
              aria-label="Anterior plan"
            >
              <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              {plans.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    if (!carouselRef.current) return;
                    const card = carouselRef.current.querySelector<HTMLElement>(".snap-start");
                    if (!card) return;
                    const step = card.offsetWidth + (plans.length > 2 ? 32 : 40);
                    carouselRef.current.scrollTo({ left: i * step, behavior: "smooth" });
                  }}
                  className={cn(
                    "rounded-full transition-all duration-500",
                    i === activeCarouselIndex
                      ? "bg-red-600 w-8 h-2.5 shadow-md shadow-red-300"
                      : "bg-zinc-300 hover:bg-zinc-400 w-2.5 h-2.5"
                  )}
                  aria-label={`Ir al plan ${i + 1}`}
                />
              ))}
            </div>

            <button
              onClick={() => {
                if (!carouselRef.current) return;
                const card = carouselRef.current.querySelector<HTMLElement>(".snap-start");
                if (!card) return;
                const step = card.offsetWidth + (plans.length > 2 ? 32 : 40);
                carouselRef.current.scrollBy({ left: step, behavior: "smooth" });
              }}
              className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300 hover:text-zinc-800 transition-all shadow-md hover:shadow-lg"
              aria-label="Siguiente plan"
            >
              <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-4 space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-50 text-zinc-600 rounded-full text-xs font-black border border-zinc-200 italic">
            <Zap className="w-3.5 h-3.5" /> {t("plans.comparison_badge")}
          </div>
          {(() => {
            const compParts = t("plans.comparison_title").split("{highlight}");
            return (
              <h3 className="text-3xl md:text-4xl font-black italic text-zinc-950 uppercase tracking-tighter">
                {compParts[0]}<span className="text-red-600">{t("plans.comparison_title_highlight")}</span>{compParts[1]}
              </h3>
            );
          })()}
        </div>

        <div className="overflow-x-auto rounded-[2.5rem] border border-zinc-100 shadow-xl bg-white">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="p-5 md:p-6 text-xs font-black uppercase tracking-widest text-zinc-400 italic">{t("plans.comparison_header")}</th>
                {[t("plans.comparison_free"), ...plans.map((p: any) => t(p.nameKey ?? p.name))].map((name, idx) => (
                  <th key={idx} className={cn("p-5 md:p-6 text-xs font-black uppercase tracking-widest italic text-center", idx === 2 ? "text-red-600" : "text-zinc-400")}>
                    {name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonFeatures.map((feat: any, i: number) => (
                <tr key={feat._key ?? `${i}-${feat.label}`} className={cn("border-b border-zinc-50 transition-colors hover:bg-zinc-50/50", i % 2 === 0 ? "bg-zinc-50/30" : "bg-white")}>
                  <td className="p-5 md:p-6 text-sm font-black italic text-zinc-950">{feat.label}</td>
                  {["free", ...plans.map((p: any) => p.id)].map((planKey) => {
                    const val = feat[planKey];
                    return (
                      <td key={planKey} className="p-5 md:p-6 text-center">
                        {typeof val === "boolean" ? (
                          val ? (
                            <Check className="w-5 h-5 text-emerald-500 mx-auto" />
                          ) : (
                            <Minus className="w-5 h-5 text-zinc-200 mx-auto" />
                          )
                        ) : (
                          <span className="text-sm font-bold italic text-zinc-700">{val}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 text-center space-y-6">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            if (isLogged) {
              const popular = plans.find((p) => p.popular);
              if (popular) handlePlanClick(popular.id);
            } else {
              onLoginRequest?.();
            }
          }}
          className="px-10 py-5 bg-red-600 text-white rounded-2xl font-black text-base italic hover:bg-red-700 transition-all shadow-2xl shadow-red-200 inline-flex items-center gap-3 uppercase tracking-wider"
        >
          {isLogged ? t("plans.cta_business") : t("plans.cta_create_free")} <ChevronRight className="w-5 h-5" />
        </motion.button>
      </div>

      <AnimatePresence>
        {showPaymentModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center max-[400px]:p-3 p-6"
            onClick={() => setShowPaymentModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="w-full max-w-md bg-white max-[400px]:rounded-[2rem] max-[400px]:p-5 rounded-[3rem] p-8 shadow-4xl relative"
              onClick={e => e.stopPropagation()}
            >
              <button onClick={() => setShowPaymentModal(false)} className="absolute top-4 right-4 p-2 hover:bg-zinc-100 rounded-xl transition-colors">
                <X className="w-5 h-5 text-zinc-400" />
              </button>

              <div className="text-center mb-6">
                <h3 className="text-xl font-black italic text-zinc-950 uppercase tracking-tighter">Elige método de pago</h3>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1 italic">
                  Plan {plans.find(p => p.id === pendingPlanId)?.name || ""}
                </p>
              </div>

              <div className="space-y-2">
                {PLAN_PAYMENT_METHODS.map((method) => {
                  const Icon = method.icon;
                  return (
                    <motion.button
                      key={method.id}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handlePayWithMethod(method.id)}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-zinc-100 hover:border-zinc-200 hover:shadow-md transition-all text-left group"
                    >
                      <div className="p-2.5 rounded-xl" style={{ backgroundColor: method.color + "12" }}>
                        <Icon className="w-5 h-5" style={{ color: method.color }} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-black italic text-zinc-950">{method.label}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-500 transition-colors" />
                    </motion.button>
                  );
                })}
              </div>

              <p className="text-[9px] text-zinc-400 font-bold text-center mt-4 italic">
                Suscripción mensual recurrente. Cancela cuando quieras.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isProcessing && !isBought && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center max-[400px]:p-3 p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="w-full max-w-md bg-white max-[400px]:rounded-[2rem] max-[400px]:p-5 rounded-[3rem] p-10 shadow-4xl relative overflow-hidden"
            >
              <button onClick={() => { setIsProcessing(false); setStripeError(null); setSelectedPlan(null); }} className="absolute top-4 right-4 md:top-8 md:right-8 p-2 hover:bg-zinc-100 rounded-xl transition-colors"><X className="w-5 h-5 text-zinc-400" /></button>

              <div className="text-center max-[400px]:mb-6 mb-10">
                <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-8 h-8" />
                </div>
                <h3 className="max-[400px]:text-2xl text-3xl font-black italic text-zinc-950 uppercase tracking-tighter">{t("plans.payment_modal_title")}</h3>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-2 italic">{t("plans.payment_modal_subtitle")}</p>
              </div>

              {stripeError && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
                  <p className="text-xs font-bold text-red-700 italic">{stripeError}</p>
                </div>
              )}

              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
                <p className="text-xs font-black italic text-zinc-400">{t("plans.payment_modal_redirecting")}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
