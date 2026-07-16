import type { PaymentProvider, CheckoutRequest, CheckoutResult } from "./index";

export const squareProvider: PaymentProvider = {
  config: {
    id: "square",
    label: "Square",
    icon: "CreditCard",
    color: "#3E4348",
    fields: [
      { key: "accessToken", label: "Access Token", placeholder: "sq0atp-xxx", secret: true },
      { key: "applicationId", label: "Application ID", placeholder: "sq0idp-xxx" },
      { key: "locationId", label: "Location ID", placeholder: "LH..." },
      { key: "environment", label: "Entorno", placeholder: "sandbox o production" },
    ],
  },

  async validateCredentials(credentials: Record<string, string>): Promise<boolean> {
    try {
      if (!credentials.accessToken) return false;
      const env = credentials.environment === "production" ? "connect.squareup.com" : "connect.squareupsandbox.com";
      const res = await fetch(`https://${env}/v2/locations`, {
        headers: { Authorization: `Bearer ${credentials.accessToken}`, "Content-Type": "application/json" },
      });
      return res.ok;
    } catch { return false; }
  },

  async createCheckout(req: CheckoutRequest, credentials: Record<string, string>): Promise<CheckoutResult> {
    try {
      if (!credentials.accessToken) return { error: "Access Token no configurado" };
      const env = credentials.environment === "production" ? "connect.squareup.com" : "connect.squareupsandbox.com";
      const idempotencyKey = `checkout-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      const res = await fetch(`https://${env}/v2/online-checkouts`, {
        method: "POST",
        headers: { Authorization: `Bearer ${credentials.accessToken}`, "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
        body: JSON.stringify({
          idempotency_key: idempotencyKey,
          order: {
            location_id: credentials.locationId || "",
            line_items: req.items?.length
              ? req.items.map(i => ({ name: i.name, quantity: String(i.quantity), base_price_money: { amount: Math.round(i.price * 100), currency: req.currency.toUpperCase() } }))
              : [{ name: req.description || "Pago", quantity: "1", base_price_money: { amount: Math.round(req.amount * 100), currency: req.currency.toUpperCase() } }],
          },
          checkout: { payment_note: req.description || "Pago", redirect_url: `${process.env.NEXT_PUBLIC_URL || "https://jandosoft.vercel.app"}/s/payment-success?provider=square`, cancel_url: `${process.env.NEXT_PUBLIC_URL || "https://jandosoft.vercel.app"}/s/payment-cancel` },
        }),
      });
      const data = await res.json();
      if (data.errors?.length) return { error: data.errors[0].detail || "Square error" };
      return { url: data.checkout?.checkout_page_url, id: data.checkout?.id };
    } catch (err: any) { return { error: err.message || "Error creating Square checkout" }; }
  },
};
