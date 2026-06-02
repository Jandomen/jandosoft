"use client";

import { useState, useEffect } from "react";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { motion } from "framer-motion";
import { Loader2, Lock } from "lucide-react";

export function StripePaymentForm({
  amount,
  currency,
  onSuccess,
  onError,
}: {
  amount: number;
  currency: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (msg: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin,
      },
      redirect: "if_required",
    });

    if (error) {
      onError(error.message || "Error al procesar el pago");
      setIsProcessing(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      onSuccess(paymentIntent.id);
    } else {
      onError("El pago no pudo completarse. Intenta de nuevo.");
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement
        options={{
          layout: {
            type: "tabs",
            defaultCollapsed: false,
          },
          fields: {
            billingDetails: {
              name: "never",
            },
          },
        }}
      />

      <div className="bg-zinc-950 p-4 md:p-6 rounded-3xl text-white flex items-center justify-between shadow-xl shadow-zinc-900/20">
        <div className="flex flex-col">
          <span className="text-[9px] font-bold uppercase text-zinc-500 tracking-widest">Total a Pagar</span>
          <span className="text-xl md:text-2xl font-black italic tracking-tighter">${amount} {currency}</span>
        </div>
        <Lock className="w-5 h-5 md:w-6 md:h-6 text-emerald-400" />
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        disabled={!stripe || isProcessing}
        type="submit"
        className="w-full py-5 md:py-6 bg-red-600 text-white rounded-2xl font-black text-lg md:text-xl hover:bg-red-700 transition-all shadow-2xl shadow-red-200 flex items-center justify-center gap-3 disabled:opacity-50 italic uppercase tracking-widest"
      >
        {isProcessing ? (
          <><Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" /> PROCESANDO...</>
        ) : (
          "CONFIRMAR PAGO"
        )}
      </motion.button>
    </form>
  );
}
