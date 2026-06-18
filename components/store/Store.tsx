"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Loader2,
  X,
  Star,
  Zap,
  ArrowRight,
  Check,
  Minus,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";

const HARDCODED_PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: 29,
    desc: "Perfecto para emprender tu negocio digital",
    popular: false,
    features: ["Productos", "Clientes", "Pedidos", "Facturación", "IA básica", "Correos automáticos"],
    limits: { maxStores: 3, maxProductsPerStore: 50, maxMessages: 50, maxAutomations: 10 },
  },
  {
    id: "business",
    name: "Business",
    price: 79,
    desc: "La opción más completa para hacer crecer tu negocio",
    popular: true,
    features: ["Todo Starter", "CRM avanzado", "WhatsApp Business", "Campañas", "Automatizaciones", "Analytics", "Clientes ilimitados"],
    limits: { maxStores: 20, maxProductsPerStore: 500, maxMessages: 200, maxAutomations: 50 },
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 199,
    desc: "Para empresas que necesitan potencia y control total",
    popular: false,
    features: ["Todo Business", "Multiusuario", "Roles y permisos", "API", "Integraciones avanzadas", "IA avanzada", "Soporte prioritario"],
    limits: { maxStores: 999, maxProductsPerStore: 9999, maxMessages: 999, maxAutomations: 999 },
  },
];

const HARDCODED_FREE = {
  id: "free",
  name: "Gratis",
  features: ["Productos", "Clientes", "Pedidos", "Facturación"],
  limits: { maxStores: 1, maxProductsPerStore: 10, maxMessages: 10, maxAutomations: 2 },
};

const COMPARISON_PLANS = ["free", "starter", "business", "enterprise"];

function buildComparisonFeatures(plans: any[], freePlan: any) {
  const allFeatures = new Set<string>();
  freePlan.features?.forEach((f: string) => allFeatures.add(f));
  plans.forEach((p: any) => p.features?.forEach((f: string) => allFeatures.add(f)));

  const limitsList: { label: string; key: string }[] = [
    { label: "Tiendas", key: "maxStores" },
    { label: "Productos por tienda", key: "maxProductsPerStore" },
    { label: "Mensajes IA", key: "maxMessages" },
    { label: "Automatizaciones", key: "maxAutomations" },
  ];

  const formatLimit = (value: number) => value >= 999 ? "Ilimitado" : value?.toString() || "0";

  const result: any[] = [];

  limitsList.forEach((meta) => {
    const row: any = { label: meta.label };
    row.free = formatLimit(freePlan.limits?.[meta.key as keyof typeof freePlan.limits] ?? 0);
    plans.forEach((p: any) => { row[p.id] = formatLimit(p.limits?.[meta.key as keyof typeof p.limits] ?? 0); });
    result.push(row);
  });

  allFeatures.forEach((feat) => {
    const row: any = { label: feat };
    row.free = !!freePlan.features?.includes(feat);
    plans.forEach((p: any) => {
      const resolved = inheritFeatures(p, plans);
      row[p.id] = resolved.includes(feat);
    });
    result.push(row);
  });

  return result;
}

function inheritFeatures(plan: any, allPlans: any[]): string[] {
  const todoFeature = (plan.features || []).find((f: string) => f.startsWith("Todo"));
  if (!todoFeature) return plan.features || [];
  const inheritFromId = todoFeature.replace("Todo ", "").toLowerCase();
  const source = allPlans.find((p: any) => p.id === inheritFromId);
  const sourceFeatures = source ? inheritFeatures(source, allPlans) : [];
  const ownFeatures = (plan.features || []).filter((f: string) => !f.startsWith("Todo"));
  return [...new Set([...sourceFeatures, ...ownFeatures])];
}

interface PlansProps {
  currency: string;
  isPremium: boolean;
  isLogged: boolean;
  userEmail: string;
  onPaymentSuccess: (transaction: any) => void;
}

