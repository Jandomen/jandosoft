import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicStore } from "@/lib/store-utils";
import TrackingWrapper from "@/components/TrackingWrapper";
import StoreProductClient from "@/components/public/StoreProductClient";
import { ThemeProvider } from "@/components/public/ThemeProvider";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const store = await getPublicStore(slug);
  if (!store) return { title: "Empresa no encontrada" };
  return { title: `Productos - ${store.name}`, description: `Catálogo de productos de ${store.name}` };
}

export default async function ProductsPage({ params }: Props) {
  const { slug } = await params;
  const store = await getPublicStore(slug);
  if (!store) notFound();

  const products = store.products || [];

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
              <a href={`/s/${slug}/products`} className="text-xs font-medium text-red-600">Productos</a>
              <a href={`/s/${slug}/services`} className="text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Servicios</a>
            </nav>
            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700" />
            <span className="text-[10px] font-wallpoet tracking-[0.2em] text-red-600 hidden sm:block">JANDOSOFT</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10 md:py-16">
        <div className="text-center space-y-3 mb-10 md:mb-14">
          <h1 className="text-3xl md:text-5xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            {store.name} <span className="text-red-600">Productos</span>
          </h1>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium uppercase tracking-widest">
            {products.length} {products.length === 1 ? "producto disponible" : "productos disponibles"}
          </p>
        </div>

        <StoreProductClient products={products} storeName={store.name} slug={slug} storeId={store._id?.toString()} paymentsEnabled={store.paymentsEnabled} />
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
