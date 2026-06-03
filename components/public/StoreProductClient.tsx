"use client";

import { CartProvider } from "./CartProvider";
import CartSidebar from "./CartSidebar";
import StoreProductFeed from "@/components/StoreProductFeed";

export default function StoreProductClient({
  products, storeName, slug, storeId, paymentsEnabled
}: {
  products: any[]; storeName: string; slug: string; storeId?: string; paymentsEnabled?: boolean;
}) {
  return (
    <CartProvider>
      <StoreProductFeed
        products={products}
        storeName={storeName}
        slug={slug}
        storeId={storeId}
        paymentsEnabled={paymentsEnabled}
      />
      <CartSidebar
        storeId={storeId}
        storeName={storeName}
        slug={slug}
        paymentsEnabled={paymentsEnabled}
      />
    </CartProvider>
  );
}
