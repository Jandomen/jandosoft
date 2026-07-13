import type { PaymentProvider, CheckoutRequest, CheckoutResult } from "./index";

async function getAccessToken(credentials: Record<string, string>): Promise<string> {
  const base64 = Buffer.from(`${credentials.clientId}:${credentials.clientSecret}`).toString("base64");
  const mode = credentials.mode === "live" ? "api-m.paypal.com" : "api-m.sandbox.paypal.com";
  const res = await fetch(`https://${mode}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${base64}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credential",
  });
  const data = await res.json();
  if (!data.access_token) throw new Error("PayPal auth failed");
  return data.access_token;
}

export const paypalProvider: PaymentProvider = {
  config: {
    id: "paypal",
    label: "PayPal",
    icon: "Wallet",
    color: "#003087",
    fields: [
      { key: "clientId", label: "Client ID", placeholder: "AYSq3RDG..." },
      { key: "clientSecret", label: "Client Secret", placeholder: "EGnHDxD...", secret: true },
      { key: "mode", label: "Modo", placeholder: "sandbox o live" },
    ],
  },

  async validateCredentials(credentials: Record<string, string>): Promise<boolean> {
    try {
      await getAccessToken(credentials);
      return true;
    } catch {
      return false;
    }
  },

  async createCheckout(req: CheckoutRequest, credentials: Record<string, string>): Promise<CheckoutResult> {
    try {
      const token = await getAccessToken(credentials);
      const mode = credentials.mode === "live" ? "api-m.paypal.com" : "api-m.sandbox.paypal.com";

      const res = await fetch(`https://${mode}/v2/checkout/orders`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [{
            amount: {
              currency_code: req.currency.toUpperCase(),
              value: req.amount.toFixed(2),
            },
            description: req.description || "Pago",
            custom_id: req.storeId,
          }],
          application_context: {
            return_url: `${process.env.NEXT_PUBLIC_URL || "https://jandosoft.vercel.app"}/s/payment-success?provider=paypal`,
            cancel_url: `${process.env.NEXT_PUBLIC_URL || "https://jandosoft.vercel.app"}/s/payment-cancel`,
          },
        }),
      });

      const data = await res.json();
      if (data.error) return { error: data.message || "PayPal error" };

      const approveUrl = data.links?.find((l: any) => l.rel === "approve")?.href;
      return { url: approveUrl, id: data.id };
    } catch (err: any) {
      return { error: err.message || "Error creating PayPal checkout" };
    }
  },
};
