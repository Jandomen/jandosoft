import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicStore } from "@/lib/store-utils";
import { Briefcase } from "lucide-react";
import TrackingWrapper from "@/components/TrackingWrapper";
import { ThemeProvider } from "@/components/public/ThemeProvider";
import { getCurrencySymbol } from "@/lib/utils/currency";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const store = await getPublicStore(slug);
  if (!store) return { title: "Empresa no encontrada" };
  return { title: `Servicios - ${store.name}`, description: `Servicios ofrecidos por ${store.name}` };
}

export default async function ServicesPage({ params }: Props) {
  const { slug } = await params;
  const store = await getPublicStore(slug);
  if (!store) notFound();

  const services = (store as any).services || [];
  const storeCurrency = (store as any).currency || "USD";
  const symbol = getCurrencySymbol(storeCurrency);

  return (
    <ThemeProvider>
    <div className="min-h-screen bg-white dark:bg-zinc-950 transition-colors">
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {store.image ? (
              <img src={store.image} alt={store.name} className="w-8 h-8 rounded-lg object-cover" />
            ) : (
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">J</div>
            )}
            <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm truncate max-w-[120px]">{store.name}</span>
          </div>
          <div className="flex items-center gap-4">
            <nav className="flex items-center gap-6">
              <a href={`/s/${slug}`} className="text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Inicio</a>
              <a href={`/s/${slug}/products`} className="text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Productos</a>
              <a href={`/s/${slug}/services`} className="text-xs font-medium text-red-600">Servicios</a>
            </nav>
            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700" />
            <span className="text-[10px] font-wallpoet tracking-[0.2em] text-red-600 hidden sm:block">JANDOSOFT</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center space-y-4 mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Nuestros <span className="text-red-600">Servicios</span></h1>
          <p className="text-zinc-400 dark:text-zinc-500 font-medium text-xs uppercase tracking-widest">Conoce lo que ofrecemos</p>
        </div>

        {services.length === 0 ? (
          <div className="py-24 text-center">
            <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-3xl flex items-center justify-center mx-auto mb-6"><Briefcase className="w-10 h-10 text-zinc-300 dark:text-zinc-600" /></div>
            <p className="text-lg font-bold text-zinc-300 dark:text-zinc-600 tracking-wider">Próximamente</p>
            <p className="text-xs text-zinc-300 dark:text-zinc-600 font-medium mt-2">Este negocio aún no ha publicado servicios.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {services.map((s: any) => (
              <div key={s.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 space-y-4 hover:shadow-lg hover:border-red-200 dark:hover:border-red-800 transition-all group">
                <div className="w-12 h-12 bg-red-50 dark:bg-red-900/30 rounded-xl flex items-center justify-center text-red-600 group-hover:bg-red-600 group-hover:text-white transition-all">
                  <Briefcase className="w-5 h-5" />
                </div>
                <p className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">{s.name}</p>
                {s.desc && <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{s.desc}</p>}
                {s.price && <p className="text-2xl sm:text-3xl font-bold text-red-600">{symbol}{s.price.toFixed(2)}</p>}
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-10">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
            {store.name} &mdash; Potenciado por <span className="font-wallpoet tracking-[0.2em] text-red-600">JANDOSOFT</span>
          </p>
        </div>
      </footer>
      <TrackingWrapper slug={slug} />
    </div>
    </ThemeProvider>
  );
}
