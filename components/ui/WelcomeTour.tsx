"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Sparkles,
  Store,
  Bot,
  MessageCircle,
  Compass,
  X,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Mail,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

const TOUR_KEY = "jandosoft_welcome_tour_done";

interface StepDef {
  icon: React.ElementType;
  key: string;
  color: string;
  targetSelector?: string;
  titleKey?: string;
  descKey?: string;
}

interface WelcomeTourProps {
  isNewUser: boolean;
  emailVerified: boolean;
  onHighlight?: (step: number | null) => void;
  manualTrigger?: number;
}

const baseSteps: StepDef[] = [
  {
    icon: Sparkles,
    key: "welcome",
    color: "from-red-500 to-orange-400",
  },
  {
    icon: Store,
    key: "create_store",
    color: "from-blue-500 to-cyan-400",
    targetSelector: "[data-tour='create_store']",
  },
  {
    icon: Bot,
    key: "ai_agent",
    color: "from-emerald-500 to-teal-400",
    targetSelector: "[data-tour='ai_agent']",
  },
  {
    icon: MessageCircle,
    key: "chat",
    color: "from-violet-500 to-purple-400",
    targetSelector: "[data-tour='chat']",
  },
  {
    icon: Compass,
    key: "explore",
    color: "from-amber-500 to-yellow-400",
    targetSelector: "[data-tour='explore']",
  },
];

