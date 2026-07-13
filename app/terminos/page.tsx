"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export default function TerminosPage() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-white">
      <header className="h-20 bg-white border-b border-zinc-100 flex items-center px-10">
        <Link href="/" className="font-wallpoet tracking-[0.2em] text-red-600 text-lg uppercase">
          JANDOSOFT
        </Link>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-20 space-y-12">
        <div className="space-y-4">
          <h1 className="text-5xl font-black italic text-zinc-950 uppercase tracking-tighter">{t("terms.title")}</h1>
          <p className="text-zinc-400 font-bold italic text-sm">{t("terms.updated")}</p>
        </div>

        <section className="space-y-6">
          <h2 className="text-2xl font-black italic text-zinc-950 uppercase">{t("terms.section1_title")}</h2>
          <p className="text-zinc-600 leading-relaxed">{t("terms.section1_body")}</p>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-black italic text-zinc-950 uppercase">{t("terms.section2_title")}</h2>
          <p className="text-zinc-600 leading-relaxed">{t("terms.section2_body")}</p>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-black italic text-zinc-950 uppercase">{t("terms.section3_title")}</h2>
          <p className="text-zinc-600 leading-relaxed">{t("terms.section3_body")}</p>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-black italic text-zinc-950 uppercase">{t("terms.section4_title")}</h2>
          <p className="text-zinc-600 leading-relaxed">{t("terms.section4_body")}</p>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-black italic text-zinc-950 uppercase">{t("terms.section5_title")}</h2>
          <p className="text-zinc-600 leading-relaxed">{t("terms.section5_body")}</p>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-black italic text-zinc-950 uppercase">{t("terms.section6_title")}</h2>
          <p className="text-zinc-600 leading-relaxed">{t("terms.section6_body")}</p>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-black italic text-zinc-950 uppercase">{t("terms.section7_title")}</h2>
          <p className="text-zinc-600 leading-relaxed">{t("terms.section7_body")}</p>
        </section>
      </main>

      <footer className="border-t border-zinc-100 py-8 px-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
            <span className="font-wallpoet tracking-[0.2em] text-red-600">© 2026 JANDOSOFT</span> ENTERPRISE
          </p>
          <Link href="/" className="text-[10px] font-black text-red-600 uppercase tracking-widest hover:underline">
            {t("terms.back")}
          </Link>
        </div>
      </footer>
    </div>
  );
}
