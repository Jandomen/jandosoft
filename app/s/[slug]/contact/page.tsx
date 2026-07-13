import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicStore } from "@/lib/store-utils";
import { Mail, MapPin } from "lucide-react";
import TrackingWrapper from "@/components/TrackingWrapper";
import { ThemeProvider } from "@/components/public/ThemeProvider";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const store = await getPublicStore(slug);
  if (!store) return { title: "Empresa no encontrada" };
  return { title: "Contacto - " + store.name, description: "Contacta con " + store.name };
}

export default async function ContactPage({ params }: Props) {
  const { slug } = await params;
  const store = await getPublicStore(slug);
  if (!store) notFound();

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
              <a href={"/s/" + slug} className="text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Inicio</a>
              <a href={"/s/" + slug + "/products"} className="text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Productos</a>
              <a href={"/s/" + slug + "/services"} className="text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Servicios</a>
            </nav>
            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700" />
            <span className="text-[10px] font-wallpoet tracking-[0.2em] text-red-600 hidden sm:block">JANDOSOFT</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center space-y-4 mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Contacta con <span className="text-red-600">{store.name}</span></h1>
          <p className="text-zinc-400 dark:text-zinc-500 font-medium text-xs uppercase tracking-widest">Estamos aqui para ayudarte</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 space-y-4 text-center hover:shadow-lg transition-all">
            <div className="w-12 h-12 bg-red-50 dark:bg-red-900/30 rounded-xl flex items-center justify-center mx-auto text-red-600">
              <Mail className="w-5 h-5" />
            </div>
            <p className="font-bold text-zinc-900 dark:text-zinc-100">Email</p>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">{store.ownerEmail || "No disponible"}</p>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 space-y-4 text-center hover:shadow-lg transition-all">
            <div className="w-12 h-12 bg-red-50 dark:bg-red-900/30 rounded-xl flex items-center justify-center mx-auto text-red-600">
              <MapPin className="w-5 h-5" />
            </div>
            <p className="font-bold text-zinc-900 dark:text-zinc-100">Industria</p>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">{store.industry || "No especificado"}</p>
          </div>
        </div>
      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-10">
        <div className="max-w-6xl mx-auto px-6 text-center text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
          {store.name} &mdash; Potenciado por <span className="font-wallpoet tracking-[0.2em] text-red-600">JANDOSOFT</span>
        </div>
      </footer>
      <TrackingWrapper slug={slug} />
    </div>
    </ThemeProvider>
  );
}
