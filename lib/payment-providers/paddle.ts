import type { PaymentProvider, CheckoutRequest, CheckoutResult } from "./index";

export const paddleProvider: PaymentProvider = {
  config: {
    id: "paddle",
    label: "Paddle",
    icon: "CreditCard",
    color: "#3B5EE5",
    fields: [
      { key: "vendorId", label: "Vendor ID", placeholder: "12345" },
      { key: "apiKey", label: "API Key", placeholder: "xxxxxxxx", secret: true },
      { key: "clientSideToken", label: "Client-Side Token", placeholder: "xxxxxxxx" },
      { key: "environment", label: "Entorno", placeholder: "sandbox o production" },
    ],
  },

  async validateCredentials(credentials: Record<string, string>): Promise<boolean> {
    try {
      if (!credentials.vendorId || !credentials.apiKey) return false;
      const env = credentials.environment === "production" ? "api.paddle.com" : "sandbox-api.paddle.com";
      const res = await fetch(`https://${env}/2.0/vendor/vendors/${credentials.vendorId}`, {
        headers: { Authorization: `Bearer ${credentials.apiKey}` },
      });
      return res.status === 200;
    } catch { return false; }
  },

  async createCheckout(req: CheckoutRequest, credentials: Record<string, string>): Promise<CheckoutResult> {
    try {
      if (!credentials.vendorId || !credentials.apiKey) return { error: "Credenciales no configuradas" };
      const baseUrl = process.env.NEXT_PUBLIC_URL || "https://jandosoft.vercel.app";

      const res = await fetch("https://sandbox-api.paddle.com/2.0/payment/links", {
        method: "POST",
        headers: { Authorization: `Bearer ${credentials.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          title: req.description || "Pago",
          product_id: 0,
          price: { amount: Math.round(req.amount * 100), currency: req.currency.toUpperCase() },
          quantity: 1,
          return_url: `${baseUrl}/s/payment-success?provider=paddle`,
          passthrough: JSON.stringify({ storeId: req.storeId, customerEmail: req.customerEmail }),
        }),
      });
      const data = await res.json();
      if (data.error?.length) return { error: data.error[0]?.message || "Paddle error" };
      return { url: data.response?.url, id: String(data.response?.id) };
    } catch (err: any) { return { error: err.message || "Error creating Paddle payment" }; }
  },
};
