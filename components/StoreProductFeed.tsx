"use client";

import { motion } from "framer-motion";
import { ShoppingCart, Package, Check } from "lucide-react";
import ProductDefaultImage from "./ProductDefaultImage";
import { useCart } from "./public/CartProvider";
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
  products, storeName, slug, storeId, paymentsEnabled
}: {
  products: Product[]; storeName: string; slug: string; storeId?: string; paymentsEnabled?: boolean;
}) {
  const { addItem } = useCart();
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());

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
        <div className="w-20 h-20 bg-zinc-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Package className="w-10 h-10 text-zinc-300" />
        </div>
        <p className="text-lg font-black italic text-zinc-300 uppercase tracking-wider">Próximamente</p>
        <p className="text-xs text-zinc-200 font-bold italic mt-2">Este negocio aún no ha publicado productos.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 md:space-y-6">
      {products.map((p) => {
        const images = p.images?.filter(Boolean) || [];
        const isAdded = addedIds.has(p.id);
        return (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl md:rounded-[2rem] border border-zinc-100 shadow-sm overflow-hidden hover:shadow-lg hover:border-zinc-200 transition-all"
          >
            <div className="aspect-[16/10] md:aspect-[16/9] bg-zinc-50 relative overflow-hidden group">
              {images[0] ? (
                <img src={images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <ProductDefaultImage name={p.name} />
              )}
              {images.length > 1 && (
                <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 text-white text-[9px] font-black italic rounded-lg backdrop-blur-sm">
                  +{images.length - 1}
                </div>
              )}
            </div>
            <div className="p-4 md:p-6 space-y-3 md:space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="text-base md:text-lg font-black italic text-zinc-950 leading-tight">{p.name}</h3>
                  {p.desc && (
                    <p className="text-[11px] md:text-xs text-zinc-500 font-medium leading-relaxed line-clamp-2">{p.desc}</p>
                  )}
                </div>
                <span className="text-xl md:text-2xl font-black italic text-red-600 shrink-0 whitespace-nowrap">${(p.priceUSD || p.price)?.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-[9px] md:text-[10px] font-bold text-zinc-400 uppercase italic tracking-wider">
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
                    className={`px-4 md:px-5 py-2.5 rounded-xl font-black italic text-[10px] md:text-xs flex items-center gap-2 transition-all ${
                      isAdded
                        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200"
                        : "bg-zinc-950 text-white hover:bg-zinc-800 shadow-lg"
                    }`}
                  >
                    {isAdded ? (
                      <><Check className="w-3.5 h-3.5" /> AGREGADO</>
                    ) : (
                      <><ShoppingCart className="w-3.5 h-3.5" /> AGREGAR AL CARRITO</>
                    )}
                  </motion.button>
                )}
                {p.stock === 0 && (
                  <span className="text-[10px] font-black italic text-rose-600 uppercase">Agotado</span>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
