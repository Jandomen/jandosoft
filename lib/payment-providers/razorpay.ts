import type { PaymentProvider, CheckoutRequest, CheckoutResult } from "./index";

export const razorpayProvider: PaymentProvider = {
  config: {
    id: "razorpay",
    label: "Razorpay",
    icon: "CreditCard",
    color: "#072654",
    fields: [
      { key: "keyId", label: "Key ID", placeholder: "rzp_test_xxx", secret: true },
      { key: "keySecret", label: "Key Secret", placeholder: "xxxxxxxx", secret: true },
    ],
  },

  async validateCredentials(credentials: Record<string, string>): Promise<boolean> {
    try {
      if (!credentials.keyId || !credentials.keySecret) return false;
      const auth = Buffer.from(`${credentials.keyId}:${credentials.keySecret}`).toString("base64");
      const res = await fetch("https://api.razorpay.com/v1/payments", {
        headers: { Authorization: `Basic ${auth}` },
      });
      return res.status === 200;
    } catch { return false; }
  },

  async createCheckout(req: CheckoutRequest, credentials: Record<string, string>): Promise<CheckoutResult> {
    try {
      if (!credentials.keyId || !credentials.keySecret) return { error: "Credenciales no configuradas" };
      const auth = Buffer.from(`${credentials.keyId}:${credentials.keySecret}`).toString("base64");
      const receipt = `rcpt-${Date.now()}`;

      const res = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Math.round(req.amount * 100),
          currency: req.currency.toUpperCase(),
          receipt,
          notes: { storeId: req.storeId, storeName: req.storeName, customerEmail: req.customerEmail },
        }),
      });
      const data = await res.json();
      if (data.error) return { error: data.error.description || "Razorpay error" };

      const checkoutUrl = `https://checkout.razorpay.com/v1/checkout.js?order_id=${data.id}`;
      return { url: checkoutUrl, id: data.id };
    } catch (err: any) { return { error: err.message || "Error creating Razorpay order" }; }
  },
};
