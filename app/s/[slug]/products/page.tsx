import { Metadata } from "next";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import { Store } from "@/lib/models/Store";
import { slugify } from "@/lib/utils";
import { Package } from "lucide-react";
import TrackingWrapper from "@/components/TrackingWrapper";

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

      <main className="max-w-6xl mx-auto px-4 max-[340px]:px-2.5 py-12">
        <div className="text-center space-y-4 mb-16">
          <h1 className="text-4xl md:text-5xl font-black italic text-zinc-950 uppercase tracking-tighter">Catálogo de <span className="text-red-600">Productos</span></h1>
          <p className="text-zinc-400 font-bold text-xs uppercase tracking-widest italic">{products.length} productos disponibles</p>
        </div>

        {products.length === 0 ? (
          <div className="py-24 text-center">
            <div className="w-20 h-20 bg-zinc-50 rounded-3xl flex items-center justify-center mx-auto mb-6"><Package className="w-10 h-10 text-zinc-300" /></div>
            <p className="text-lg font-black italic text-zinc-300 uppercase tracking-wider">Próximamente</p>
            <p className="text-xs text-zinc-200 font-bold italic mt-2">Este negocio aún no ha publicado productos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {products.map((p: any) => (
              <div key={p.id} className="bg-white rounded-[2rem] max-[340px]:rounded-[1.5rem] border border-zinc-100 shadow-sm overflow-hidden hover:shadow-xl hover:border-red-600/20 transition-all group">
                <div className="aspect-[4/3] bg-zinc-50 overflow-hidden">
                  {p.images?.[0] ? (
                    <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-300">
                      <Package className="w-12 h-12" />
                    </div>
                  )}
                </div>
                <div className="p-5 max-[340px]:p-4 space-y-3">
                  <p className="text-base sm:text-lg font-black italic text-zinc-950 uppercase tracking-tighter">{p.name}</p>
                  {p.images && p.images.length > 1 && (
                    <div className="flex gap-1">
                      {p.images.slice(0, 3).map((img: string, i: number) => (
                        <div key={i} className="w-6 h-6 rounded-md overflow-hidden border border-zinc-200 bg-zinc-50">
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                      {p.images.length > 3 && (
                        <div className="w-6 h-6 rounded-md bg-zinc-100 flex items-center justify-center text-[7px] font-black text-zinc-400 italic">+{p.images.length - 3}</div>
                      )}
                    </div>
                  )}
                  {p.stock !== undefined && (
                    <p className="text-[9px] sm:text-[10px] font-bold text-zinc-400 uppercase tracking-widest italic">
                      Stock: {p.stock} {p.stock === 1 ? "unidad" : "unidades"}
                    </p>
                  )}
                  <p className="text-2xl sm:text-3xl font-black italic tracking-tighter text-red-600">${p.price?.toFixed(2)}</p>
                </div>
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
