import { Metadata } from "next";
import { notFound } from "next/navigation";
import { StorePublicAI } from "./StorePublicAI";
import TrackingWrapper from "@/components/TrackingWrapper";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getStore(slug: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/stores/public/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.store || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const store = await getStore(slug);
  if (!store) return { title: "Tienda no encontrada" };
  return {
    title: store.name,
    description: store.desc || `Conoce ${store.name} en Jandosoft`,
    openGraph: { title: store.name, description: store.desc || "" },
  };
}

export default async function StoreMainPage({ params }: Props) {
  const { slug } = await params;
  const store = await getStore(slug);
  if (!store) notFound();

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-zinc-100 bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 max-[340px]:px-2.5 h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 shrink-0">
            {store.image ? (
              <img src={store.image} alt={store.name} className="w-8 h-8 rounded-lg object-cover shrink-0" />
            ) : (
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white font-black text-xs shrink-0">J</div>
            )}
            <span className="font-black italic text-zinc-950 tracking-tight text-xs sm:text-sm max-[350px]:hidden truncate max-w-[80px]">{store.name}</span>
          </div>
          <nav className="flex items-center gap-3 sm:gap-6 max-[340px]:gap-2 shrink-0">
            <a href={`/s/${slug}`} className="text-[10px] max-[340px]:text-[8.5px] sm:text-xs font-black italic text-red-600 uppercase tracking-wider">Inicio</a>
            <a href={`/s/${slug}/products`} className="text-[10px] max-[340px]:text-[8.5px] sm:text-xs font-black italic text-zinc-500 hover:text-zinc-950 uppercase tracking-wider transition-colors">Productos</a>
            <a href={`/s/${slug}/services`} className="text-[10px] max-[340px]:text-[8.5px] sm:text-xs font-black italic text-zinc-500 hover:text-zinc-950 uppercase tracking-wider transition-colors">Servicios</a>
            <a href={`/s/${slug}/contact`} className="text-[10px] max-[340px]:text-[8.5px] sm:text-xs font-black italic text-zinc-500 hover:text-zinc-950 uppercase tracking-wider transition-colors">Contacto</a>
          </nav>
        </div>
      </header>

      <main>
        <section className="max-w-6xl mx-auto px-4 max-[340px]:px-2.5 py-12 md:py-32">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            {store.image && (
              <div className="flex justify-center">
                <img src={store.image} alt={store.name} className="w-24 h-24 md:w-32 md:h-32 rounded-[2rem] object-cover border-4 border-white shadow-2xl mx-auto" />
              </div>
            )}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-full text-xs font-black border border-red-100 italic">
              {store.industry}
            </div>
            <h1 className="text-5xl md:text-7xl font-black italic text-zinc-950 leading-[1.1] tracking-tighter uppercase">
              {store.name}
            </h1>
            {store.desc && (
              <p className="text-lg md:text-xl text-zinc-500 font-medium leading-relaxed max-w-2xl mx-auto">
                {store.desc}
              </p>
            )}
            <div className="flex items-center justify-center gap-2 text-sm text-zinc-400 font-bold italic">
              Desde {new Date(store.createdAt).toLocaleDateString("es", { year: "numeric", month: "long" })}
            </div>
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <a href={`/s/${slug}/products`} className="px-10 py-5 bg-red-600 text-white rounded-2xl font-black text-lg hover:bg-red-700 transition-all shadow-2xl shadow-red-200 active:scale-95 italic tracking-wider inline-flex items-center gap-3">
                VER PRODUCTOS
              </a>
              <a href={`/s/${slug}/contact`} className="px-10 py-5 bg-zinc-50 text-zinc-950 rounded-2xl font-black text-lg hover:bg-zinc-100 transition-all shadow-sm active:scale-95 italic tracking-wider border border-zinc-200 inline-flex items-center gap-3">
                CONTACTAR
              </a>
            </div>
          </div>
        </section>

        {store.publicAI && (
          <section className="max-w-6xl mx-auto px-4 max-[340px]:px-2.5 pb-20">
            <StorePublicAI storeId={store._id} storeName={store.name} industry={store.industry} />
          </section>
        )}
      </main>

      <footer className="border-t border-zinc-100 py-10">
        <div className="max-w-6xl mx-auto px-6 text-center space-y-2">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest italic">
            {store.name} &mdash; Potenciado por <span className="text-red-600">Jandosoft</span>
          </p>
        </div>
      </footer>
      <TrackingWrapper slug={slug} />
    </div>
  );
}
