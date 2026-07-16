"use client";

import { motion } from "framer-motion";
import { ShoppingCart, Package, Check } from "lucide-react";
import ProductDefaultImage from "./ProductDefaultImage";
import { useCart } from "./public/CartProvider";
import { getCurrencySymbol } from "@/lib/utils/currency";
import { useState } from "react";

interface Product {
  id: number;
  name: string;
  price: number;
  stock?: number;
  images?: string[];
  desc?: string;
  currency?: string;
  priceUSD?: number;
}

export default function StoreProductFeed({
  products, storeName, slug, storeId, paymentsEnabled, storeCurrency = "USD"
}: {
  products: Product[]; storeName: string; slug: string; storeId?: string; paymentsEnabled?: boolean; storeCurrency?: string;
}) {
  const { addItem } = useCart();
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());

  const symbol = getCurrencySymbol(storeCurrency);

  const handleAddToCart = (p: Product) => {
    addItem({
      id: p.id,
      name: p.name,
      price: p.priceUSD || p.price,
      quantity: 1,
      image: p.images?.[0],
      stock: p.stock,
    });
    setAddedIds(prev => new Set(prev).add(p.id));
    setTimeout(() => {
      setAddedIds(prev => {
        const next = new Set(prev);
        next.delete(p.id);
        return next;
      });
    }, 1500);
  };

  if (products.length === 0) {
    return (
      <div className="py-24 text-center">
        <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Package className="w-10 h-10 text-zinc-400 dark:text-zinc-500" />
        </div>
        <p className="text-lg font-bold text-zinc-400 dark:text-zinc-500">Próximamente</p>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">Este negocio aún no ha publicado productos.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 max-w-4xl mx-auto">
      {products.map((p) => {
        const images = p.images?.filter(Boolean) || [];
        const isAdded = addedIds.has(p.id);
        return (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden hover:shadow-lg hover:border-red-200 dark:hover:border-red-900 transition-all"
          >
            <div className="aspect-[4/3] bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden group">
              {images[0] ? (
                <img src={images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <ProductDefaultImage name={p.name} />
              )}
              {images.length > 1 && (
                <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 text-white text-[9px] font-semibold rounded-lg backdrop-blur-sm">
                  +{images.length - 1}
                </div>
              )}
            </div>
            <div className="p-4 md:p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 flex-1 min-w-0">
                  <h3 className="text-sm md:text-base font-bold text-zinc-900 dark:text-zinc-100 leading-tight truncate">{p.name}</h3>
                  {p.desc && (
                    <p className="text-[11px] md:text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-2">{p.desc}</p>
                  )}
                </div>
                <span className="text-lg md:text-xl font-bold text-red-600 shrink-0 whitespace-nowrap">{symbol}{(p.priceUSD || p.price)?.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-3 text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
                  {p.stock !== undefined && (
                    <span className={p.stock > 0 ? "text-emerald-600" : "text-rose-600"}>
                      {p.stock > 0 ? `${p.stock} en stock` : "Agotado"}
                    </span>
                  )}
                </div>
                {p.stock !== 0 && (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAddToCart(p)}
                    disabled={isAdded}
                    className={`px-3.5 md:px-4 py-2 rounded-xl font-semibold text-[10px] md:text-xs flex items-center gap-1.5 transition-all ${
                      isAdded
                        ? "bg-emerald-600 text-white shadow-md"
                        : "bg-red-600 text-white hover:bg-red-700 shadow-md"
                    }`}
                  >
                    {isAdded ? (
                      <><Check className="w-3 h-3" /> AGREGADO</>
                    ) : (
                      <><ShoppingCart className="w-3 h-3" /> AGREGAR</>
                    )}
                  </motion.button>
                )}
                {p.stock === 0 && (
                  <span className="text-[10px] font-semibold text-rose-600">Agotado</span>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
