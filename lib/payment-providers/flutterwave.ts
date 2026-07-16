import type { PaymentProvider, CheckoutRequest, CheckoutResult } from "./index";

export const flutterwaveProvider: PaymentProvider = {
  config: {
    id: "flutterwave",
    label: "Flutterwave",
    icon: "CreditCard",
    color: "#F5A623",
    fields: [
      { key: "secretKey", label: "Secret Key", placeholder: "FLWSECK-xxx", secret: true },
      { key: "publicKey", label: "Public Key", placeholder: "FLWPUBK-xxx" },
      { key: "encryptionKey", label: "Encryption Key", placeholder: "FLWSECK-xxx", secret: true },
    ],
  },

  async validateCredentials(credentials: Record<string, string>): Promise<boolean> {
    try {
      if (!credentials.secretKey) return false;
      const res = await fetch("https://api.flutterwave.com/v3/banks/NG", {
        headers: { Authorization: `Bearer ${credentials.secretKey}` },
      });
      return res.status === 200;
    } catch { return false; }
  },

  async createCheckout(req: CheckoutRequest, credentials: Record<string, string>): Promise<CheckoutResult> {
    try {
      if (!credentials.secretKey) return { error: "Secret Key no configurada" };
      const txRef = `flw-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

      const res = await fetch("https://api.flutterwave.com/v3/payments", {
        method: "POST",
        headers: { Authorization: `Bearer ${credentials.secretKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          tx_ref: txRef,
          amount: req.amount,
          currency: req.currency.toUpperCase(),
          redirect_url: `${process.env.NEXT_PUBLIC_URL || "https://jandosoft.vercel.app"}/s/payment-success?provider=flutterwave`,
          customer: { email: req.customerEmail, name: req.customerName || "" },
          meta: { storeId: req.storeId, storeName: req.storeName },
          description: req.description || "Pago",
        }),
      });
      const data = await res.json();
      if (data.status !== "success") return { error: data.message || "Flutterwave error" };
      return { url: data.data.link, id: txRef };
    } catch (err: any) { return { error: err.message || "Error creating Flutterwave payment" }; }
  },
};
