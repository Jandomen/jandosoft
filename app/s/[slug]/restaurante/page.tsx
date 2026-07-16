import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicStore } from "@/lib/store-utils";
import { ThemeProvider } from "@/components/public/ThemeProvider";
import type { Language } from "@/lib/i18n/translations";
import RestaurantExperience from "./RestaurantExperience";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ table?: string; tab?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const store = await getPublicStore(slug);
  if (!store) return { title: "Restaurante no encontrado" };
  return {
    title: `${store.name} - Restaurante`,
    description: `Menú, pedidos y reservaciones de ${store.name}`,
    openGraph: {
      title: `${store.name} - Restaurante`,
      description: `Menú, pedidos y reservaciones de ${store.name}`,
      images: store.image ? [store.image] : [],
    },
  };
}

export default async function RestaurantPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const store = await getPublicStore(slug);
  if (!store) notFound();

  const locale = ((store as any).agentConfig?.lang as Language) || "es";
  const storeCurrency = (store as any).currency || "USD";

  return (
    <ThemeProvider>
      <RestaurantExperience
        store={JSON.parse(JSON.stringify(store))}
        tableNumber={sp.table ? Number(sp.table) : undefined}
        initialTab={sp.tab || "menu"}
        currency={storeCurrency}
      />
    </ThemeProvider>
  );
}
