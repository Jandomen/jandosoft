import type { PaymentProvider, CheckoutRequest, CheckoutResult } from "./index";

export const klarnaProvider: PaymentProvider = {
  config: {
    id: "klarna",
    label: "Klarna",
    icon: "CreditCard",
    color: "#FFB3C7",
    fields: [
      { key: "merchantId", label: "Merchant ID", placeholder: "xxxxxxxx" },
      { key: "apiKey", label: "API Key", placeholder: "xxxxxxxx", secret: true },
      { key: "environment", label: "Entorno", placeholder: "playground o production" },
    ],
  },

  async validateCredentials(credentials: Record<string, string>): Promise<boolean> {
    try {
      if (!credentials.merchantId || !credentials.apiKey) return false;
      const env = credentials.environment === "production" ? "api.klarna.com" : "playground.libstripe.com";
      const auth = Buffer.from(`${credentials.merchantId}:${credentials.apiKey}`).toString("base64");
      const res = await fetch(`https://${env}/v1/locations`, {
        headers: { Authorization: `Basic ${auth}` },
      });
      return res.ok;
    } catch { return false; }
  },

  async createCheckout(req: CheckoutRequest, credentials: Record<string, string>): Promise<CheckoutResult> {
    try {
      if (!credentials.merchantId || !credentials.apiKey) return { error: "Credenciales no configuradas" };
      return { error: "Klarna requiere integración JavaScript del lado del cliente. Próximamente soporte completo." };
    } catch (err: any) { return { error: err.message || "Error creating Klarna session" }; }
  },
};
