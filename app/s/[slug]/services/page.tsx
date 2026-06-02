import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Briefcase } from "lucide-react";
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
  return { title: `Servicios - ${store.name}`, description: `Servicios ofrecidos por ${store.name}` };
}

export default async function ServicesPage({ params }: Props) {
  const { slug } = await params;
  const store = await getStore(slug);
  if (!store) notFound();

  const services = (store as any).services || [];

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
            <a href={`/s/${slug}`} className="text-[10px] max-[340px]:text-[8.5px] sm:text-xs font-black italic text-zinc-500 hover:text-zinc-950 uppercase tracking-wider transition-colors">Inicio</a>
            <a href={`/s/${slug}/products`} className="text-[10px] max-[340px]:text-[8.5px] sm:text-xs font-black italic text-zinc-500 hover:text-zinc-950 uppercase tracking-wider transition-colors">Productos</a>
            <a href={`/s/${slug}/services`} className="text-[10px] max-[340px]:text-[8.5px] sm:text-xs font-black italic text-red-600 uppercase tracking-wider">Servicios</a>
            <a href={`/s/${slug}/contact`} className="text-[10px] max-[340px]:text-[8.5px] sm:text-xs font-black italic text-zinc-500 hover:text-zinc-950 uppercase tracking-wider transition-colors">Contacto</a>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 max-[340px]:px-2.5 py-12">
        <div className="text-center space-y-4 mb-16">
          <h1 className="text-4xl md:text-5xl font-black italic text-zinc-950 uppercase tracking-tighter">Nuestros <span className="text-red-600">Servicios</span></h1>
          <p className="text-zinc-400 font-bold text-xs uppercase tracking-widest italic">Conoce lo que ofrecemos</p>
        </div>

        {services.length === 0 ? (
          <div className="py-24 text-center">
            <div className="w-20 h-20 bg-zinc-50 rounded-3xl flex items-center justify-center mx-auto mb-6"><Briefcase className="w-10 h-10 text-zinc-300" /></div>
            <p className="text-lg font-black italic text-zinc-300 uppercase tracking-wider">Próximamente</p>
            <p className="text-xs text-zinc-200 font-bold italic mt-2">Este negocio aún no ha publicado servicios.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {services.map((s: any) => (
              <div key={s.id} className="bg-white rounded-[2rem] max-[340px]:rounded-[1.5rem] border border-zinc-100 shadow-sm p-6 max-[340px]:p-4 space-y-4 hover:shadow-xl hover:border-red-600/20 transition-all group">
                <div className="w-12 h-12 bg-zinc-50 rounded-xl flex items-center justify-center text-red-600 group-hover:bg-red-600 group-hover:text-white transition-all shadow-md">
                  <Briefcase className="w-5 h-5" />
                </div>
                <p className="text-base sm:text-lg font-black italic text-zinc-950 uppercase tracking-tighter">{s.name}</p>
                {s.desc && <p className="text-xs sm:text-sm text-zinc-500 font-medium leading-relaxed">{s.desc}</p>}
                {s.price && <p className="text-2xl sm:text-3xl font-black italic tracking-tighter text-red-600">${s.price.toFixed(2)}</p>}
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-zinc-100 py-10">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest italic">
            {store.name} &mdash; Potenciado por <span className="text-red-600">Jandosoft</span>
          </p>
        </div>
      </footer>
      <TrackingWrapper slug={slug} />
    </div>
  );
}
