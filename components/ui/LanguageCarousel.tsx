"use client";

import React, { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { LANGUAGES } from "@/lib/i18n/translations";
import { Globe } from "lucide-react";

const FLAGS: Record<string, string> = {
  es: "🇪🇸",
  en: "🇺🇸",
  fr: "🇫🇷",
  zh: "🇨🇳",
  hi: "🇮🇳",
  ko: "🇰🇷",
  ja: "🇯🇵",
  it: "🇮🇹",
  pt: "🇵🇹",
  ru: "🇷🇺",
};

export function LanguageCarousel() {
  const { language, setLanguage } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDropdown]);

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-xl rounded-xl border border-white/10 hover:bg-white/20 transition-all"
        whileTap={{ scale: 0.95 }}
      >
        <Globe className="w-4 h-4 text-white/70" />
        <span className="text-sm">{FLAGS[language]}</span>
        <span className="text-[10px] font-semibold text-white/70 uppercase tracking-wider">
          {LANGUAGES.find((l) => l.code === language)?.native ?? language}
        </span>
        <motion.svg
          animate={{ rotate: showDropdown ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="w-3 h-3 text-white/50"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" />
        </motion.svg>
      </motion.button>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 right-0 z-50 p-1.5 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl min-w-[180px]"
          >
            <div className="flex flex-col gap-0.5">
              {LANGUAGES.map((lang) => {
                const isActive = language === lang.code;
                return (
                  <motion.button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      setShowDropdown(false);
                    }}
                    className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                      isActive
                        ? "bg-red-500/20 text-red-300"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="lang-active"
                        className="absolute inset-0 rounded-xl bg-red-500/20"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className="relative text-base">{FLAGS[lang.code]}</span>
                    <span className="relative text-xs font-semibold">{lang.native}</span>
                    {isActive && (
                      <motion.span
                        layoutId="lang-check"
                        className="relative ml-auto text-xs text-red-400"
                      >
                        ✓
                      </motion.span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
