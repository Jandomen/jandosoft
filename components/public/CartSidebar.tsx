"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, Trash2, ShoppingCart, CreditCard, CheckCircle2, Loader2, ChevronLeft } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { StripePaymentForm } from "@/components/store/StripePaymentForm";
import { useCart } from "./CartProvider";

const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

export default function CartSidebar({
  storeId, storeName, slug, paymentsEnabled
}: {
  storeId?: string; storeName: string; slug: string; paymentsEnabled?: boolean;
}) {
  const { items, removeItem, updateQuantity, clearCart, totalItems, totalPrice } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<"cart" | "checkout" | "success">("cart");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [paymentId, setPaymentId] = useState("");

  const canCheckout = storeId && paymentsEnabled;

  const handleStartCheckout = async () => {
    if (!customerEmail || items.length === 0) return;
    setCheckoutLoading(true);
    setCheckoutError("");
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId,
          items: items.map(i => ({ name: i.name, price: i.price, quantity: i.quantity })),
          currency: "USD",
          customerEmail,
          customerName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al iniciar pago");
      setClientSecret(data.clientSecret);
    } catch (e: any) {
      setCheckoutError(e.message || "Error al conectar con pasarela de pago");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handlePaymentSuccess = (paymentIntentId: string) => {
    setPaymentId(paymentIntentId);
    setView("success");
    clearCart();
  };

  const resetCheckout = () => {
    setView("cart");
    setClientSecret(null);
    setCheckoutError("");
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-red-600 text-white rounded-2xl shadow-2xl flex items-center justify-center hover:bg-red-700 transition-all active:scale-95"
      >
        <ShoppingCart className="w-6 h-6" />
        {totalItems > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-6 h-6 bg-zinc-950 text-white text-[10px] font-black rounded-full flex items-center justify-center"
          >
            {totalItems > 99 ? "99+" : totalItems}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={() => { setIsOpen(false); resetCheckout(); }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md z-50 bg-white shadow-2xl flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-zinc-100 shrink-0">
              {view === "checkout" ? (
                <button onClick={resetCheckout} className="flex items-center gap-1.5 text-[10px] font-black text-zinc-400 italic hover:text-zinc-600 transition-all">
                  <ChevronLeft className="w-3.5 h-3.5" /> VOLVER
                </button>
              ) : (
                <h2 className="text-sm font-black italic text-zinc-950 uppercase tracking-tighter">
                  Carrito {totalItems > 0 && `(${totalItems})`}
                </h2>
              )}
              <button onClick={() => { setIsOpen(false); resetCheckout(); }} className="p-1.5 hover:bg-zinc-100 rounded-xl transition-all">
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {view === "success" ? (
                <div className="text-center space-y-6 py-12">
                  <div className="w-16 h-16 bg-emerald-100 rounded-[2rem] flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-black italic text-zinc-950 uppercase tracking-tighter">Pago Exitoso</h3>
                    <p className="text-xs text-zinc-500 font-medium">Tu pedido se ha procesado correctamente.</p>
                    <p className="text-[10px] font-mono text-zinc-400">ID: {paymentId}</p>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setIsOpen(false); resetCheckout(); }}
                    className="px-8 py-3 bg-zinc-950 text-white rounded-2xl font-black italic text-xs hover:bg-zinc-800 transition-all"
                  >
                    CERRAR
                  </motion.button>
                </div>
              ) : view === "checkout" ? (
                <div className="space-y-4">
                  <div className="bg-zinc-50 rounded-2xl p-4 space-y-2">
                    <h4 className="text-[9px] font-black italic text-zinc-400 uppercase tracking-widest">Resumen del Pedido</h4>
                    <div className="space-y-1.5">
                      {items.map(item => (
                        <div key={item.id} className="flex justify-between text-xs font-medium">
                          <span className="text-zinc-600">{item.quantity}x {item.name}</span>
                          <span className="font-black text-zinc-950">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-zinc-200 pt-2 flex justify-between text-sm font-black italic">
                      <span className="text-zinc-950">Total</span>
                      <span className="text-red-600">${totalPrice.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[9px] font-black text-zinc-400 uppercase italic tracking-widest ml-1">Nombre completo</label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={e => setCustomerName(e.target.value)}
                        placeholder="Ej. Juan Pérez"
                        className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-zinc-400 uppercase italic tracking-widest ml-1">Correo electrónico</label>
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={e => setCustomerEmail(e.target.value)}
                        placeholder="Ej. cliente@correo.com"
                        className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 text-sm"
                      />
                    </div>
                  </div>

                  {checkoutError && (
                    <p className="text-[10px] font-bold text-rose-600 italic">{checkoutError}</p>
                  )}

                  {clientSecret ? (
                    <div className="space-y-4">
                      {stripePromise ? (
                        <Elements stripe={stripePromise} options={{ clientSecret }}>
                          <StripePaymentForm
                            amount={totalPrice}
                            currency="USD"
                            onSuccess={handlePaymentSuccess}
                            onError={(msg) => setCheckoutError(msg)}
                          />
                        </Elements>
                      ) : (
                        <p className="text-rose-600 text-xs font-bold italic">Error: Stripe no está configurado.</p>
                      )}
                    </div>
                  ) : (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleStartCheckout}
                      disabled={!customerEmail || checkoutLoading || items.length === 0}
                      className="w-full py-4 bg-red-600 text-white rounded-2xl font-black italic text-xs hover:bg-red-700 transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {checkoutLoading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> INICIANDO PAGO...</>
                      ) : (
                        <><CreditCard className="w-4 h-4" /> PAGAR ${totalPrice.toFixed(2)}</>
                      )}
                    </motion.button>
                  )}
                </div>
              ) : (
                items.length === 0 ? (
                  <div className="text-center py-16 space-y-4">
                    <ShoppingCart className="w-12 h-12 text-zinc-200 mx-auto" />
                    <p className="text-sm font-bold text-zinc-400 italic">Tu carrito está vacío</p>
                    <p className="text-[10px] text-zinc-300 font-medium">Agrega productos para comenzar.</p>
                  </div>
                ) : (
                  items.map(item => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 bg-zinc-50 rounded-2xl p-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black italic text-zinc-950 truncate">{item.name}</p>
                        <p className="text-[11px] font-bold text-red-600">${item.price.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-7 h-7 bg-white rounded-lg flex items-center justify-center shadow-sm hover:bg-zinc-100 transition-all"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center text-xs font-black text-zinc-950">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-7 h-7 bg-white rounded-lg flex items-center justify-center shadow-sm hover:bg-zinc-100 transition-all"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <button onClick={() => removeItem(item.id)} className="p-1.5 text-zinc-300 hover:text-rose-600 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  ))
                )
              )}
            </div>

            {view === "cart" && items.length > 0 && (
              <div className="border-t border-zinc-100 p-4 space-y-3 shrink-0">
                <div className="flex justify-between text-base font-black italic">
                  <span className="text-zinc-950">Total</span>
                  <span className="text-red-600">${totalPrice.toFixed(2)}</span>
                </div>
                {canCheckout ? (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setView("checkout")}
                    className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black italic text-xs hover:bg-emerald-700 transition-all shadow-xl flex items-center justify-center gap-3"
                  >
                    <CreditCard className="w-4 h-4" />
                    IR A PAGAR
                  </motion.button>
                ) : (
                  <p className="text-[10px] text-zinc-400 font-bold italic text-center">
                    El pago no está habilitado para esta tienda.
                  </p>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
