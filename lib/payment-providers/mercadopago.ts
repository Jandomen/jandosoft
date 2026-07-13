import type { PaymentProvider, CheckoutRequest, CheckoutResult } from "./index";

export const mercadopagoProvider: PaymentProvider = {
  config: {
    id: "mercadopago",
    label: "Mercado Pago",
    icon: "ShoppingBag",
    color: "#009EE3",
    fields: [
      { key: "accessToken", label: "Access Token", placeholder: "APP_USR-xxx", secret: true },
      { key: "publicKey", label: "Public Key", placeholder: "APP_USR-xxx" },
      { key: "webhookSecret", label: "Webhook Secret (opcional)", placeholder: "xxx", secret: true },
    ],
  },

  async validateCredentials(credentials: Record<string, string>): Promise<boolean> {
    try {
      if (!credentials.accessToken) return false;
      const res = await fetch("https://api.mercadopago.com/v1/payment_methods", {
        headers: { Authorization: `Bearer ${credentials.accessToken}` },
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async createCheckout(req: CheckoutRequest, credentials: Record<string, string>): Promise<CheckoutResult> {
    try {
      if (!credentials.accessToken) return { error: "Access Token no configurado" };

      const res = await fetch("https://api.mercadopago.com/v1/payments", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${credentials.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transaction_amount: req.amount,
          description: req.description || "Pago",
          payment_method_id: "visa",
          payer: { email: req.customerEmail },
          metadata: {
            storeId: req.storeId,
            storeName: req.storeName,
            ownerEmail: req.ownerEmail,
            provider: "mercadopago",
          },
          back_urls: {
            success: `${process.env.NEXT_PUBLIC_URL || "https://jandosoft.vercel.app"}/s/payment-success?provider=mercadopago`,
            failure: `${process.env.NEXT_PUBLIC_URL || "https://jandosoft.vercel.app"}/s/payment-cancel`,
            pending: `${process.env.NEXT_PUBLIC_URL || "https://jandosoft.vercel.app"}/s/payment-success?provider=mercadopago&pending=true`,
          },
          auto_return: "approved",
        }),
      });

      const data = await res.json();
      if (data.error) return { error: data.message || "MercadoPago error" };

      const initPoint = data.point_of_interaction?.transaction_data?.ticket_url || data.init_point;
      return { url: initPoint, id: String(data.id) };
    } catch (err: any) {
      return { error: err.message || "Error creating MercadoPago checkout" };
    }
  },
};
