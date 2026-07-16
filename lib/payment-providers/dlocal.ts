import type { PaymentProvider, CheckoutRequest, CheckoutResult } from "./index";

export const dlocalProvider: PaymentProvider = {
  config: {
    id: "dlocal",
    label: "dLocal",
    icon: "CreditCard",
    color: "#00AEEF",
    fields: [
      { key: "secretKey", label: "Secret Key", placeholder: "xxxxxxxx", secret: true },
      { key: "login", label: "Login", placeholder: "tu@email.com" },
      { key: "countryCode", label: "Código de país", placeholder: "BR, MX, AR, CO..." },
    ],
  },

  async validateCredentials(credentials: Record<string, string>): Promise<boolean> {
    try {
      if (!credentials.secretKey || !credentials.login) return false;
      const auth = Buffer.from(`${credentials.login}:${credentials.secretKey}`).toString("base64");
      const res = await fetch("https://api.dlocal.com/1.2/countries", {
        headers: { Authorization: `Bearer ${auth}` },
      });
      return res.status === 200;
    } catch { return false; }
  },

  async createCheckout(req: CheckoutRequest, credentials: Record<string, string>): Promise<CheckoutResult> {
    try {
      if (!credentials.secretKey || !credentials.login) return { error: "Credenciales no configuradas" };
      const auth = Buffer.from(`${credentials.login}:${credentials.secretKey}`).toString("base64");
      const orderId = `dloc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

      const res = await fetch("https://api.dlocal.com/1.2/payments", {
        method: "POST",
        headers: { Authorization: `Bearer ${auth}`, "Content-Type": "application/json", "X-Date": new Date().toISOString() },
        body: JSON.stringify({
          amount: req.amount,
          currency: req.currency.toUpperCase(),
          country: credentials.countryCode || "BR",
          order_id: orderId,
          payer: { name: req.customerName || "Cliente", email: req.customerEmail },
          callback_url: `${process.env.NEXT_PUBLIC_URL || "https://jandosoft.vercel.app"}/s/payment-success?provider=dlocal`,
          notification_url: `${process.env.NEXT_PUBLIC_URL || "https://jandosoft.vercel.app"}/api/dlocal/webhook`,
          description: req.description || "Pago",
        }),
      });
      const data = await res.json();
      if (data.error) return { error: data.error.message || "dLocal error" };
      return { url: data.redirect_url || "", id: data.id || orderId };
    } catch (err: any) { return { error: err.message || "Error creating dLocal payment" }; }
  },
};
