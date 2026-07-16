import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicStore } from "@/lib/store-utils";
import { getPublicPageTranslations } from "@/lib/i18n/public-store";
import type { Language } from "@/lib/i18n/translations";
import { StorePublicAI } from "./StorePublicAI";
import { EmbeddedWidget } from "./EmbeddedWidget";
import TrackingWrapper from "@/components/TrackingWrapper";
import { ThemeProvider } from "@/components/public/ThemeProvider";
import { StoreMap } from "@/components/maps/StoreMap";
import { Star, Mail, MessageCircle, Calendar, ChevronRight, MapPin, Phone } from "lucide-react";
import { getCurrencySymbol } from "@/lib/utils/currency";
import GallerySection from "@/components/public/GallerySection";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const BRAND = "#dc2626";

function getPrimaryColor(store: any): string {
  return store.agentConfig?.primaryColor || BRAND;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function getLocale(store: any): Language {
  return (store.agentConfig?.lang as Language) || "es";
}

function SectionBadge({ label, primary }: { label: string; primary: string }) {
  return (
    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] md:text-xs font-semibold border backdrop-blur-sm mb-4 md:mb-6"
      style={{
        background: `${hexToRgba(primary, 0.1)}`,
        color: primary,
        borderColor: `${hexToRgba(primary, 0.2)}`
      }}>
      {label}
    </div>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const store = await getPublicStore(slug);
  if (!store) return { title: "Empresa no encontrada" };
  const t = getPublicPageTranslations(getLocale(store));
  return {
    title: store.name,
    description: store.desc || t.metaDesc(store.name),
    openGraph: { title: store.name, description: store.desc || "", images: store.image ? [store.image] : [] },
  };
}

function SuggestedQuestions({ t, primary }: { t: any; primary: string }) {
  const questions = [
    t.aiSuggestOfferings,
    t.aiSuggestHours,
    t.aiSuggestContact,
    t.aiSuggestLocation,
  ];
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {questions.map((q: string) => (
        <a key={q} href="#ai-agent"
          className="text-[11px] md:text-xs font-medium px-3.5 py-2 rounded-full border transition-all hover:shadow-sm active:scale-[0.97]"
          style={{
            background: `${hexToRgba(primary, 0.05)}`,
            color: primary,
            borderColor: `${hexToRgba(primary, 0.15)}`,
          }}>
          {q}
        </a>
      ))}
    </div>
  );
}

