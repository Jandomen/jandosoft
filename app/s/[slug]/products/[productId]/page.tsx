import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicStore } from "@/lib/store-utils";
import { getPublicPageTranslations } from "@/lib/i18n/public-store";
import type { Language } from "@/lib/i18n/translations";
import ProductDetailClient from "./ProductDetailClient";
import { ThemeProvider } from "@/components/public/ThemeProvider";

interface Props {
  params: Promise<{ slug: string; productId: string }>;
}

function getLocale(store: any): Language {
  return (store.agentConfig?.lang as Language) || "es";
}

function getPrimaryColor(store: any): string {
  return store.agentConfig?.primaryColor || "#dc2626";
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, productId } = await params;
  const store = await getPublicStore(slug);
  if (!store) return { title: "Producto no encontrado" };
  const product = store.products?.find((p: any) => p.id === parseInt(productId));
  if (!product) return { title: "Producto no encontrado" };
  const lang = getLocale(store);
  const t = await getPublicPageTranslations(lang);
  return {
    title: `${product.name} | ${store.name}`,
    description: product.desc || `${product.name} - ${store.name}`,
    openGraph: {
      title: product.name,
      description: product.desc || `${product.name} - ${store.name}`,
      images: product.images?.[0] ? [{ url: product.images[0], width: 800, height: 600 }] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug, productId } = await params;
  const store = await getPublicStore(slug);
  if (!store) notFound();

  const product = store.products?.find((p: any) => p.id === parseInt(productId));
  if (!product) notFound();

  const lang = getLocale(store);
  const t = await getPublicPageTranslations(lang);
  const primary = getPrimaryColor(store);
  const currency = store.currency || "USD";

  const storeData = {
    slug: store.slug,
    name: store.name,
    phone: store.phone || "",
    email: store.email || "",
    currency,
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-white" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <ProductDetailClient
          product={product}
          store={storeData}
          t={t}
          primary={primary}
        />
      </div>
    </ThemeProvider>
  );
}
