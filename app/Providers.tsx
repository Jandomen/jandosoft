"use client";

import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { ThemeProvider } from "@/components/public/ThemeProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </LanguageProvider>
  );
}