export default async function StoreMainPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const isEmbed = sp.embed === "1";
  const store = await getPublicStore(slug);
  if (!store) notFound();

  const locale = getLocale(store);
  const t = getPublicPageTranslations(locale);
  const primary = getPrimaryColor(store);
  const storeCurrency = (store as any).currency || "USD";
  const symbol = getCurrencySymbol(storeCurrency);
  const gallery = (store as any).galleryItems || [];
  const testimonials = (store as any).testimonials || [];
  const menuItems = (store as any).menuItems || [];
  const products = (store as any).products || [];
  const services = (store as any).services || [];
  const hasBooking = services.length > 0;

  if (isEmbed && store.publicAI) {
    return (
      <ThemeProvider>
        <div className="h-full w-full">
          <EmbeddedWidget store={store} />
        </div>
      </ThemeProvider>
    );
  }

   if (store.isSuspended) {
    return (
      <ThemeProvider>
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center px-6 space-y-6">
          <div className="w-20 h-20 bg-red-50 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto">
            <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
           <h1 className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-zinc-100">{t.suspendedTitle}</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-base">
            {store.suspensionReason || t.suspendedDefaultReason}
          </p>
          <div className="pt-4">
            <a href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-sm font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all">
              {t.suspendedBackHome}
            </a>
          </div>
        </div>
      </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
    <div className="min-h-screen bg-white dark:bg-zinc-950 transition-colors">

      {/* ===== HEADER ===== */}
      <header className="border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 md:h-16 flex items-center justify-between">
          <a href={`/s/${slug}`} className="flex items-center gap-2.5 group">
            {store.image ? (
              <img src={store.image} alt={store.name} className="w-7 h-7 md:w-8 md:h-8 rounded-xl object-cover ring-2 ring-zinc-200 dark:ring-zinc-700 group-hover:ring-red-300 dark:group-hover:ring-red-700 transition-all" />
            ) : (
              <div style={{ background: `linear-gradient(135deg, ${primary}, ${primary}dd)` }} className="w-7 h-7 md:w-8 md:h-8 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-lg">J</div>
            )}
            <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm truncate max-w-[120px] md:max-w-[180px]">{store.name}</span>
          </a>
          <div className="flex items-center gap-3 md:gap-6">
            <nav className="flex items-center gap-1 md:gap-2">
              {[
                { href: `/s/${slug}`, label: t.navHome, active: true },
                ...(products.length > 0 ? [{ href: `/s/${slug}/products`, label: t.navProducts, active: false }] : []),
                ...(services.length > 0 ? [{ href: `/s/${slug}/services`, label: t.navServices, active: false }] : []),
              ].map(l => (
                <a key={l.label} href={l.href} style={l.active ? { background: primary, color: "white", boxShadow: `0 1px 3px ${hexToRgba(primary, 0.3)}` } : {}}
                  className={`px-2.5 md:px-3.5 py-1.5 md:py-2 rounded-lg text-[10px] md:text-xs font-bold transition-all ${l.active ? "" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}>
                  {l.label}
                </a>
              ))}
            </nav>
            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700 hidden sm:block" />
            <a href="/" className="text-[9px] md:text-[10px] font-wallpoet tracking-[0.2em] text-red-600 hover:text-red-500 transition-colors hidden sm:block">
              JANDOSOFT
            </a>
          </div>
        </div>
      </header>

      <main>
        {/* ===== HERO ===== */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950" />
          <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at top right, ${hexToRgba(primary, 0.18)}, transparent 60%)` }} />
          <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at bottom left, ${hexToRgba(primary, 0.1)}, transparent 50%)` }} />
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[120px]" style={{ background: `${hexToRgba(primary, 0.05)}` }} />

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-24 md:py-36">
            <div className="max-w-3xl mx-auto text-center space-y-6 md:space-y-8">
              {store.image && (
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full scale-150 blur-[60px]" style={{ background: `${hexToRgba(primary, 0.2)}` }} />
                    <img src={store.image} alt={store.name} className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-2xl md:rounded-3xl object-cover shadow-2xl ring-4 ring-white/[0.08] mx-auto" />
                  </div>
                </div>
              )}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[10px] md:text-xs font-semibold border backdrop-blur-sm"
                style={{
                  background: `${hexToRgba(primary, 0.1)}`,
                  color: primary,
                  borderColor: `${hexToRgba(primary, 0.2)}`
                }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: primary }} />
                {store.industry}
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white leading-[1.1] tracking-tight">
                {store.name}
              </h1>
              {store.desc && (
                <p className="text-sm sm:text-base md:text-lg text-zinc-400 leading-relaxed max-w-2xl mx-auto font-medium">
                  {store.desc}
                </p>
              )}

              <div className="pt-4 md:pt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                {store.publicAI && (
                  <a href="#ai-agent"
                    style={{ background: primary, boxShadow: `0 10px 15px -3px ${hexToRgba(primary, 0.3)}` }}
                    className="inline-flex items-center gap-2.5 px-7 md:px-9 py-3.5 md:py-4 text-white rounded-xl md:rounded-2xl font-bold text-xs md:text-sm hover:brightness-110 transition-all active:scale-[0.97] w-full sm:w-auto justify-center">
                    <MessageCircle className="w-4 h-4 md:w-5 md:h-5" />
                    {t.heroPrimaryCta}
                  </a>
                )}
                <a href={hasBooking ? `/s/${slug}/reservar` : `/s/${slug}/contact`}
                  className="inline-flex items-center gap-2.5 px-7 md:px-9 py-3.5 md:py-4 bg-white/[0.06] text-white rounded-xl md:rounded-2xl font-bold text-xs md:text-sm hover:bg-white/[0.12] transition-all border border-white/[0.08] backdrop-blur-sm active:scale-[0.97] w-full sm:w-auto justify-center">
                  {hasBooking ? <Calendar className="w-4 h-4 md:w-5 md:h-5" /> : <Mail className="w-4 h-4 md:w-5 md:h-5" />}
                  {hasBooking ? t.heroSecondaryBook : t.heroSecondaryContact}
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ===== AI AGENT ===== */}
        {store.publicAI && (
          <section id="ai-agent" className="relative -mt-8 md:-mt-12 pb-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
              <div className="relative bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1" style={{ background: `linear-gradient(90deg, ${primary}, ${hexToRgba(primary, 0.3)})` }} />
                <div className="p-6 md:p-10">
                  <div className="text-center mb-6 md:mb-8 space-y-3">
                    <h2 className="text-xl md:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
                      {t.aiTitle(store.name)}
                    </h2>
                    <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto">
                      {t.aiSubtitle}
                    </p>
                    <SuggestedQuestions t={t} primary={primary} />
                  </div>
                  <div className="max-w-2xl mx-auto">
                    <StorePublicAI storeId={store._id} storeName={store.name} industry={store.industry}
                      products={(store as any).products} services={(store as any).services} knowledgebase={(store as any).knowledgebase}
                      agentConfig={(store as any).agentConfig} autoStart noHeader fillHeight />
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ===== SERVICES ===== */}
        {services.length > 0 && (
          <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-20">
            <div className="flex flex-col items-center mb-10 md:mb-14">
              <SectionBadge label={t.navServices} primary={primary} />
              <h2 className="text-2xl md:text-4xl font-black text-zinc-900 dark:text-white text-center tracking-tight">
                {t.navServices}
              </h2>
              <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 mt-2">{services.length} servicios disponibles</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {services.slice(0, 9).map((s: any) => (
                <div key={s.id} className="bg-white dark:bg-zinc-900 rounded-2xl p-5 md:p-6 border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all hover:border-red-200 dark:hover:border-red-900 space-y-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${hexToRgba(primary, 0.1)}`, color: primary }}>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{s.name}</h3>
                  {s.desc && <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">{s.desc}</p>}
                  <div className="flex items-center justify-between pt-1">
                    <span className="font-black text-sm" style={{ color: primary }}>{symbol}{s.price}</span>
                    {s.duration && <span className="text-[10px] font-medium text-zinc-400">{s.duration} min</span>}
                  </div>
                </div>
              ))}
            </div>
            {services.length > 9 && (
              <div className="text-center mt-6">
                <a href={`/s/${slug}/services`} className="inline-flex items-center gap-1.5 text-xs font-bold" style={{ color: primary }}>
                  {t.navServices} <ChevronRight className="w-3 h-3" />
                </a>
              </div>
            )}
          </section>
        )}

        {/* ===== PRODUCTS / MENU ===== */}
        {(products.length > 0 || menuItems.length > 0) && (
          <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-12 md:pb-20">
            <div className="flex flex-col items-center mb-10 md:mb-14">
              <SectionBadge label={menuItems.length > 0 ? t.navProducts : t.navProducts} primary={primary} />
              <h2 className="text-2xl md:text-4xl font-black text-zinc-900 dark:text-white text-center tracking-tight">
                {menuItems.length > 0 ? t.sectionMenu : t.navProducts}
              </h2>
            </div>
            {menuItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {menuItems.slice(0, 6).map((item: any) => (
                  <div key={item.id} className="flex items-start justify-between gap-4 bg-white dark:bg-zinc-900 rounded-2xl p-4 md:p-5 border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all hover:border-red-200 dark:hover:border-red-900">
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">{item.name}</h4>
                      {item.desc && <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{item.desc}</p>}
                    </div>
                    <span className="font-black text-sm shrink-0" style={{ color: primary }}>{symbol}{item.price}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                {products.slice(0, 9).map((p: any) => (
                  <div key={p.id} className="bg-white dark:bg-zinc-900 rounded-2xl p-5 md:p-6 border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all hover:border-red-200 dark:hover:border-red-900 space-y-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${hexToRgba(primary, 0.1)}`, color: primary }}>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">{p.name}</h3>
                    {p.desc && <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">{p.desc}</p>}
                    <div className="flex items-center justify-between pt-1">
                      <span className="font-black text-sm" style={{ color: primary }}>{symbol}{p.price}</span>
                      {p.stock !== undefined && <span className={`text-[10px] font-medium ${p.stock > 0 ? "text-emerald-600" : "text-red-500"}`}>{p.stock > 0 ? `${p.stock} en stock` : "Agotado"}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {products.length > 9 && (
              <div className="text-center mt-6">
                <a href={`/s/${slug}/products`} className="inline-flex items-center gap-1.5 text-xs font-bold" style={{ color: primary }}>
                  {t.navProducts} <ChevronRight className="w-3 h-3" />
                </a>
              </div>
            )}
          </section>
        )}

        {/* ===== TESTIMONIALS ===== */}
        {testimonials.length > 0 && (
          <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-12 md:pb-20">
            <div className="flex flex-col items-center mb-10 md:mb-14">
              <SectionBadge label={t.sectionTestimonials} primary={primary} />
              <h2 className="text-2xl md:text-4xl font-black text-zinc-900 dark:text-white text-center tracking-tight">
                {t.sectionTestimonials}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {testimonials.slice(0, 6).map((testimonial: any) => (
                <div key={testimonial.id} className="bg-white dark:bg-zinc-900 rounded-2xl p-5 md:p-6 space-y-3 border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all hover:border-red-200 dark:hover:border-red-900">
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(n => (
                      <Star key={n} className={`w-3.5 h-3.5 ${n <= testimonial.rating ? "fill-yellow-400 text-yellow-400" : "text-zinc-300 dark:text-zinc-600"}`} />
                    ))}
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 italic leading-relaxed">&ldquo;{testimonial.text}&rdquo;</p>
                  <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{testimonial.clientName}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ===== GALLERY ===== */}
        {gallery.length > 0 && (
          <GallerySection items={gallery} sectionLabel={t.sectionGallery} primary={primary} />
        )}

        {/* ===== MAP ===== */}
        {(store as any).coordinates && (
          <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-12 md:pb-20">
            <div className="flex flex-col items-center mb-6 md:mb-10">
              <SectionBadge label="Ubicación" primary={primary} />
              <h2 className="text-2xl md:text-4xl font-black text-zinc-900 dark:text-white text-center tracking-tight">
                Cómo llegar
              </h2>
            </div>
            <div className="max-w-3xl mx-auto space-y-4">
              {(store as any).location && (
                <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
                  <MapPin className="w-5 h-5 shrink-0" style={{ color: primary }} />
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{(store as any).location}</p>
                </div>
              )}
              <StoreMap
                storeId={String(store._id)}
                coordinates={(store as any).coordinates}
                name={store.name}
                className="w-full aspect-square shadow-md"
              />
            </div>
          </section>
        )}

        {/* ===== CONTACT ===== */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-12 md:pb-20">
          <div className="flex flex-col items-center mb-10 md:mb-14">
            <SectionBadge label={t.contactEmail} primary={primary} />
            <h2 className="text-2xl md:text-4xl font-black text-zinc-900 dark:text-white text-center tracking-tight">
              {t.contactTitle(store.name)}
            </h2>
          </div>
          <div className="max-w-lg mx-auto space-y-4">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all p-6 md:p-8 space-y-4">
              {store.ownerEmail && (
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${hexToRgba(primary, 0.1)}`, color: primary }}>
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{t.contactEmail}</p>
                    <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">{store.ownerEmail}</p>
                  </div>
                </div>
              )}
              {(store as any).phone && (
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${hexToRgba(primary, 0.1)}`, color: primary }}>
                    <Phone className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Teléfono</p>
                    <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">{(store as any).phone}</p>
                  </div>
                </div>
              )}
              {hasBooking && (
                <div className="pt-2">
                  <a href={`/s/${slug}/reservar`}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-xs transition-all active:scale-[0.97]"
                    style={{ background: primary, color: "white" }}>
                    <Calendar className="w-4 h-4" />
                    {t.heroSecondaryBook}
                  </a>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800/80 py-8 md:py-12">
        <div className="max-w-6xl mx-auto px-6 text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            {store.image ? (
              <img src={store.image} alt="" className="w-5 h-5 rounded-md object-cover" />
            ) : (
              <div style={{ background: primary }} className="w-5 h-5 rounded-md flex items-center justify-center text-white font-black text-[8px]">J</div>
            )}
            <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">{store.name}</span>
          </div>
          <p className="text-[10px] md:text-[11px] font-medium text-zinc-400 dark:text-zinc-500 flex items-center justify-center gap-1.5">
            {t.footerPoweredBy} <a href="/" className="font-wallpoet tracking-[0.2em] text-red-600 hover:text-red-500 transition-colors">JANDOSOFT</a>
          </p>
        </div>
      </footer>
      <TrackingWrapper slug={slug} />
    </div>
    </ThemeProvider>
  );
}
