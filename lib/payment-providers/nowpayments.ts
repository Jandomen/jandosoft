import type { PaymentProvider, CheckoutRequest, CheckoutResult } from "./index";

export const nowpaymentsProvider: PaymentProvider = {
  config: {
    id: "nowpayments",
    label: "NOWPayments",
    icon: "Bitcoin",
    color: "#6C3EC1",
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "NOWPAYMENTS_API_KEY", secret: true },
      { key: "ipnSecret", label: "IPN Secret", placeholder: "xxx", secret: true },
    ],
  },

  async validateCredentials(credentials: Record<string, string>): Promise<boolean> {
    try {
      if (!credentials.apiKey) return false;
      const res = await fetch("https://api.nowpayments.io/v1/merchant/balance", {
        headers: { "x-api-key": credentials.apiKey },
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async createCheckout(req: CheckoutRequest, credentials: Record<string, string>): Promise<CheckoutResult> {
    try {
      if (!credentials.apiKey) return { error: "API Key no configurada" };

      const orderId = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

      const res = await fetch("https://api.nowpayments.io/v1/invoice", {
        method: "POST",
        headers: {
          "x-api-key": credentials.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          price_amount: req.amount,
          price_currency: req.currency.toLowerCase(),
          order_id: orderId,
          order_description: req.description || "Pago",
          ipn_callback_url: `${process.env.NEXT_PUBLIC_URL || "https://jandosoft.vercel.app"}/api/nowpayments/webhook`,
          customer_email: req.customerEmail,
        }),
      });

      const data = await res.json();
      if (data.invoice_url) {
        return { url: data.invoice_url, id: orderId };
      }
      return { error: data.message || "NOWPayments error" };
    } catch (err: any) {
      return { error: err.message || "Error creating NOWPayments invoice" };
    }
  },
};