export default function WelcomeTour({ isNewUser, emailVerified, onHighlight, manualTrigger }: WelcomeTourProps) {
  const { t } = useLanguage();
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState<{ id: number; x: number; y: number; color: string; rotation: number; delay: number }[]>([]);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number; arrowDir: "top" | "bottom" } | null>(null);
  const [targetFound, setTargetFound] = useState(true);

  const tooltipRef = useRef<HTMLDivElement>(null);
  const previousStepRef = useRef<number | null>(null);

  const showVerificationStep = !emailVerified;
  const steps: StepDef[] = showVerificationStep
    ? [...baseSteps, { icon: Mail, key: "verify", color: "from-rose-500 to-pink-400" }]
    : baseSteps;

  const current = steps[step];
  const Icon = current.icon;
  const isLast = step === steps.length - 1;
  const isFirst = step === 0;
  const isVerifyStep = current.key === "verify";
  const isWelcomeStep = current.key === "welcome";
  const hasTarget = "targetSelector" in current;

  const measureAndPosition = useCallback(() => {
    if (!visible || isWelcomeStep || isVerifyStep || !current.targetSelector) {
      setTooltipPos(null);
      return;
    }

    const el = document.querySelector(current.targetSelector);
    if (!el) {
      setTargetFound(false);
      setTooltipPos(null);
      return;
    }
    setTargetFound(true);

    const rect = el.getBoundingClientRect();
    const tooltipW = 380;
    const tooltipH = 280;

    let left = rect.left + rect.width / 2 - tooltipW / 2;
    let top = rect.bottom + 14;
    let arrowDir: "top" | "bottom" = "top";

    if (left < 12) left = 12;
    if (left + tooltipW > window.innerWidth - 12) {
      left = window.innerWidth - tooltipW - 12;
    }
    if (top + tooltipH > window.innerHeight - 12) {
      top = rect.top - tooltipH - 14;
      arrowDir = "bottom";
    }
    if (top < 12) {
      top = 12;
    }

    setTooltipPos({ top, left, arrowDir });
  }, [visible, step, current, isWelcomeStep, isVerifyStep]);

  useEffect(() => {
    if (isNewUser && typeof window !== "undefined") {
      const done = localStorage.getItem(TOUR_KEY);
      if (!done) {
        const timer = setTimeout(() => setVisible(true), 600);
        return () => clearTimeout(timer);
      }
    }
  }, [isNewUser]);

  useEffect(() => {
    if (manualTrigger && manualTrigger > 0) {
      localStorage.removeItem(TOUR_KEY);
      setStep(0);
      setVisible(true);
    }
  }, [manualTrigger]);

  useEffect(() => {
    if (onHighlight) onHighlight(visible ? step : null);
  }, [step, visible, onHighlight]);

  useEffect(() => {
    if (!visible || isWelcomeStep || isVerifyStep) {
      setTooltipPos(null);
      return;
    }

    if (!current.targetSelector) return;

    const el = document.querySelector(current.targetSelector);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("tour-target-highlight");
    }

    const measureTimeout = setTimeout(measureAndPosition, 400);

    window.addEventListener("resize", measureAndPosition);
    window.addEventListener("scroll", measureAndPosition, { passive: true });

    return () => {
      if (el) el.classList.remove("tour-target-highlight");
      clearTimeout(measureTimeout);
      window.removeEventListener("resize", measureAndPosition);
      window.removeEventListener("scroll", measureAndPosition);
    };
  }, [step, visible, measureAndPosition, isWelcomeStep, isVerifyStep, current.targetSelector]);

  const triggerConfetti = useCallback(() => {
    setShowConfetti(true);
    const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#a855f7", "#ec4899"];
    const pieces = Array.from({ length: 80 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -10 - Math.random() * 20,
      color: colors[i % colors.length],
      rotation: Math.random() * 720 - 360,
      delay: Math.random() * 0.3,
    }));
    setConfettiPieces(pieces);
    setTimeout(() => setShowConfetti(false), 4000);
  }, []);

  const handleSkip = useCallback(() => {
    localStorage.setItem(TOUR_KEY, "true");
    setVisible(false);
    if (onHighlight) onHighlight(null);
  }, [onHighlight]);

  const handleNext = useCallback(async () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      triggerConfetti();
      await new Promise(r => setTimeout(r, 1500));
      localStorage.setItem(TOUR_KEY, "true");
      setVisible(false);
      if (onHighlight) onHighlight(null);
    }
  }, [step, steps.length, triggerConfetti, onHighlight]);

  const handlePrev = useCallback(() => {
    if (step > 0) setStep(step - 1);
  }, [step]);

  const handleResendVerification = async () => {
    setSendingVerification(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        setVerificationSent(true);
      }
    } catch {}
    setSendingVerification(false);
  };

  const renderStepContent = () => (
    <>
      <div className={`bg-gradient-to-br ${current.color} p-8 md:p-10 text-white relative`}>
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-all"
        >
          <X className="w-4 h-4" />
        </button>
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm"
        >
          <Icon className="w-8 h-8" />
        </motion.div>
        <h3 className="text-xl md:text-2xl font-bold tracking-tight">
          {isVerifyStep
            ? t("tour.verify_title")
            : t(`tour.${current.key === "welcome" ? "welcome_title" : `step_${current.key}`}`)}
        </h3>
        <p className="text-sm text-white/80 mt-2 leading-relaxed">
          {isVerifyStep
            ? t("tour.verify_desc")
            : t(`tour.${current.key === "welcome" ? "welcome_desc" : `step_${current.key}_desc`}`)}
        </p>
      </div>

      <div className="p-6 md:p-8 space-y-6">
        <div className="flex justify-center gap-2">
          {steps.map((s, i) => (
            <div
              key={s.key}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? "w-8 bg-red-500" : "w-2 bg-zinc-200"
              }`}
            />
          ))}
        </div>

        {!targetFound && hasTarget && (
          <p className="text-xs text-amber-600 bg-amber-50 rounded-xl p-3 text-center font-medium">
            {t("tour.target_not_found")}
          </p>
        )}

        {isVerifyStep && (
          <div className="bg-rose-50 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-rose-600 shrink-0" />
              <p className="text-xs font-bold text-rose-700">
                {t("tour.verify_check_inbox")}
              </p>
            </div>
            {verificationSent ? (
              <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" /> {t("tour.verify_resent")}
              </div>
            ) : (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleResendVerification}
                disabled={sendingVerification}
                className="w-full py-3 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {sendingVerification ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>{t("tour.verify_resend_btn")} <Mail className="w-3.5 h-3.5" /></>
                )}
              </motion.button>
            )}
            <p className="text-[9px] text-rose-400 italic text-center">
              {t("tour.verify_spam_hint")}
            </p>
          </div>
        )}

        <div className="flex gap-3">
          {!isFirst ? (
            <button
              onClick={handlePrev}
              className="flex-1 py-3 bg-zinc-50 text-zinc-600 rounded-xl text-xs font-semibold hover:bg-zinc-100 transition-all flex items-center justify-center gap-1.5"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              {t("tour.back")}
            </button>
          ) : (
            <button
              onClick={handleSkip}
              className="flex-1 py-3 bg-zinc-50 text-zinc-500 rounded-xl text-xs font-semibold hover:bg-zinc-100 transition-all"
            >
              {t("tour.skip_btn")}
            </button>
          )}
          <button
            onClick={handleNext}
            className="flex-1 py-3 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700 transition-all shadow-sm flex items-center justify-center gap-1.5"
          >
            {isLast ? (
              <>{t("tour.done_btn")} <ArrowRight className="w-3.5 h-3.5" /></>
            ) : (
              <>{t("tour.next_btn")} <ChevronRight className="w-3.5 h-3.5" /></>
            )}
          </button>
        </div>

        {isLast && (
          <p className="text-center text-[10px] text-zinc-400">
            {t("tour.ready_msg")}
          </p>
        )}
      </div>
    </>
  );

  const renderTooltip = () => {
    if (!tooltipPos) return null;

    return (
      <motion.div
        ref={tooltipRef}
        key={step}
        initial={{ opacity: 0, scale: 0.95, y: tooltipPos.arrowDir === "top" ? 8 : -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 350, damping: 30 }}
        className="fixed z-[250] w-[380px] max-w-[calc(100vw-24px)] bg-white rounded-3xl shadow-2xl overflow-hidden pointer-events-auto"
        style={{ top: tooltipPos.top, left: tooltipPos.left }}
      >
        {/* Arrow */}
        <div
          className={`absolute ${
            tooltipPos.arrowDir === "top" ? "-top-2" : "-bottom-2"
          } left-1/2 -translate-x-1/2 w-4 h-2`}
        >
          <svg
            width="16"
            height="8"
            viewBox="0 0 16 8"
            fill="none"
            className={tooltipPos.arrowDir === "top" ? "" : "rotate-180"}
          >
            <path d="M0 8L8 0L16 8H0Z" fill="white" />
          </svg>
        </div>
        {renderStepContent()}
      </motion.div>
    );
  };

  return (
    <>
      {/* Confetti */}
      <AnimatePresence>
        {showConfetti && (
          <div className="fixed inset-0 z-[300] pointer-events-none overflow-hidden">
            {confettiPieces.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 1, x: `${p.x}vw`, y: `${p.y}vh`, rotate: 0, scale: 0 }}
                animate={{
                  opacity: [1, 1, 0],
                  y: ["-5vh", "105vh"],
                  rotate: p.rotation,
                  scale: [0, 1, 1, 0.5],
                }}
                transition={{ duration: 3 + Math.random() * 2, delay: p.delay, ease: "easeIn" }}
                className="absolute w-2.5 h-2.5 rounded-sm"
                style={{ background: p.color, left: 0, top: 0 }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm"
            style={{ pointerEvents: isWelcomeStep || isVerifyStep ? "auto" : "none" }}
          >
            {isWelcomeStep || isVerifyStep || !current.targetSelector ? (
              /* Centered modal for welcome & verify steps */
              <motion.div
                key={step}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
                className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden pointer-events-auto"
                style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
              >
                {renderStepContent()}
              </motion.div>
            ) : (
              renderTooltip()
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
