import { Metadata } from "next";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import { Store } from "@/lib/models/Store";
import { slugify } from "@/lib/utils";
import TrackingWrapper from "@/components/TrackingWrapper";
import StoreProductClient from "@/components/public/StoreProductClient";

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
    const { customers, orders, stripeAccountId, platformFeePercent, ...publicData } = store as any;
    return { ...publicData, paymentsEnabled: (store as any).paymentsEnabled };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const store = await getStore(slug);
  if (!store) return { title: "Tienda no encontrada" };
  return { title: `Productos - ${store.name}`, description: `Catálogo de productos de ${store.name}` };
}

export default async function ProductsPage({ params }: Props) {
  const { slug } = await params;
  const store = await getStore(slug);
  if (!store) notFound();

  const products = store.products || [];

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
            <a href={`/s/${slug}/products`} className="text-[10px] max-[340px]:text-[8.5px] sm:text-xs font-black italic text-red-600 uppercase tracking-wider">Productos</a>
            <a href={`/s/${slug}/services`} className="text-[10px] max-[340px]:text-[8.5px] sm:text-xs font-black italic text-zinc-500 hover:text-zinc-950 uppercase tracking-wider transition-colors">Servicios</a>
            <a href={`/s/${slug}/contact`} className="text-[10px] max-[340px]:text-[8.5px] sm:text-xs font-black italic text-zinc-500 hover:text-zinc-950 uppercase tracking-wider transition-colors">Contacto</a>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 max-[340px]:px-2.5 py-10 md:py-16">
        <div className="text-center space-y-3 mb-10 md:mb-14">
          <h1 className="text-3xl md:text-5xl font-black italic text-zinc-950 uppercase tracking-tighter">
            {store.name} <span className="text-red-600">Productos</span>
          </h1>
          <p className="text-[10px] md:text-xs text-zinc-400 font-bold uppercase tracking-widest italic">
            {products.length} {products.length === 1 ? "producto disponible" : "productos disponibles"}
          </p>
        </div>

        <StoreProductClient products={products} storeName={store.name} slug={slug} storeId={store._id?.toString()} paymentsEnabled={store.paymentsEnabled} />
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
