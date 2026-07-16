import type { PaymentProvider, CheckoutRequest, CheckoutResult } from "./index";

export const paystackProvider: PaymentProvider = {
  config: {
    id: "paystack",
    label: "Paystack",
    icon: "CreditCard",
    color: "#0F4B3A",
    fields: [
      { key: "secretKey", label: "Secret Key", placeholder: "sk_test_xxx o sk_live_xxx", secret: true },
      { key: "publicKey", label: "Public Key", placeholder: "pk_test_xxx o pk_live_xxx" },
    ],
  },

  async validateCredentials(credentials: Record<string, string>): Promise<boolean> {
    try {
      if (!credentials.secretKey) return false;
      const res = await fetch("https://api.paystack.co/transaction", {
        headers: { Authorization: `Bearer ${credentials.secretKey}` },
      });
      return res.status === 200;
    } catch { return false; }
  },

  async createCheckout(req: CheckoutRequest, credentials: Record<string, string>): Promise<CheckoutResult> {
    try {
      if (!credentials.secretKey) return { error: "Secret Key no configurada" };
      const amountInKobo = Math.round(req.amount * 100);

      const res = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: { Authorization: `Bearer ${credentials.secretKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          email: req.customerEmail,
          amount: amountInKobo,
          currency: req.currency.toUpperCase(),
          reference: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          metadata: { storeId: req.storeId, storeName: req.storeName, customerName: req.customerName || "", description: req.description },
          callback_url: `${process.env.NEXT_PUBLIC_URL || "https://jandosoft.vercel.app"}/s/payment-success?provider=paystack`,
        }),
      });
      const data = await res.json();
      if (!data.status) return { error: data.message || "Paystack error" };
      return { url: data.data.authorization_url, id: data.data.reference };
    } catch (err: any) { return { error: err.message || "Error creating Paystack payment" }; }
  },
};
