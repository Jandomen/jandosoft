"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  X, ChevronRight, ChevronLeft, CheckCircle2, Loader2, Mail,
  Play, Pause, Bot, ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getTourConfig, type TourStep, type TourConfig } from "./tourSteps";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

interface PersistedState {
  currentStep: number;
  completed: boolean;
  paused: boolean;
}

interface ProductTourProps {
  isNewUser: boolean;
  emailVerified: boolean;
  manualTrigger?: number;
}

function loadState(config: TourConfig): PersistedState | null {
  try {
    const raw = localStorage.getItem(config.storageKey);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveState(config: TourConfig, state: PersistedState) {
  localStorage.setItem(config.storageKey, JSON.stringify(state));
}

function clearState(config: TourConfig) {
  localStorage.removeItem(config.storageKey);
}

export default function ProductTour({ isNewUser, emailVerified, manualTrigger }: ProductTourProps) {
  const { t } = useLanguage();
  const config = useMemo(() => getTourConfig(emailVerified, t), [emailVerified, t]);
  const { steps } = config;

  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState<
    { id: number; x: number; y: number; color: string; rotation: number; delay: number }[]
  >([]);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [conditionMet, setConditionMet] = useState(false);
  const [autoCompleting, setAutoCompleting] = useState(false);

  // Track completed actions per step (ref = reads, no re-render on write)
  const completedRef = useRef(new Set<string>());
  const markCompleted = useCallback((key: string) => {
    completedRef.current.add(key);
    setConditionMet(true);
  }, []);

  const tooltipRef = useRef<HTMLDivElement>(null);
  const stepRef = useRef(step);
  stepRef.current = step;

  const current: TourStep = steps[step] ?? steps[0];
  const Icon = current.icon;
  const isLast = step === steps.length - 1;
  const isFirst = step === 0;
  const hasTarget = !!current.targetSelector;
  const isVerifyStep = current.id === "verify_email";
  const isWelcomeStep = current.id === "welcome";

  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [targetFound, setTargetFound] = useState(true);
  const [tooltipPos, setTooltipPos] = useState<{
    top: number;
    left: number;
    arrowDir: "top" | "bottom" | "left" | "right";
  } | null>(null);

  // Step type classification (stable)
  const clickStepIds = useMemo(() => new Set(["create_store", "create_btn", "ai_agent", "chat", "explore"]), []);
  const formStepIds = useMemo(() => new Set(["form_name", "form_desc", "form_industry", "form_type"]), []);
  const eventStepIds = useMemo(() => new Set(["form_submit"]), []);

  // ── Check form field condition (reads from ref, stable reference) ──
  const checkFormCondition = useCallback(() => {
    const id = steps[stepRef.current]?.id ?? "welcome";
    if (id === "form_name") {
      const el = document.querySelector<HTMLInputElement>("[data-tour='form_name']");
      return el ? el.value.trim().length > 0 : false;
    }
    if (id === "form_desc") {
      const el = document.querySelector<HTMLTextAreaElement>("[data-tour='form_desc']");
      return el ? el.value.trim().length > 0 : false;
    }
    if (id === "form_industry") {
      const el = document.querySelector<HTMLSelectElement>("[data-tour='form_industry']");
      return el ? el.value !== "" && el.value !== "tecnologia" : false;
    }
    if (id === "form_type") {
      const el = document.querySelector<HTMLSelectElement>("[data-tour='form_type']");
      return el ? el.value !== "" : false;
    }
    return false;
  }, []);

  // ── Poll form field values every 500ms and auto-advance ──
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!visible || paused) return;
    const id = steps[step]?.id ?? "";
    if (!formStepIds.has(id)) return; // Only poll for form steps
    const poll = setInterval(() => {
      const met = checkFormCondition();
      setConditionMet(met);
      if (met && autoTimerRef.current === null) {
        setAutoCompleting(true);
        autoTimerRef.current = setTimeout(() => {
          if (stepRef.current === steps.findIndex((s) => s.id === id)) {
            setAutoCompleting(false);
            setStep((s) => Math.min(s + 1, steps.length - 1));
          }
          autoTimerRef.current = null;
        }, 500);
      }
    }, 300);
    return () => {
      clearInterval(poll);
      if (autoTimerRef.current) { clearTimeout(autoTimerRef.current); autoTimerRef.current = null; }
    };
  }, [visible, paused, step, steps, checkFormCondition, formStepIds]);



  // ── Manual restart via help button ──
  const prevManualRef = useRef(manualTrigger ?? 0);
  useEffect(() => {
    const mt = manualTrigger ?? 0;
    if (mt === prevManualRef.current) return;
    prevManualRef.current = mt;
    if (mt > 0) {
      clearState(config);
      completedRef.current = new Set();
      setConditionMet(false);
      setAutoCompleting(false);
      setStep(0);
      setPaused(false);
      setVisible(true);
    }
  }, [manualTrigger, config]);

  // ── Initialize from saved state ──
  useEffect(() => {
    const saved = loadState(config);
    if (saved && !saved.completed && saved.paused) {
      setStep(saved.currentStep);
      setPaused(true);
      setVisible(false);
    } else if (saved && !saved.completed && !saved.paused) {
      setStep(saved.currentStep);
      setVisible(true);
      setPaused(false);
    } else if (!saved && isNewUser) {
      const timer = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(timer);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // reset condition state on step change
  useEffect(() => {
    const s = steps[step];
    setAutoCompleting(false);
    if (s && (s.id === "welcome" || s.id === "verify_email")) {
      setConditionMet(true);
    } else {
      setConditionMet(false);
    }
  }, [step, steps]);

  // persist on change
  useEffect(() => {
    if (visible || paused) {
      saveState(config, { currentStep: step, completed: false, paused });
    }
  }, [step, visible, paused, config]);

  // ── Measure target & tooltip position ──
  const measure = useCallback(() => {
    if (!visible || paused || !hasTarget) {
      setTargetRect(null);
      setTooltipPos(null);
      return;
    }

    const all = document.querySelectorAll(current.targetSelector!);
    const el = Array.from(all).find(
      (e) => (e as HTMLElement).offsetParent !== null
    ) || all[0];
    if (!el) {
      setTargetFound(false);
      setTargetRect(null);
      setTooltipPos(null);
      return;
    }
    setTargetFound(true);

    const rect = el.getBoundingClientRect();
    setTargetRect(rect);

    const isMobile = window.innerWidth <= 400;
    const tooltipW = isMobile ? 280 : 400;
    const tooltipH = isMobile ? 260 : 340;

    let left: number, top: number, arrowDir: "top" | "bottom";
    const gap = isMobile ? 12 : 16;

    if (isMobile) {
      left = (window.innerWidth - tooltipW) / 2;
      top = (window.innerHeight - tooltipH) / 2;
      arrowDir = "top";
    } else {
      top = rect.bottom + gap;
      left = rect.left + rect.width / 2 - tooltipW / 2;

      if (top + tooltipH > window.innerHeight - 16) {
        top = rect.top - tooltipH - gap;
        arrowDir = "bottom";
      } else {
        arrowDir = "top";
      }

      if (current.id === "explore") left += 100;
    }

    if (!isMobile) {
      if (left < 16) left = 16;
      if (left + tooltipW > window.innerWidth - 16) {
        left = window.innerWidth - tooltipW - 16;
      }
    }
    if (top < 16) top = 16;

    setTooltipPos({ top, left, arrowDir });
  }, [visible, paused, hasTarget, current.targetSelector]);

  useEffect(() => {
    if (!visible || paused) return;
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, { passive: true });
    const poll = setInterval(measure, 250);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure);
      clearInterval(poll);
    };
  }, [visible, paused, measure, step]);

  // ── Scroll to target + highlight ──
  useEffect(() => {
    if (!visible || paused || !current.targetSelector) return;

    const all = document.querySelectorAll(current.targetSelector);
    const el = Array.from(all).find(
      (e) => (e as HTMLElement).offsetParent !== null
    ) || all[0];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("tour-target-highlight");
    }

    const timer = setTimeout(measure, 400);
    return () => {
      if (el) el.classList.remove("tour-target-highlight");
      clearTimeout(timer);
    };
  }, [step, visible, paused, measure, current.targetSelector]);

  // ── Click-based steps: catch clicks via event delegation ──
  // (target element may not exist in DOM yet when effect runs)
  useEffect(() => {
    if (!visible || paused || !current.targetSelector) return;
    const stepId = current.id;
    if (!clickStepIds.has(stepId)) return;
    const sel = current.targetSelector;

    const handler = (e: MouseEvent) => {
      if ((e.target as HTMLElement)?.closest(sel)) {
        markCompleted(stepId + "_click");
        setStep((s) => Math.min(s + 1, steps.length - 1));
      }
    };

    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [visible, paused, current.id, current.targetSelector, steps.length, clickStepIds]);

  // ── Advance via custom events ──
  useEffect(() => {
    if (!visible || paused || !current.autoAdvanceOn) return;

    const eventName = current.autoAdvanceOn;
    const stepId = current.id;

    const handler = () => {
      markCompleted(stepId + "_event");
      // Advance immediately on custom event
      setStep((s) => Math.min(s + 1, steps.length - 1));
    };

    window.addEventListener(eventName, handler);
    return () => window.removeEventListener(eventName, handler);
  }, [visible, paused, current.id, current.autoAdvanceOn, steps.length]);

  // ── Pulsing indicator ring around target ──
  const renderTargetRing = () => {
    if (!hasTarget || !targetRect) return null;
    const { x, y, width, height } = targetRect;
    const pad = 6;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed z-[205] pointer-events-none"
        style={{
          left: x - pad - 3,
          top: y - pad - 3,
          width: width + pad * 2 + 6,
          height: height + pad * 2 + 6,
        }}
      >
        <motion.div
          className="absolute inset-0 rounded-[20px] border-[3px] border-red-400/70"
          animate={{
            scale: [1, 1.06, 1],
            opacity: [0.8, 0.3, 0.8],
          }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute inset-[2px] rounded-[18px] border border-red-500/60"
          animate={{ opacity: [0.6, 0.15, 0.6] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -top-7 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 4, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg width="24" height="16" viewBox="0 0 24 16" fill="none">
            <path d="M12 16L0 0H24L12 16Z" fill="#ef4444" />
          </svg>
        </motion.div>
      </motion.div>
    );
  };

  // ── Confetti ──
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

  // ── Navigation ──
  const handleNext = useCallback(() => {
    if (step < steps.length - 1) {
      setStep((s) => s + 1);
    } else {
      triggerConfetti();
      setTimeout(() => {
        saveState(config, { currentStep: 0, completed: true, paused: false });
        setVisible(false);
      }, 1500);
    }
  }, [step, steps.length, triggerConfetti, config]);

  const handlePrev = useCallback(() => {
    if (step > 0) setStep((s) => s - 1);
  }, [step]);

  const handleSkip = useCallback(() => {
    saveState(config, { currentStep: 0, completed: true, paused: false });
    setVisible(false);
  }, [config]);

  const handlePause = useCallback(() => {
    setPaused(true);
    setVisible(false);
    saveState(config, { currentStep: step, completed: false, paused: true });
  }, [step, config]);

  const handleResume = useCallback(() => {
    setPaused(false);
    setVisible(true);
    saveState(config, { currentStep: step, completed: false, paused: false });
  }, [step, config]);

  const handleResendVerification = async () => {
    setSendingVerification(true);
    try {
      const res = await fetch("/api/auth/resend-verification", { method: "POST" });
      const data = await res.json();
      if (data.success) setVerificationSent(true);
    } catch {}
    setSendingVerification(false);
  };

  // ── Render helpers ──
  const renderSpotlight = () => {
    if (!hasTarget || !targetRect) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
        />
      );
    }

    const { x, y, width, height } = targetRect;
    const pad = 10;
    const rx = 16;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    return (
      <svg className="fixed inset-0 w-full h-full z-[200] pointer-events-none">
        <defs>
          <mask id="spotlight-cutout">
            <rect width={vw} height={vh} fill="white" />
            <rect
              x={x - pad}
              y={y - pad}
              width={width + pad * 2}
              height={height + pad * 2}
              rx={rx}
              fill="black"
            />
          </mask>
        </defs>
        <rect
          width={vw}
          height={vh}
          fill="rgba(0,0,0,0.55)"
          mask="url(#spotlight-cutout)"
          style={{ backdropFilter: "blur(2px)" }}
        />
      </svg>
    );
  };

  const renderAgentBubble = (message: string) => (
    <div className="flex items-start gap-2 max-[400px]:gap-1.5 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/40 dark:to-orange-950/40 rounded-xl max-[400px]:rounded-lg p-3 max-[400px]:p-2 border border-red-100 dark:border-red-900/30">
      <div className="w-7 h-7 max-[400px]:w-6 max-[400px]:h-6 rounded-lg bg-gradient-to-br from-red-500 to-orange-400 flex items-center justify-center shrink-0 shadow-sm">
          <Bot className="w-3.5 h-3.5 max-[400px]:w-3 max-[400px]:h-3 text-white" />
        </div>
        <div>
          <p className="text-[9px] max-[400px]:text-[8px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-0.5">
            {t("tour.agente_ia")}
          </p>
        <p className="text-xs max-[400px]:text-[11px] text-zinc-700 dark:text-zinc-300 leading-relaxed">
          {message}
        </p>
      </div>
    </div>
  );

  const renderProgressDots = () => (
    <div className="flex justify-center gap-1.5">
      {steps.map((s, i) => (
        <div
          key={s.id}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i === step
              ? "w-8 bg-red-500"
              : i < step
                ? "w-2 bg-red-300"
                : "w-2 bg-zinc-200 dark:bg-zinc-700"
          }`}
        />
      ))}
    </div>
  );

  const renderConditionHint = () => {
    const id = current.id;
    if (conditionMet || isWelcomeStep || isVerifyStep) return null;
    if (id === "create_store" || id === "create_btn" || id === "ai_agent" || id === "chat" || id === "explore") {
      return (
        <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium text-center italic">
          {t("tour.hint_click")}
        </p>
      );
    }
    if (id === "form_name") {
      return (
        <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium text-center italic">
          {t("tour.hint_name")}
        </p>
      );
    }
    if (id === "form_desc") {
      return (
        <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium text-center italic">
          {t("tour.hint_desc")}
        </p>
      );
    }
    if (id === "form_industry" || id === "form_type") {
      return (
        <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium text-center italic">
          {t("tour.hint_select")}
        </p>
      );
    }
    if (id === "form_submit") {
      return (
        <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium text-center italic">
          {t("tour.hint_submit")}
        </p>
      );
    }
    return null;
  };

  const renderTooltip = () => {
    if (!tooltipPos) return null;

    return (
      <motion.div
        ref={tooltipRef}
        key={step}
        initial={{ opacity: 0, scale: 0.92, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92 }}
        transition={{ type: "spring", stiffness: 350, damping: 30 }}
        className="fixed z-[210] w-[320px] max-[400px]:w-[280px] max-w-[calc(100vw-24px)]"
        style={{ top: tooltipPos.top, left: tooltipPos.left }}
      >
        <div
          className={`absolute max-[400px]:hidden ${
            tooltipPos.arrowDir === "top" ? "-top-2" : "-bottom-2"
          } left-1/2 -translate-x-1/2 w-4 h-2 z-[1]`}
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

        <div className="bg-white dark:bg-zinc-900 rounded-2xl max-[400px]:rounded-xl shadow-2xl dark:shadow-black/50 overflow-hidden border border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2 max-[400px]:gap-1.5 p-3 max-[400px]:p-2.5 pb-0">
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              className="w-8 h-8 max-[400px]:w-7 max-[400px]:h-7 rounded-xl bg-gradient-to-br from-red-500 to-orange-400 flex items-center justify-center shadow-sm shrink-0"
            >
              <Icon className="w-4 h-4 max-[400px]:w-3.5 max-[400px]:h-3.5 text-white" />
            </motion.div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm max-[400px]:text-xs font-bold text-zinc-900 dark:text-white tracking-tight truncate">
                {current.title}
              </h3>
            </div>
            <button
              onClick={handleSkip}
              className="w-6 h-6 max-[400px]:w-5 max-[400px]:h-5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center transition-all shrink-0"
            >
              <X className="w-3 h-3 max-[400px]:w-2.5 max-[400px]:h-2.5 text-zinc-400" />
            </button>
          </div>

          <div className="p-3 max-[400px]:p-2.5 space-y-3 max-[400px]:space-y-2">
            {renderAgentBubble(current.agentMessage)}

            <p className="text-xs max-[400px]:text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {current.description}
            </p>

            {autoCompleting && conditionMet && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 p-2 max-[400px]:p-1.5 rounded-xl text-[10px] max-[400px]:text-[9px] font-bold"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {t("tour.completed")}
              </motion.div>
            )}

            {!targetFound && hasTarget && (
              <p className="text-[10px] max-[400px]:text-[9px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-xl p-2 max-[400px]:p-1.5 text-center font-medium">
                {t("tour.waiting_element")}
              </p>
            )}

            {renderConditionHint()}

            {current.id === "explore" && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setStep((s) => Math.min(s + 1, steps.length - 1))}
                className="w-full py-2.5 max-[400px]:py-2 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl text-[11px] max-[400px]:text-[10px] font-bold shadow-md shadow-red-600/20 hover:from-red-700 hover:to-red-600 transition-all flex items-center justify-center gap-2"
              >
                <Bot className="w-4 h-4" /> {t("tour.btn_test_ai")}
              </motion.button>
            )}

            {renderProgressDots()}

            <div className="flex items-center gap-1.5 max-[400px]:gap-1">
              {!isFirst ? (
                <button
                  onClick={handlePrev}
                  className="px-2.5 max-[400px]:px-2 py-2 max-[400px]:py-1.5 rounded-xl text-[11px] max-[400px]:text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all flex items-center gap-1 shrink-0"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> {t("tour.btn_back")}
                </button>
              ) : (
                <button
                  onClick={handleSkip}
                  className="px-2.5 max-[400px]:px-2 py-2 max-[400px]:py-1.5 rounded-xl text-[11px] max-[400px]:text-[10px] font-semibold text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all shrink-0"
                >
                  {t("tour.btn_skip")}
                </button>
              )}

              <button
                onClick={handleNext}
                disabled={!conditionMet && !isWelcomeStep && current.id !== "explore"}
                className={`flex-1 py-2 max-[400px]:py-1.5 rounded-xl text-[11px] max-[400px]:text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                  conditionMet || isWelcomeStep || current.id === "explore"
                    ? "bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-700 hover:to-red-600 shadow-md shadow-red-600/20"
                    : "bg-zinc-200 text-zinc-400 cursor-not-allowed dark:bg-zinc-800"
                }`}
              >
                {autoCompleting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : isLast ? (
                  <> {t("tour.btn_done")} <ArrowRight className="w-3.5 h-3.5" /></>
                ) : (
                  <> {t("tour.btn_next")} <ChevronRight className="w-3.5 h-3.5" /></>
                )}
              </button>

              {!isLast && (
                <button
                  onClick={handlePause}
                  className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center transition-all shrink-0"
                  title={t("tour.btn_pause")}
                >
                  <Pause className="w-4 h-4 text-zinc-500" />
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderCenteredStep = () => (
    <motion.div
      key={step}
      initial={{ opacity: 0, scale: 0.92, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ type: "spring", stiffness: 350, damping: 30 }}
      className="fixed z-[210] w-[420px] max-w-[calc(100vw-32px)] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
    >
      <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl dark:shadow-black/50 overflow-hidden border border-zinc-100 dark:border-zinc-800">
        <div className="bg-gradient-to-br from-red-600 via-red-500 to-orange-400 p-6 text-white relative">
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 w-7 h-7 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-all"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
            className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-3 backdrop-blur-sm"
          >
            <Icon className="w-6 h-6" />
          </motion.div>
          <h2 className="text-xl font-bold tracking-tight">{current.title}</h2>
          {isWelcomeStep && (
            <p className="text-sm text-white/80 mt-1 leading-relaxed">
              {current.description}
            </p>
          )}
        </div>

        <div className="p-6 space-y-4">
          {renderAgentBubble(current.agentMessage)}

          {!isWelcomeStep && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {current.description}
            </p>
          )}

          {!targetFound && hasTarget && !isVerifyStep && (
            <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-xl p-3 text-center font-medium">
              {t("tour.waiting_element")}
            </p>
          )}

          {autoCompleting && conditionMet && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 p-3 rounded-xl text-xs font-bold"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              ¡Completado!
            </motion.div>
          )}

          {renderConditionHint()}

          {current.id === "explore" && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setStep((s) => Math.min(s + 1, steps.length - 1))}
              className="w-full py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl text-xs font-bold shadow-md shadow-red-600/20 hover:from-red-700 hover:to-red-600 transition-all flex items-center justify-center gap-2"
            >
              <Bot className="w-4 h-4" /> {t("tour.btn_test_ai")}
            </motion.button>
          )}

          {isVerifyStep && (
            <div className="bg-rose-50 dark:bg-rose-950/30 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <p className="text-xs font-semibold text-rose-700 dark:text-rose-300">
                  {t("tour.verify_inbox")}
                </p>
              </div>
              {verificationSent ? (
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" /> {t("tour.verify_sent")}
                </div>
              ) : (
                <button
                  onClick={handleResendVerification}
                  disabled={sendingVerification}
                  className="w-full py-2.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {sendingVerification ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <> {t("tour.verify_resend")}</>
                  )}
                </button>
              )}
              <p className="text-[9px] text-rose-400 italic text-center">
                {t("tour.verify_spam")}
              </p>
            </div>
          )}

          {renderProgressDots()}

          <div className="flex items-center gap-2">
            {!isFirst ? (
              <button
                onClick={handlePrev}
                className="px-3 py-2.5 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all flex items-center gap-1 shrink-0"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Atrás
              </button>
            ) : (
              <button
                onClick={handleSkip}
                className="px-3 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all shrink-0"
              >
                Saltar
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={!conditionMet && !isWelcomeStep && !isVerifyStep && current.id !== "explore"}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                conditionMet || isWelcomeStep || isVerifyStep || current.id === "explore"
                  ? "bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-700 hover:to-red-600 shadow-md shadow-red-600/20"
                  : "bg-zinc-200 text-zinc-400 cursor-not-allowed dark:bg-zinc-800"
              }`}
            >
              {autoCompleting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : isLast ? (
                <>Listo <ArrowRight className="w-3.5 h-3.5" /></>
              ) : (
                <> {t("tour.btn_continue")} <ArrowRight className="w-3.5 h-3.5" /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );

  // ── Main render ──
  return (
    <>
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

      {paused && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          onClick={handleResume}
          className="fixed bottom-24 md:bottom-6 right-3 md:right-6 z-[250] flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-2xl shadow-2xl shadow-red-600/30 hover:from-red-700 hover:to-red-600 transition-all font-bold text-[10px] md:text-xs"
        >
          <Play className="w-4 h-4 fill-white" />
          {t("tour.btn_resume")}
        </motion.button>
      )}

      <AnimatePresence>
        {visible && (
          <>
            {renderSpotlight()}
            {renderTargetRing()}
            {isWelcomeStep || isVerifyStep || !hasTarget || !targetFound
              ? renderCenteredStep()
              : renderTooltip()}
          </>
        )}
      </AnimatePresence>
    </>
  );
}
