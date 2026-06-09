import { Metadata } from "next";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import { Store } from "@/lib/models/Store";
import { slugify } from "@/lib/utils";
import { StorePublicAI } from "./StorePublicAI";
import TrackingWrapper from "@/components/TrackingWrapper";
import { ThemeProvider } from "@/components/public/ThemeProvider";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getStore(slug: string) {
  try {
    await connectDB();
    let store = await Store.findOne({ slug }).lean();
    if (!store) {
      store = await Store.findOne({
        name: { $regex: new RegExp("^" + slug.replace(/-/g, "[- ]") + "$", "i") }
      }).lean();
      if (store && !store.slug) {
        const newSlug = slugify(store.name || "tienda");
        await Store.updateOne({ _id: store._id }, { $set: { slug: newSlug } }).catch(() => {});
        (store as any).slug = newSlug;
      }
    }
    if (!store) {
      const nameVariation = slug.replace(/-/g, " ");
      store = await Store.findOne({ name: { $regex: new RegExp("^" + nameVariation + "$", "i") } }).lean();
    }
    if (!store) return null;
    const { customers, orders, stripeAccountId, paymentsEnabled, platformFeePercent, ...publicData } = store as any;
    return publicData;
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

  if (store.isSuspended) {
    return (
      <ThemeProvider>
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-md mx-auto text-center px-6 space-y-6">
          <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 rounded-[2rem] flex items-center justify-center mx-auto">
            <svg className="w-10 h-10 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-black italic text-zinc-950 uppercase">Tienda Suspendida</h1>
          <p className="text-zinc-500 font-medium text-base">
            {store.suspensionReason || "Esta tienda ha sido suspendida por violar nuestros términos de servicio."}
          </p>
          <div className="pt-4">
            <a href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 rounded-xl text-xs font-black italic uppercase hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all">
              Volver al inicio
            </a>
          </div>
        </div>
      </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
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
                <img src={store.image} alt={store.name} className="w-24 h-24 md:w-32 md:h-32 rounded-[2rem] object-cover border-4 border-white dark:border-zinc-700 shadow-2xl mx-auto" />
              </div>
            )}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/30 text-red-600 rounded-full text-xs font-black border border-red-100 dark:border-red-900/50 italic">
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
            <div className="flex items-center justify-center gap-2 text-sm text-zinc-500 font-bold italic">
              Desde {new Date(store.createdAt).toLocaleDateString("es", { year: "numeric", month: "long" })}
            </div>
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <a href={`/s/${slug}/products`} className="px-10 py-5 bg-red-600 text-white rounded-2xl font-black text-lg hover:bg-red-700 transition-all shadow-2xl shadow-red-200 dark:shadow-red-900/30 active:scale-95 italic tracking-wider inline-flex items-center gap-3">
                VER PRODUCTOS
              </a>
              <a href={`/s/${slug}/contact`} className="px-10 py-5 bg-zinc-50 text-zinc-950 rounded-2xl font-black text-lg hover:bg-muted transition-all shadow-sm active:scale-95 italic tracking-wider border border-zinc-100 inline-flex items-center gap-3">
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
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest italic">
            {store.name} &mdash; Potenciado por <span className="text-red-600">Jandosoft</span>
          </p>
        </div>
      </footer>
      <TrackingWrapper slug={slug} />
    </div>
    </ThemeProvider>
  );
}
