import { Metadata } from "next";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import { Store } from "@/lib/models/Store";
import { slugify } from "@/lib/utils";
import { Mail, MapPin } from "lucide-react";
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
  return { title: "Contacto - " + store.name, description: "Contacta con " + store.name };
}

export default async function ContactPage({ params }: Props) {
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
            <a href={"/s/" + slug} className="text-[10px] max-[340px]:text-[8.5px] sm:text-xs font-black italic text-zinc-500 hover:text-zinc-950 uppercase tracking-wider transition-colors">Inicio</a>
            <a href={"/s/" + slug + "/products"} className="text-[10px] max-[340px]:text-[8.5px] sm:text-xs font-black italic text-zinc-500 hover:text-zinc-950 uppercase tracking-wider transition-colors">Productos</a>
            <a href={"/s/" + slug + "/services"} className="text-[10px] max-[340px]:text-[8.5px] sm:text-xs font-black italic text-zinc-500 hover:text-zinc-950 uppercase tracking-wider transition-colors">Servicios</a>
            <a href={"/s/" + slug + "/contact"} className="text-[10px] max-[340px]:text-[8.5px] sm:text-xs font-black italic text-red-600 uppercase tracking-wider">Contacto</a>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 max-[340px]:px-2.5 py-12">
        <div className="text-center space-y-4 mb-16">
          <h1 className="text-4xl md:text-5xl font-black italic text-zinc-950 uppercase tracking-tighter">Contacta con <span className="text-red-600">{store.name}</span></h1>
          <p className="text-zinc-400 font-bold text-xs uppercase tracking-widest italic">Estamos aqui para ayudarte</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          <div className="bg-white rounded-[2rem] max-[340px]:rounded-[1.5rem] border border-zinc-100 shadow-sm p-6 max-[340px]:p-4 space-y-4 text-center hover:shadow-lg transition-all">
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto text-red-600">
              <Mail className="w-5 h-5" />
            </div>
            <p className="font-black italic text-zinc-950">Email</p>
            <p className="text-xs sm:text-sm text-zinc-500 font-medium">{store.ownerEmail || "No disponible"}</p>
          </div>

          <div className="bg-white rounded-[2rem] max-[340px]:rounded-[1.5rem] border border-zinc-100 shadow-sm p-6 max-[340px]:p-4 space-y-4 text-center hover:shadow-lg transition-all">
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto text-red-600">
              <MapPin className="w-5 h-5" />
            </div>
            <p className="font-black italic text-zinc-950">Industria</p>
            <p className="text-xs sm:text-sm text-zinc-500 font-medium">{store.industry || "No especificado"}</p>
          </div>
        </div>
      </main>

      <footer className="border-t border-zinc-100 py-10">
        <div className="max-w-6xl mx-auto px-6 text-center text-[10px] font-bold text-zinc-400 uppercase tracking-widest italic">
          {store.name} &mdash; Potenciado por <span className="text-red-600">Jandosoft</span>
        </div>
      </footer>
      <TrackingWrapper slug={slug} />
    </div>
  );
}
