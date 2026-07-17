import Stripe from "stripe";
import type { PaymentProvider, CheckoutRequest, CheckoutResult } from "./index";

const STRIPE_SUPPORTED = new Set([
  "usd", "eur", "gbp", "cad", "aud", "nzd", "sgd", "hkd", "chf", "sek", "nok", "dkk", "pln", "czk", "huf", "ron", "bgd", "hrk",
  "mxn", "brl", "ars", "clp", "cop", "pen", "uyu", "pyg", "bob", "crc", "gtq", "hnl", "nio", "svc", "pab",
  "jpy", "cny", "krw", "inr", "idr", "myr", "php", "thb", "vnd", "twd", "pkr", "bdt", "lkr", "npr", "kes", "ngn", "zar", "egp", "mad", "tnd",
  "try", "rub", "uah", "kzt", "azn", "gel", "amd", "ils", "sar", "qar", "aed", "omr", "bhd", "kwd", "jod", "lbp", "egp",
  "isk", "mnt", "lak", "mmk", "khr", "btn", "mvr", "xaf", "xof", "xpf",
]);

function getStripeCurrency(currency: string): string {
  const c = (currency || "usd").toLowerCase();
  return STRIPE_SUPPORTED.has(c) ? c : "usd";
}

export const stripeProvider: PaymentProvider = {
  config: {
    id: "stripe",
    label: "Stripe",
    icon: "CreditCard",
    color: "#635BFF",
    fields: [
      { key: "secretKey", label: "Secret Key", placeholder: "sk_live_xxx o sk_test_xxx", secret: true },
      { key: "publishableKey", label: "Publishable Key", placeholder: "pk_live_xxx o pk_test_xxx" },
      { key: "webhookSecret", label: "Webhook Secret", placeholder: "whsec_xxx", secret: true },
    ],
  },

  async validateCredentials(credentials: Record<string, string>): Promise<boolean> {
    try {
      if (!credentials.secretKey) return false;
      const stripe = new Stripe(credentials.secretKey, { apiVersion: "2025-05-27.basil" as any });
      await stripe.balance.retrieve();
      return true;
    } catch {
      return false;
    }
  },

  async createCheckout(req: CheckoutRequest, credentials: Record<string, string>): Promise<CheckoutResult> {
    try {
      if (!credentials.secretKey) return { error: "Secret Key no configurada" };
      const stripe = new Stripe(credentials.secretKey, { apiVersion: "2025-05-27.basil" as any });

      const amountInCents = Math.round(req.amount * 100);
      const baseUrl = process.env.NEXT_PUBLIC_URL || "https://jandosoft.vercel.app";
      const currency = getStripeCurrency(req.currency);

      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        mode: "payment",
        line_items: req.items?.length
          ? req.items.map((item) => ({
              price_data: {
                currency,
                product_data: { name: item.name },
                unit_amount: Math.round(item.price * 100),
              },
              quantity: item.quantity,
            }))
          : [{
              price_data: {
                currency,
                product_data: { name: req.description || "Pago" },
                unit_amount: amountInCents,
              },
              quantity: 1,
            }],
        customer_email: req.customerEmail,
        success_url: `${baseUrl}/s/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/s/payment-cancel`,
        metadata: {
          storeId: req.storeId,
          storeName: req.storeName,
          ownerEmail: req.ownerEmail,
          customerEmail: req.customerEmail,
          customerName: req.customerName || "",
          description: req.description,
          provider: "stripe",
          from_checkout: "true",
        },
      };

      if (req.stripeAccountId) {
        const feePercent = req.platformFeePercent ?? 5;
        const applicationFee = Math.round(amountInCents * (feePercent / 100));

        (sessionParams as any).transfer_data = {
          destination: req.stripeAccountId,
        };
        (sessionParams as any).application_fee_amount = applicationFee;
      }

      const session = await stripe.checkout.sessions.create(sessionParams);
      return { url: session.url || undefined, id: session.id };
    } catch (err: any) {
      const msg = err?.message || "Error creating Stripe checkout";
      if (msg.includes("currency") || msg.includes("divisa")) {
        return { error: "Tu tarjeta no soporta esta moneda. Intenta con otra tarjeta." };
      }
      if (msg.includes("amount_too_small") || msg.includes("amount")) {
        return { error: "El monto mínimo de pago es $10 pesos mexicanos." };
      }
      return { error: msg };
    }
  },
};
