"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem("theme") as Theme | null;
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    const t = getInitialTheme();
    console.log("[ThemeProvider] getInitialTheme() =", t);
    setThemeState(t);
    document.documentElement.classList.toggle("dark", t === "dark");
    console.log("[ThemeProvider] after init, <html> classList =", document.documentElement.className);
    console.log("[ThemeProvider] <html> has .dark?", document.documentElement.classList.contains("dark"));
    // Check computed style of body
    const bodyBg = getComputedStyle(document.body).backgroundColor;
    console.log("[ThemeProvider] body bg color =", bodyBg);
  }, []);

  useEffect(() => {
    console.log("[ThemeProvider] theme changed to:", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
    console.log("[ThemeProvider] after toggle, <html> classList =", document.documentElement.className);
    console.log("[ThemeProvider] <html> has .dark?", document.documentElement.classList.contains("dark"));
    // Check a bg-white element
    const testEl = document.querySelector(".bg-white");
    if (testEl) {
      const bg = getComputedStyle(testEl).backgroundColor;
      console.log("[ThemeProvider] first .bg-white element bg =", bg);
    } else {
      console.log("[ThemeProvider] no .bg-white element found");
    }
    const testText = document.querySelector(".text-zinc-950");
    if (testText) {
      const color = getComputedStyle(testText).color;
      console.log("[ThemeProvider] first .text-zinc-950 element color =", color);
    }
  }, [theme]);

  const toggle = useCallback(() => {
    console.log("[ThemeProvider] toggle button clicked, current theme:", theme);
    setThemeState(prev => (prev === "dark" ? "light" : "dark"));
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
      <button
        onClick={toggle}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center transition-all active:scale-90 hover:scale-110 border-2
          bg-zinc-950 text-white border-zinc-800 hover:bg-zinc-800
          dark:bg-white dark:text-zinc-950 dark:border-zinc-200 dark:hover:bg-zinc-100"
        aria-label="Cambiar tema"
      >
        {theme === "dark" ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )}
      </button>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
