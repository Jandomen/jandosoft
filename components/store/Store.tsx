"use client";

import React, { useState, useMemo, useEffect } from "react";
import { 
  ShoppingCart, 
  Heart, 
  Package, 
  Star, 
  CreditCard, 
  ChevronRight, 
  CheckCircle2, 
  User, 
  Lock, 
  Plus, 
  Trash2, 
  Bitcoin, 
  Image as ImageIcon,
  Loader2,
  Calendar,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";

import { useToast } from "@/components/ui/Toast";
import { StripePaymentForm } from "./StripePaymentForm";

import { generateInvoicePDF } from "@/lib/pdf-utils";

const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

interface PaymentMethodConfig {
  key: string;
  name: string;
  enabled: boolean;
  locked?: boolean;
}

interface StoreProps {
  currency: string;
  products: any[];
  isPremium: boolean;
  isLogged: boolean;
  userEmail: string;
  onPaymentSuccess: (transaction: any) => void;
  paymentMethods?: PaymentMethodConfig[];
}

const DEFAULT_PAYMENT_METHODS: PaymentMethodConfig[] = [
  { key: "stripe", name: "Stripe", enabled: true, locked: true },
  { key: "nowpayments", name: "Crypto", enabled: true, locked: false },
];

const PAYMENT_ICONS: Record<string, { icon: React.ReactNode; label: string }> = {
  stripe: { icon: <CreditCard className="w-4 h-4" />, label: "STRIPE" },
  nowpayments: { icon: <Bitcoin className="w-4 h-4" />, label: "CRYPTO" },
  paypal: { icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106z"/><path d="M19.178 6.534c-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437z"/><path d="M18.694 6.088c-.84 4.318-3.744 5.81-7.468 5.81H9.06a.666.666 0 0 0-.656.563L7.2 18.729l-.443 2.812a.4.4 0 0 0 .395.463h2.602a.574.574 0 0 0 .566-.488l.022-.115.448-2.837.032-.175a.574.574 0 0 1 .566-.488h.356c2.29 0 4.084-.93 4.608-3.628.215-1.116.104-2.047-.437-2.682a2.364 2.364 0 0 0-.361-.37c.134-.013.28-.02.437-.02h1.255c.567 0 1.07.382 1.16.949z"/></svg>, label: "PAYPAL" },
  transfer: { icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>, label: "TRANSFER" },
};

function ProductImage({ images, alt, className, onClick }: { images?: string[]; alt: string; className?: string; onClick?: (e: React.MouseEvent) => void }) {
  const [hasError, setHasError] = useState(false);
  if (!images || images.length === 0 || hasError) {
    return (
      <div className={cn("w-full h-full flex items-center justify-center bg-zinc-100 text-zinc-300", className)} onClick={onClick}>
        <Package className="w-1/2 h-1/2" />
      </div>
    );
  }
  return <img src={images[0]} alt={alt} className={cn("w-full h-full object-cover", className)} onClick={onClick} onError={() => setHasError(true)} />;
}

function ProductThumb({ src, alt, onClick }: { src: string; alt: string; onClick?: () => void }) {
  const [hasError, setHasError] = useState(false);
  if (hasError) return null;
  return <img src={src} alt={alt} className="w-full h-full object-cover" onClick={onClick} onError={() => setHasError(true)} />;
}

export default function Store({ currency, products, isPremium, isLogged, userEmail, onPaymentSuccess, paymentMethods }: StoreProps) {
  const { showToast } = useToast();

  const [cart, setCart] = useState<any[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("stripe");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isBought, setIsBought] = useState(false);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [stripeError, setStripeError] = useState<string | null>(null);

  const total = useMemo(() => {
    return cart.reduce((sum, id) => {
      const product = products.find(p => p.id === id);
      return sum + (product?.price || 0);
    }, 0);
  }, [cart, products]);

  const addToCart = (id: any) => {
    setCart(prev => prev.includes(id) ? prev : [...prev, id]);
  };

  const handleCheckoutInitiation = async () => {
    setStripeError(null);
    setClientSecret(null);
    setIsProcessing(true);
    setShowCheckout(true);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: total,
          currency: currency.toLowerCase(),
          customerEmail: userEmail,
          customerName: userEmail?.split("@")[0] || "Cliente",
          description: cart.map(id => products.find(p => p.id === id)?.name || "Plan").join(", "),
        }),
      });

      const data = await res.json();
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
      } else {
        setStripeError(data.error || "Error al iniciar el pago");
      }
    } catch {
      setStripeError("Error de conexión al procesar el pago");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentSuccess = (paymentIntentId: string) => {
    const transaction = {
      id: paymentIntentId.slice(-12).toUpperCase(),
      date: new Date().toLocaleString(),
      userEmail: userEmail,
      amount: total,
      currency: currency,
      items: cart.map(id => products.find(p => p.id === id)?.name || "Plan"),
      paymentMethod: "stripe",
    };

    generateInvoicePDF(transaction);
    onPaymentSuccess(transaction);

    setShowCheckout(false);
    setClientSecret(null);
    setIsBought(true);
    showToast("¡Pago procesado exitosamente!", "success");
  };

  if (isBought) {
    return (
      <div className="flex flex-col items-center justify-center max-[400px]:p-6 p-12 md:p-20 bg-white max-[400px]:rounded-[2rem] rounded-[4rem] border border-zinc-100 shadow-3xl text-center max-w-2xl mx-auto italic overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500" />
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-8 shadow-xl shadow-emerald-50"><CheckCircle2 className="w-12 h-12" /></motion.div>
        <h3 className="max-[400px]:text-2xl text-4xl font-black mb-4 text-zinc-950 uppercase tracking-tighter italic">¡Compra Exitosa!</h3>
        <p className="text-zinc-500 mb-10 max-[400px]:text-sm text-lg font-medium leading-relaxed max-w-sm font-black italic">Tu pedido ha sido procesado vía <span className="text-red-600 uppercase font-black">{paymentMethod}</span>. Recibirás un correo en unos minutos.</p>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setIsBought(false); setCart([]); }} className="max-[400px]:px-8 max-[400px]:py-4 max-[400px]:text-base px-12 py-5 bg-red-600 text-white rounded-2xl font-black text-xl hover:bg-red-700 transition-all shadow-2xl shadow-red-200 uppercase tracking-widest italic">CONTINUAR EXPLORANDO</motion.button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-12 min-h-[700px] mb-20 italic">
      <div className="flex-1 space-y-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-2">
           <h2 className="max-[400px]:text-2xl text-4xl font-black italic text-zinc-950 uppercase tracking-tighter">Tienda <span className="text-red-600">Jandosoft</span></h2>
           <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest italic">{products.length} Planes Disponibles</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 max-[400px]:gap-4 gap-8">
          {products.map((product: any) => (
            <motion.div key={product.id} whileTap={{ scale: 0.98 }} whileHover={{ y: -5 }} className="bg-white max-[400px]:p-5 max-[400px]:rounded-[2rem] p-8 rounded-[3rem] border border-zinc-100 shadow-3xl group transition-all border-l-4 border-l-transparent hover:border-l-red-600 cursor-pointer" onClick={() => setSelectedProduct(product)}>
              <div className="flex justify-between items-start mb-5">
                <div className="w-16 h-16 bg-zinc-50 rounded-2xl text-red-600 group-hover:bg-red-600 group-hover:text-white transition-all transform group-hover:rotate-6 shadow-md flex items-center justify-center border border-zinc-100 overflow-hidden">
                   <ProductImage images={product.images} alt={product.name} onClick={(e) => { e.stopPropagation(); setLightbox({ images: product.images, index: 0 }); }} />
                </div>
                <div className="flex gap-1 text-amber-400">
                   {[1,2,3,4,5].map(s => <Star key={s} className="w-3.5 h-3.5 fill-current" />)}
                </div>
              </div>

              {product.images && product.images.length > 1 && (
                <div className="flex gap-1.5 mb-4">
                  {product.images.slice(0, 4).map((img: string, i: number) => (
                    <div key={i} className="w-8 h-8 rounded-lg overflow-hidden border border-zinc-200 bg-zinc-50 cursor-pointer" onClick={(e) => { e.stopPropagation(); setLightbox({ images: product.images, index: i + 1 }); }}>
                      <ProductThumb src={img} alt="" />
                    </div>
                  ))}
                  {product.images.length > 4 && (
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-[8px] font-black text-zinc-400 italic">+{product.images.length - 4}</div>
                  )}
                </div>
              )}

              <h3 className="text-2xl font-black mb-2 text-zinc-950 uppercase tracking-tighter italic leading-none">{product.name}</h3>
              <p className="text-zinc-500 text-sm font-medium mb-8 leading-relaxed font-black italic">{product.desc || "Plan de software personalizado para tu empresa."}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest leading-none mb-1">Inversión {currency}</span>
                  <span className="text-3xl font-black text-zinc-950 italic">${product.price}</span>
                </div>
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => { e.stopPropagation(); addToCart(product.id); }}
                  className={cn(
                    "p-5 rounded-2xl font-black shadow-xl shadow-red-100 transition-all",
                    cart.includes(product.id) ? "bg-emerald-50 text-emerald-500 border border-emerald-100 shadow-emerald-50" : "bg-red-600 text-white hover:bg-red-700"
                  )}
                >
                  {cart.includes(product.id) ? <CheckCircle2 className="w-7 h-7" /> : <Plus className="w-7 h-7" />}
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <aside className="w-full lg:w-96 bg-zinc-50 max-[400px]:rounded-[2rem] max-[400px]:p-5 rounded-[4rem] p-10 flex flex-col shadow-3xl border border-zinc-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 rounded-full blur-[80px] -mr-32 -mt-32" />
        
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center gap-4 max-[400px]:mb-6 mb-12">
            <div className="p-4 bg-red-600 rounded-2xl shadow-2xl shadow-red-100 text-white"><ShoppingCart className="w-6 h-6" /></div>
            <h3 className="max-[400px]:text-2xl text-3xl font-black italic text-zinc-950 uppercase tracking-tighter">Tu Orden</h3>
            <span className="ml-auto bg-red-600 h-6 px-3 rounded-full text-[10px] font-black text-white flex items-center justify-center">{cart.length}</span>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto max-[400px]:mb-6 mb-12 min-h-[300px] no-scrollbar">
            {cart.map(id => {
              const p = products.find((prod: any) => prod.id === id);
              return (
                <div key={id} className="flex items-center justify-between group bg-white max-[400px]:p-3 p-5 max-[400px]:rounded-2xl rounded-3xl border border-zinc-100 shadow-sm hover:border-red-600/20 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-400 group-hover:text-red-600 transition-colors shadow-inner flex-shrink-0">
                      {p?.icon || <Package className="w-6 h-6" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-zinc-950 leading-tight uppercase italic">{p?.name}</h4>
                      <p className="text-[11px] text-zinc-400 font-bold tracking-widest italic mt-0.5">{currency} ${p?.price}</p>
                    </div>
                  </div>
                  <button onClick={() => setCart(cart.filter(c => c !== id))} className="p-2 text-zinc-300 hover:text-rose-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              )}
            )}
            {cart.length === 0 && (
              <div className="flex flex-col items-center justify-center h-60 opacity-20 text-center space-y-6 translate-y-[-20%]">
                <Package className="w-16 h-16 text-zinc-400" />
                <p className="text-sm font-black italic uppercase tracking-widest leading-none">Tu carrito<br/>esta vacío</p>
              </div>
            )}
          </div>

          <div className="max-[400px]:pt-6 pt-10 border-t border-zinc-200/60 space-y-8">
            <div className="space-y-4">
               <label className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-2 italic">Método de Pago</label>
               <div className="grid grid-cols-2 gap-3">
                  {(paymentMethods || DEFAULT_PAYMENT_METHODS).filter(pm => pm.enabled).map(pm => (
                    <PaymentToggle
                      key={pm.key}
                      active={paymentMethod === pm.key}
                      onClick={() => setPaymentMethod(pm.key)}
                      label={PAYMENT_ICONS[pm.key]?.label || pm.name.toUpperCase()}
                      icon={PAYMENT_ICONS[pm.key]?.icon || <CreditCard className="w-4 h-4" />}
                    />
                  ))}
               </div>
            </div>

            <div className="flex items-center justify-between px-2">
               <span className="text-zinc-500 font-black uppercase tracking-widest text-[10px] italic">Inversión Final</span>
               <span className="max-[400px]:text-3xl text-4xl font-black italic text-zinc-950 tracking-tighter">${total} <span className="max-[400px]:text-base text-lg text-red-600 font-black italic">{currency}</span></span>
            </div>
            
            <motion.button 
              whileTap={{ scale: 0.97 }}
              disabled={cart.length === 0}
              onClick={handleCheckoutInitiation}
              className="w-full max-[400px]:py-5 max-[400px]:text-lg max-[400px]:rounded-2xl py-6 bg-red-600 text-white rounded-[2rem] font-black text-xl hover:bg-red-700 transition-all shadow-2xl shadow-red-100 flex items-center justify-center gap-3 group disabled:opacity-30 disabled:grayscale uppercase tracking-widest italic"
            >
              PAGAR AHORA <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </div>
        </div>
      </aside>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-md flex items-center justify-center max-[400px]:p-3 p-4 md:p-8" onClick={() => setSelectedProduct(null)}>
            <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }} transition={{ type: "spring", stiffness: 400, damping: 30 }} className="w-full max-w-3xl bg-white max-[400px]:rounded-[2rem] rounded-[3rem] overflow-hidden shadow-4xl relative flex flex-col md:flex-row" onClick={e => e.stopPropagation()}>
              <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/80 backdrop-blur rounded-xl flex items-center justify-center hover:bg-white transition-all shadow-md"><X className="w-5 h-5 text-zinc-600" /></button>
              
              {/* Image section */}
              <div className="md:w-1/2 bg-zinc-50 max-[400px]:p-4 p-6 flex flex-col items-center justify-center min-h-[300px]">
                <div className="w-full aspect-square rounded-2xl overflow-hidden bg-white border border-zinc-100 shadow-inner flex items-center justify-center mb-3 cursor-pointer" onClick={() => { if (selectedProduct.images?.length) setLightbox({ images: selectedProduct.images, index: 0 }); }}>
                  <ProductImage images={selectedProduct.images} alt={selectedProduct.name} className="w-full h-full" />
                </div>
                {selectedProduct.images?.length > 1 && (
                  <div className="flex gap-2 flex-wrap justify-center">
                    {selectedProduct.images.map((img: string, i: number) => (
                      <div key={i} className={cn("w-10 h-10 rounded-lg overflow-hidden border-2 cursor-pointer transition-all", i === 0 ? "border-red-600" : "border-zinc-200 hover:border-zinc-400")} onClick={() => setLightbox({ images: selectedProduct.images, index: i })}>
                        <ProductThumb src={img} alt="" />
                      </div>
                    ))}
                  </div>
                )}
                {selectedProduct.images?.length > 0 && (
                  <button onClick={() => { if (selectedProduct.images?.length) setLightbox({ images: selectedProduct.images, index: 0 }); }} className="mt-3 text-[10px] font-black text-red-600 italic hover:underline flex items-center gap-1">
                    <ImageIcon className="w-3 h-3" /> VER GALERÍA COMPLETA
                  </button>
                )}
              </div>

              {/* Info section */}
              <div className="md:w-1/2 max-[400px]:p-5 p-8 flex flex-col justify-between">
                <div className="space-y-6">
                  <div className="flex gap-1 text-amber-400">
                    {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 fill-current" />)}
                  </div>
                  <h2 className="max-[400px]:text-2xl text-3xl font-black italic text-zinc-950 uppercase tracking-tighter leading-tight">{selectedProduct.name}</h2>
                  <p className="max-[400px]:text-xs text-sm text-zinc-500 font-medium leading-relaxed">{selectedProduct.desc || "Plan de software personalizado para tu empresa."}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="max-[400px]:text-3xl text-4xl font-black italic text-zinc-950">${selectedProduct.price}</span>
                    <span className="text-[10px] font-black text-zinc-400 italic uppercase">{currency}</span>
                  </div>
                </div>
                <div className="mt-8 space-y-3">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { addToCart(selectedProduct.id); setSelectedProduct(null); }}
                    className={cn("w-full py-5 rounded-2xl font-black text-base italic transition-all shadow-xl flex items-center justify-center gap-3", cart.includes(selectedProduct.id) ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-red-600 text-white hover:bg-red-700")}
                  >
                    {cart.includes(selectedProduct.id) ? <><CheckCircle2 className="w-5 h-5" /> EN CARRITO</> : <><Plus className="w-5 h-5" /> AGREGAR AL CARRITO</>}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-6" onClick={() => setLightbox(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="relative max-w-3xl w-full" onClick={e => e.stopPropagation()}>
              <button onClick={() => setLightbox(null)} className="absolute -top-12 right-0 text-white/60 hover:text-white transition-colors"><X className="w-8 h-8" /></button>
              <div className="flex items-center gap-4">
                {lightbox.images.length > 1 && (
                  <button onClick={() => setLightbox(l => l ? { ...l, index: (l.index - 1 + l.images.length) % l.images.length } : l)} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-all"><ChevronRight className="w-6 h-6 rotate-180" /></button>
                )}
                <div className="flex-1 aspect-video rounded-3xl overflow-hidden bg-zinc-900">
                  <img src={lightbox.images[lightbox.index]} alt="" className="w-full h-full object-contain" />
                </div>
                {lightbox.images.length > 1 && (
                  <button onClick={() => setLightbox(l => l ? { ...l, index: (l.index + 1) % l.images.length } : l)} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-all"><ChevronRight className="w-6 h-6" /></button>
                )}
              </div>
              {lightbox.images.length > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  {lightbox.images.map((_, i) => (
                    <button key={i} onClick={() => setLightbox(l => l ? { ...l, index: i } : l)} className={cn("w-2 h-2 rounded-full transition-all", i === lightbox.index ? "bg-white w-6" : "bg-white/40")} />
                  ))}
                </div>
              )}
              <p className="text-center text-white/60 text-xs font-bold italic mt-3">{lightbox.index + 1} / {lightbox.images.length}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Checkout Modal */}
      <AnimatePresence>
        {showCheckout && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center max-[400px]:p-3 p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="w-full max-w-md bg-white max-[400px]:rounded-[2rem] max-[400px]:p-5 rounded-[3rem] p-10 shadow-4xl relative overflow-hidden"
            >
              <button onClick={() => { setShowCheckout(false); setClientSecret(null); setStripeError(null); }} className="absolute top-4 right-4 md:top-8 md:right-8 p-2 hover:bg-zinc-100 rounded-xl transition-colors"><X className="w-5 h-5 text-zinc-400" /></button>
              
              <div className="text-center max-[400px]:mb-6 mb-10">
                <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                   <CreditCard className="w-8 h-8" />
                </div>
                <h3 className="max-[400px]:text-2xl text-3xl font-black italic text-zinc-950 uppercase tracking-tighter">Pasarela de Pago</h3>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-2">Pago seguro con Stripe</p>
              </div>

              {stripeError && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
                  <p className="text-xs font-bold text-red-700 italic">{stripeError}</p>
                </div>
              )}

              {isProcessing && !clientSecret && (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
                  <p className="text-xs font-black italic text-zinc-400">Inicializando pago seguro...</p>
                </div>
              )}

              {clientSecret && stripePromise ? (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <StripePaymentForm
                    amount={total}
                    currency={currency}
                    onSuccess={handlePaymentSuccess}
                    onError={(msg) => setStripeError(msg)}
                  />
                </Elements>
              ) : clientSecret && !stripePromise ? (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center space-y-3">
                  <Lock className="w-8 h-8 text-amber-500 mx-auto" />
                  <p className="text-xs font-black italic text-amber-800">Stripe no está configurado</p>
                  <p className="text-[10px] font-medium text-amber-600 italic">Agrega NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY a tu .env para procesar pagos reales.</p>
                </div>
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PaymentToggle({ active, onClick, label, icon }: any) {
  return (
    <button onClick={onClick} className={cn("flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all font-black text-[9px] tracking-widest italic", active ? "border-red-600 bg-white text-red-600 shadow-xl shadow-red-900/10" : "border-transparent bg-white text-zinc-400 opacity-60 hover:opacity-100 hover:border-zinc-200")}>
       {icon} {label}
    </button>
  );
}
