"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShoppingCart, Share2, QrCode, ChevronLeft, ChevronRight, CheckCircle, MessageCircle } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useRef } from "react";
import type { PublicPageTranslations } from "@/lib/i18n/public-store";

interface Product {
  id: number;
  name: string;
  price: number;
  stock?: number;
  desc?: string;
  barcode?: string;
  images?: string[];
  currency?: string;
  priceUSD?: number;
}

interface StoreData {
  slug: string;
  name: string;
  phone: string;
  email: string;
  currency: string;
}

interface Props {
  product: Product;
  store: StoreData;
  t: PublicPageTranslations;
  primary: string;
}

function getCurrencySymbol(currency: string) {
  switch (currency) {
    case "MXN": return "$";
    case "COP": return "$";
    case "ARS": return "$";
    default: return "$";
  }
}

function formatPrice(price: number, currency: string) {
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${price.toLocaleString()}`;
}

function ProductDefaultImage({ name, primary }: { name: string; primary: string }) {
  const initial = name?.charAt(0)?.toUpperCase() || "?";
  return (
    <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${primary}15, ${primary}08)` }}>
      <span className="text-4xl font-bold" style={{ color: primary }}>{initial}</span>
    </div>
  );
}

export default function ProductDetailClient({ product, store, t, primary }: Props) {
  const [currentImage, setCurrentImage] = useState(0);
  const [showQR, setShowQR] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const qrRef = useRef<HTMLCanvasElement>(null);
  const images = product.images?.length ? product.images : [];
  const hasImages = images.length > 0;
  const isOutOfStock = (product.stock ?? 0) <= 0;
  const productUrl = typeof window !== "undefined" ? window.location.href : "";

  useEffect(() => {
    if (showQR && qrRef.current && productUrl) {
      QRCode.toCanvas(qrRef.current, productUrl, {
        width: 200,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      }).catch(() => {});
    }
  }, [showQR, productUrl]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, text: product.desc || product.name, url: productUrl });
      } catch {}
    } else {
      navigator.clipboard.writeText(productUrl);
    }
  };

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(`Hola, me interesa el producto: ${product.name} (${formatPrice(product.price, store.currency)})`);
    window.open(`https://wa.me/${store.phone.replace(/\D/g, "")}?text=${msg}`, "_blank");
  };

  const handleAddToCart = () => {
    const evt = new CustomEvent("add-to-cart", { detail: { product: { ...product, quantity: 1 } } });
    window.dispatchEvent(evt);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-zinc-100">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href={`/s/${store.slug}/products`} className="flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-950 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            {store.name}
          </Link>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowQR(!showQR)} className="p-2 rounded-xl hover:bg-zinc-100 transition-colors" title="Código QR">
              <QrCode className="w-5 h-5 text-zinc-500" />
            </button>
            <button onClick={handleShare} className="p-2 rounded-xl hover:bg-zinc-100 transition-colors" title="Compartir">
              <Share2 className="w-5 h-5 text-zinc-500" />
            </button>
          </div>
        </div>
      </div>

      {showQR && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowQR(false)}>
          <div className="bg-white rounded-3xl p-8 max-w-xs w-full text-center shadow-2xl" onClick={e => e.stopPropagation()}>
            <QrCode className="w-8 h-8 mx-auto mb-3" style={{ color: primary }} />
            <p className="text-sm font-bold text-zinc-950 mb-1">{product.name}</p>
            <p className="text-[10px] text-zinc-400 mb-4">Escanea para ver este producto</p>
            <canvas ref={qrRef} className="mx-auto rounded-xl" />
            <button onClick={() => setShowQR(false)} className="mt-4 text-xs font-bold text-zinc-400 hover:text-zinc-600">Cerrar</button>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <div className="relative aspect-square rounded-3xl overflow-hidden bg-zinc-50 border border-zinc-100">
              {hasImages ? (
                <>
                  <img src={images[currentImage]} alt={product.name} className="w-full h-full object-cover" />
                  {images.length > 1 && (
                    <>
                      <button onClick={() => setCurrentImage(p => (p - 1 + images.length) % images.length)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur rounded-full shadow-lg hover:bg-white transition-all">
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button onClick={() => setCurrentImage(p => (p + 1) % images.length)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur rounded-full shadow-lg hover:bg-white transition-all">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <ProductDefaultImage name={product.name} primary={primary} />
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setCurrentImage(i)}
                    className={"shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all " + (i === currentImage ? "border-current shadow-md" : "border-transparent opacity-60 hover:opacity-100")}
                    style={i === currentImage ? { borderColor: primary } : {}}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-zinc-950 leading-tight">{product.name}</h1>
              {product.barcode && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] font-mono bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full">{product.barcode}</span>
                </div>
              )}
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black" style={{ color: primary }}>{formatPrice(product.price, store.currency)}</span>
              {product.priceUSD && product.currency !== "USD" && (
                <span className="text-sm text-zinc-400">≈ ${product.priceUSD?.toFixed(2)} USD</span>
              )}
            </div>

            {product.desc && (
              <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-line">{product.desc}</p>
            )}

            <div className="flex items-center gap-2">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${isOutOfStock ? "bg-zinc-100 text-zinc-400" : "bg-emerald-50 text-emerald-600"}`}>
                {isOutOfStock ? (
                  <>Agotado</>
                ) : (
                  <><CheckCircle className="w-3.5 h-3.5" /> Disponible ({product.stock} en stock)</>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-white shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ backgroundColor: primary, boxShadow: `0 8px 24px ${primary}30` }}
              >
                {addedToCart ? (
                  <><CheckCircle className="w-5 h-5" /> Agregado</>
                ) : (
                  <><ShoppingCart className="w-5 h-5" /> Agregar al Carrito</>
                )}
              </button>

              {store.phone && (
                <button onClick={handleWhatsApp}
                  className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest bg-emerald-500 text-white shadow-xl shadow-emerald-100 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2">
                  <MessageCircle className="w-5 h-5" /> Consultar por WhatsApp
                </button>
              )}
            </div>

            <div className="pt-4 border-t border-zinc-100">
              <p className="text-[10px] text-zinc-300 text-center">Vendido por {store.name}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
