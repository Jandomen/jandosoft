export interface PaymentProviderField {
  key: string;
  label: string;
  placeholder: string;
  secret?: boolean;
}

export interface PaymentProviderConfig {
  id: string;
  label: string;
  icon: string;
  color: string;
  docsUrl?: string;
  fields: PaymentProviderField[];
}

export interface StorePaymentIntegration {
  provider: string;
  credentials: Record<string, string>;
  enabled: boolean;
  isDefault: boolean;
  connectedAt?: Date;
}

export interface CheckoutRequest {
  storeId: string;
  storeName: string;
  ownerEmail: string;
  amount: number;
  currency: string;
  description: string;
  customerEmail: string;
  customerName?: string;
  items?: { name: string; price: number; quantity: number }[];
}

export interface CheckoutResult {
  url?: string;
  id?: string;
  error?: string;
}

export interface PaymentProvider {
  config: PaymentProviderConfig;
  validateCredentials(credentials: Record<string, string>): Promise<boolean>;
  createCheckout(req: CheckoutRequest, credentials: Record<string, string>): Promise<CheckoutResult>;
}

export const PAYMENT_PROVIDERS: Record<string, PaymentProviderConfig> = {
  stripe: {
    id: "stripe",
    label: "Stripe",
    icon: "CreditCard",
    color: "#635BFF",
    docsUrl: "https://dashboard.stripe.com/apikeys",
    fields: [
      { key: "secretKey", label: "Secret Key", placeholder: "sk_live_xxx o sk_test_xxx", secret: true },
      { key: "publishableKey", label: "Publishable Key", placeholder: "pk_live_xxx o pk_test_xxx" },
      { key: "webhookSecret", label: "Webhook Secret", placeholder: "whsec_xxx", secret: true },
    ],
  },
  paypal: {
    id: "paypal",
    label: "PayPal",
    icon: "Wallet",
    color: "#003087",
    docsUrl: "https://developer.paypal.com/dashboard/applications",
    fields: [
      { key: "clientId", label: "Client ID", placeholder: "AYSq3RDG..." },
      { key: "clientSecret", label: "Client Secret", placeholder: "EGnHDxD...", secret: true },
      { key: "mode", label: "Modo", placeholder: "sandbox o live" },
    ],
  },
  mercadopago: {
    id: "mercadopago",
    label: "Mercado Pago",
    icon: "ShoppingBag",
    color: "#009EE3",
    docsUrl: "https://www.mercadopago.com.br/developers",
    fields: [
      { key: "accessToken", label: "Access Token", placeholder: "APP_USR-xxx", secret: true },
      { key: "publicKey", label: "Public Key", placeholder: "APP_USR-xxx" },
      { key: "webhookSecret", label: "Webhook Secret (opcional)", placeholder: "xxx", secret: true },
    ],
  },
  nowpayments: {
    id: "nowpayments",
    label: "NOWPayments",
    icon: "Bitcoin",
    color: "#6C3EC1",
    docsUrl: "https://nowpayments.io/api-keys",
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "NOWPAYMENTS_API_KEY", secret: true },
      { key: "ipnSecret", label: "IPN Secret", placeholder: "xxx", secret: true },
    ],
  },
};

export function getProviderConfig(id: string): PaymentProviderConfig | undefined {
  return PAYMENT_PROVIDERS[id];
}

export function getActiveProvider(integrations: StorePaymentIntegration[]): StorePaymentIntegration | undefined {
  return integrations.find(i => i.enabled && i.isDefault) || integrations.find(i => i.enabled);
}