export default function Plans({ currency, isLogged, userEmail, onPaymentSuccess }: PlansProps) {
  const { showToast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [isBought, setIsBought] = useState(false);

  const [plans, setPlans] = useState<any[]>(HARDCODED_PLANS);
  const [freePlan] = useState<any>(HARDCODED_FREE);
  const [comparisonFeatures, setComparisonFeatures] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/admin/plans")
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
      resolved.map((p) => ({ ...p, features: p.resolvedFeatures })),
      { ...freePlan, features: freePlan.features || [] }
    );
    setComparisonFeatures(allFeatures);
  }, [plans, freePlan]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stripeSuccess = params.get("stripe_success");
    const stripeCancel = params.get("stripe_cancel");
    if (stripeSuccess) {
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
      showToast("Inicia sesión o regístrate para contratar un plan", "info");
      return;
    }

    setSelectedPlan(planId);
    setStripeError(null);
    setIsProcessing(true);

    try {
      const body: any = {
        customerEmail: userEmail,
        customerName: userEmail?.split("@")[0] || "Cliente",
        description: `Plan ${plan.name} - Jandosoft`,
        planId: plan.id,
      };

      if (plan.stripePriceId) {
        body.priceId = plan.stripePriceId;
      } else {
        body.amount = plan.price;
        body.currency = "usd";
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
        setStripeError(data.error || "Error al iniciar el pago");
        setIsProcessing(false);
      }
    } catch {
      setStripeError("Error de conexión al procesar el pago");
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
        <h3 className="max-[400px]:text-2xl text-4xl font-black mb-4 text-zinc-950 uppercase tracking-tighter italic">¡Suscripción Activada!</h3>
        <p className="text-zinc-500 mb-10 max-[400px]:text-sm text-lg font-medium leading-relaxed max-w-sm font-black italic">
          Tu plan <span className="text-red-600 uppercase font-black">{selectedPlan?.toUpperCase()}</span> ha sido activado. Ya puedes disfrutar de todos los beneficios.
        </p>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setIsBought(false); setSelectedPlan(null); }} className="max-[400px]:px-8 max-[400px]:py-4 max-[400px]:text-base px-12 py-5 bg-red-600 text-white rounded-2xl font-black text-xl hover:bg-red-700 transition-all shadow-2xl shadow-red-200 uppercase tracking-widest italic">
          CONTINUAR
        </motion.button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-20 pb-20 italic">
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-full text-xs font-black border border-red-100 italic">
          <Zap className="w-3.5 h-3.5" /> PLANES DE SUSCRIPCIÓN
        </div>
        <h2 className="max-[400px]:text-3xl text-4xl md:text-6xl font-black italic text-zinc-950 uppercase tracking-tighter">
          Elige el plan <span className="text-red-600">ideal</span> para ti
        </h2>
        <p className="text-zinc-500 text-sm md:text-lg font-medium max-w-xl mx-auto">
          Suscripción mensual · Cancela cuando quieras · Todos los planes incluyen actualizaciones
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto px-4">
        {plans.map((plan, i) => {
          const resolvedFeatures = inheritFeatures(plan, plans);
          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                "relative bg-white rounded-[2.5rem] border-2 p-8 flex flex-col transition-all duration-300",
                plan.popular
                  ? "border-red-600 shadow-2xl shadow-red-600/10 scale-[1.02] md:scale-[1.05] z-10"
                  : "border-zinc-100 hover:border-zinc-200 shadow-xl"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-1.5">
                  <Star className="w-3 h-3 fill-current" /> Más Popular
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-black italic text-zinc-950 uppercase tracking-tighter">{plan.name}</h3>
                  <p className="text-xs text-zinc-500 font-medium mt-2 leading-relaxed">{plan.desc}</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black italic text-zinc-950 tracking-tighter">${plan.price}</span>
                  <span className="text-zinc-400 font-black text-sm italic uppercase">/mes</span>
                </div>

                <div className="space-y-3 pt-2">
                  {resolvedFeatures.map((feat: string) => (
                    <div key={feat} className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="text-xs font-bold text-zinc-700 italic">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-zinc-100">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={isProcessing && selectedPlan === plan.id}
                  className={cn(
                    "w-full py-4 rounded-2xl font-black text-sm italic transition-all shadow-xl flex items-center justify-center gap-2 uppercase tracking-wider",
                    plan.popular
                      ? "bg-red-600 text-white hover:bg-red-700 shadow-red-200"
                      : "bg-zinc-950 text-white hover:bg-zinc-800"
                  )}
                >
                  {isProcessing && selectedPlan === plan.id ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> PROCESANDO</>
                  ) : (
                    <>{isLogged ? "COMENZAR AHORA" : "CREAR CUENTA"} <ArrowRight className="w-4 h-4" /></>
                  )}
                </motion.button>
                <p className="text-[9px] text-zinc-400 font-bold text-center mt-3 italic uppercase tracking-widest">
                  Cobro mensual recurrente · Cancela cuando quieras
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="max-w-6xl mx-auto px-4 space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-50 text-zinc-600 rounded-full text-xs font-black border border-zinc-200 italic">
            <Zap className="w-3.5 h-3.5" /> COMPARACIÓN COMPLETA
          </div>
          <h3 className="text-3xl md:text-4xl font-black italic text-zinc-950 uppercase tracking-tighter">
            Todos los <span className="text-red-600">detalles</span>
          </h3>
        </div>

        <div className="overflow-x-auto rounded-[2.5rem] border border-zinc-100 shadow-xl bg-white">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="p-5 md:p-6 text-xs font-black uppercase tracking-widest text-zinc-400 italic">Funcionalidad</th>
                {["Gratis", ...plans.map((p: any) => p.name)].map((name) => (
                  <th key={name} className={cn("p-5 md:p-6 text-xs font-black uppercase tracking-widest italic text-center", name === "Business" ? "text-red-600" : "text-zinc-400")}>
                    {name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonFeatures.map((feat: any, i: number) => (
                <tr key={feat.label} className={cn("border-b border-zinc-50 transition-colors hover:bg-zinc-50/50", i % 2 === 0 ? "bg-zinc-50/30" : "bg-white")}>
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
        <p className="text-zinc-400 text-sm font-medium italic">
          ¿Necesitas una solución personalizada? Contáctanos para un plan a medida.
        </p>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            if (isLogged) {
              const popular = plans.find((p) => p.popular);
              if (popular) handleSelectPlan(popular.id);
            } else {
              window.location.href = "/";
            }
          }}
          className="px-10 py-5 bg-red-600 text-white rounded-2xl font-black text-base italic hover:bg-red-700 transition-all shadow-2xl shadow-red-200 inline-flex items-center gap-3 uppercase tracking-wider"
        >
          {isLogged ? "COMENZAR CON BUSINESS" : "CREAR CUENTA GRATIS"} <ChevronRight className="w-5 h-5" />
        </motion.button>
      </div>

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
                <h3 className="max-[400px]:text-2xl text-3xl font-black italic text-zinc-950 uppercase tracking-tighter">Pasarela de Pago</h3>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-2 italic">Procesando pago seguro...</p>
              </div>

              {stripeError && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
                  <p className="text-xs font-bold text-red-700 italic">{stripeError}</p>
                </div>
              )}

              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
                <p className="text-xs font-black italic text-zinc-400">Redirigiendo a pago seguro...</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
