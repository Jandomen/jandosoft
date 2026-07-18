"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Star, Check, Zap, ArrowRight, Sparkles, ShieldCheck, Infinity } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useGeoCurrency } from "@/lib/hooks/useGeoCurrency";

const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(" ");

interface PlanCard {
  id: string;
  name: string;
  nameKey?: string;
  price: number;
  desc: string;
  descKey?: string;
  popular: boolean;
  features: string[];
  limits?: { maxStores: number; maxProductsPerStore: number; maxMessages: number; maxAutomations: number };
}

export default function PlansCarousel({ onSelectPlan }: { onSelectPlan?: (planId: string) => void }) {
  const { t } = useLanguage();
  const geo = useGeoCurrency();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [plans, setPlans] = useState<PlanCard[]>([]);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    fetch("/api/plans")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.plans?.length > 0) {
          setPlans(data.plans.filter((p: PlanCard) => p.id !== "free"));
        }
      })
      .catch(() => {});
  }, []);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    if (clientWidth > 0) {
      const idx = Math.round(scrollLeft / (clientWidth * 0.85 + 24));
      setActiveIndex(Math.min(idx, plans.length - 1));
    }
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll);
    return () => el.removeEventListener("scroll", checkScroll);
  }, [plans]);

  useEffect(() => {
    if (plans.length <= 1) return;
    const el = scrollRef.current;
    if (!el) return;
    let paused = false;
    const pause = () => { paused = true; };
    const resume = () => { setTimeout(() => { paused = false; }, 4000); };
    el.addEventListener("mouseenter", pause);
    el.addEventListener("touchstart", pause);
    el.addEventListener("mouseleave", resume);
    el.addEventListener("touchend", resume);
    const interval = setInterval(() => {
      if (paused) return;
      const cardWidth = el.clientWidth * 0.85 + 24;
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (el.scrollLeft >= maxScroll - 10) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: cardWidth, behavior: "smooth" });
      }
    }, 3500);
    return () => {
      clearInterval(interval);
      el.removeEventListener("mouseenter", pause);
      el.removeEventListener("touchstart", pause);
      el.removeEventListener("mouseleave", resume);
      el.removeEventListener("touchend", resume);
    };
  }, [plans.length]);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const cardWidth = el.clientWidth * 0.85 + 24;
    const currentIdx = Math.round(el.scrollLeft / cardWidth);
    const targetIdx = dir === "left" ? currentIdx - 1 : currentIdx + 1;
    el.scrollTo({ left: targetIdx * cardWidth, behavior: "smooth" });
  };

  if (plans.length === 0) return null;

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-8 -mx-6 px-6"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {plans.map((plan, i) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.12, type: "spring", stiffness: 100 }}
            className={cn(
              "snap-start shrink-0 w-[85vw] max-w-[280px] sm:max-w-none sm:w-[320px] lg:w-[380px] rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-8 flex flex-col transition-all duration-300 relative overflow-hidden",
              plan.popular
                ? "bg-white border-2 border-red-500 shadow-xl shadow-red-500/10 scale-[1.02] z-10"
                : "bg-white border border-zinc-200 shadow-md hover:shadow-lg hover:border-zinc-300"
            )}
            onClick={() => onSelectPlan?.(plan.id)}
          >
            {plan.popular && (
              <div className="absolute top-0 right-0">
                <div className="bg-red-600 text-white text-[8px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-2xl flex items-center gap-1 shadow-lg">
                  <Sparkles className="w-3 h-3" /> {t("plans.popular")}
                </div>
              </div>
            )}

            <div className="space-y-7 flex flex-col flex-1">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "p-1.5 rounded-lg",
                    plan.popular ? "bg-red-50 text-red-600" : "bg-zinc-50 text-zinc-400"
                  )}>
                    {plan.popular ? <Zap className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                  </div>
                  <h3 className="text-lg md:text-xl font-black italic text-zinc-950 uppercase tracking-tighter">
                    {t(plan.nameKey || plan.name)}
                  </h3>
                </div>
                <p className="text-xs text-zinc-400 font-medium leading-relaxed ml-9">
                  {t(plan.descKey || plan.desc)}
                </p>
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl md:text-4xl font-black italic text-zinc-950 tracking-tighter">
                  {geo.formatPrice(plan.price)}
                </span>
                <span className="text-zinc-400 font-black text-xs italic uppercase">
                  {t("plans.per_month")}
                </span>
                {geo.currencyCode !== "USD" && (
                  <span className="text-[10px] text-zinc-400 font-medium ml-1">(${plan.price} USD)</span>
                )}
              </div>

              <div className="space-y-3 flex-1">
                {(plan.features || []).slice(0, 8).map((feat: string, fi: number) => (
                  <div key={fi} className="flex items-start gap-3">
                    <div className={cn(
                      "p-0.5 rounded-full mt-0.5",
                      plan.popular ? "bg-red-600" : "bg-emerald-500"
                    )}>
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-sm font-medium text-zinc-700">{feat}</span>
                  </div>
                ))}
                {(plan.features || []).length > 8 && (
                  <p className="text-[10px] font-bold text-zinc-400 italic pl-7">
                    +{(plan.features || []).length - 8} más
                  </p>
                )}
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={(e) => { e.stopPropagation(); onSelectPlan?.(plan.id); }}
                className={cn(
                  "w-full py-2.5 rounded-xl text-xs font-black italic transition-all flex items-center justify-center gap-2 uppercase tracking-wider shadow-md",
                  plan.popular
                    ? "bg-red-600 text-white hover:bg-red-700 shadow-red-200"
                    : "bg-zinc-950 text-white hover:bg-zinc-800"
                )}
              >
                {t("plans.get_plan")} <ArrowRight className="w-3.5 h-3.5" />
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-3 mt-2">
        {plans.length > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-sm border",
                canScrollLeft
                  ? "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300"
                  : "bg-zinc-50 border-zinc-100 text-zinc-300 cursor-not-allowed"
              )}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 px-3">
              {plans.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    if (!scrollRef.current) return;
                    const cardWidth = scrollRef.current.clientWidth * 0.85 + 24;
                    scrollRef.current.scrollTo({ left: i * cardWidth, behavior: "smooth" });
                  }}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all duration-300",
                    i === activeIndex
                      ? "bg-red-600 w-5"
                      : "bg-zinc-300 hover:bg-zinc-400"
                  )}
                />
              ))}
            </div>

            <button
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-sm border",
                canScrollRight
                  ? "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300"
                  : "bg-zinc-50 border-zinc-100 text-zinc-300 cursor-not-allowed"
              )}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <style>{`
        .group\/carousel::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
