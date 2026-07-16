import type { PaymentProvider, CheckoutRequest, CheckoutResult } from "./index";

export const mollieProvider: PaymentProvider = {
  config: {
    id: "mollie",
    label: "Mollie",
    icon: "CreditCard",
    color: "#C3002F",
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "test_xxx o live_xxx", secret: true },
    ],
  },

  async validateCredentials(credentials: Record<string, string>): Promise<boolean> {
    try {
      if (!credentials.apiKey) return false;
      const res = await fetch("https://api.mollie.com/v2/methods", {
        headers: { Authorization: `Bearer ${credentials.apiKey}` },
      });
      return res.status === 200;
    } catch { return false; }
  },

  async createCheckout(req: CheckoutRequest, credentials: Record<string, string>): Promise<CheckoutResult> {
    try {
      if (!credentials.apiKey) return { error: "API Key no configurada" };
      const baseUrl = process.env.NEXT_PUBLIC_URL || "https://jandosoft.vercel.app";

      const res = await fetch("https://api.mollie.com/v2/payments", {
        method: "POST",
        headers: { Authorization: `Bearer ${credentials.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: { currency: req.currency.toUpperCase(), value: req.amount.toFixed(2) },
          description: req.description || "Pago",
          redirectUrl: `${baseUrl}/s/payment-success?provider=mollie`,
          webhookUrl: `${baseUrl}/api/mollie/webhook`,
          metadata: { storeId: req.storeId, storeName: req.storeName, customerEmail: req.customerEmail },
        }),
      });
      const data = await res.json();
      if (data.error) return { error: data.error.message || "Mollie error" };
      return { url: data._links?.checkout?.href || data._links?.self?.href, id: data.id };
    } catch (err: any) { return { error: err.message || "Error creating Mollie payment" }; }
  },
};
