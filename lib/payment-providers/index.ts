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
  paymentMethod?: string;
  items?: { name: string; price: number; quantity: number }[];
  stripeAccountId?: string;
  platformFeePercent?: number;
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
  square: {
    id: "square",
    label: "Square",
    icon: "CreditCard",
    color: "#3E4348",
    docsUrl: "https://developer.squareup.com/apps",
    fields: [
      { key: "accessToken", label: "Access Token", placeholder: "sq0atp-xxx", secret: true },
      { key: "applicationId", label: "Application ID", placeholder: "sq0idp-xxx" },
      { key: "locationId", label: "Location ID", placeholder: "LH..." },
      { key: "environment", label: "Entorno", placeholder: "sandbox o production" },
    ],
  },
  razorpay: {
    id: "razorpay",
    label: "Razorpay",
    icon: "CreditCard",
    color: "#072654",
    docsUrl: "https://dashboard.razorpay.com/app/keys",
    fields: [
      { key: "keyId", label: "Key ID", placeholder: "rzp_test_xxx", secret: true },
      { key: "keySecret", label: "Key Secret", placeholder: "xxxxxxxx", secret: true },
    ],
  },
  paystack: {
    id: "paystack",
    label: "Paystack",
    icon: "CreditCard",
    color: "#0F4B3A",
    docsUrl: "https://dashboard.paystack.com/settings/keys",
    fields: [
      { key: "secretKey", label: "Secret Key", placeholder: "sk_test_xxx o sk_live_xxx", secret: true },
      { key: "publicKey", label: "Public Key", placeholder: "pk_test_xxx o pk_live_xxx" },
    ],
  },
  flutterwave: {
    id: "flutterwave",
    label: "Flutterwave",
    icon: "CreditCard",
    color: "#F5A623",
    docsUrl: "https://dashboard.flutterwave.com/developers/apikeys",
    fields: [
      { key: "secretKey", label: "Secret Key", placeholder: "FLWSECK-xxx", secret: true },
      { key: "publicKey", label: "Public Key", placeholder: "FLWPUBK-xxx" },
      { key: "encryptionKey", label: "Encryption Key", placeholder: "FLWSECK-xxx", secret: true },
    ],
  },
  mollie: {
    id: "mollie",
    label: "Mollie",
    icon: "CreditCard",
    color: "#C3002F",
    docsUrl: "https://www.mollie.com/dashboard/developers/api-keys",
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "test_xxx o live_xxx", secret: true },
    ],
  },
  paddle: {
    id: "paddle",
    label: "Paddle",
    icon: "CreditCard",
    color: "#3B5EE5",
    docsUrl: "https://www.paddle.com/billing/manage/api-keys",
    fields: [
      { key: "vendorId", label: "Vendor ID", placeholder: "12345" },
      { key: "apiKey", label: "API Key", placeholder: "xxxxxxxx", secret: true },
      { key: "clientSideToken", label: "Client-Side Token", placeholder: "xxxxxxxx" },
      { key: "environment", label: "Entorno", placeholder: "sandbox o production" },
    ],
  },
  klarna: {
    id: "klarna",
    label: "Klarna",
    icon: "CreditCard",
    color: "#FFB3C7",
    docsUrl: "https://docs.klarna.com/klarna-payments/integrate/",
    fields: [
      { key: "merchantId", label: "Merchant ID", placeholder: "xxxxxxxx" },
      { key: "apiKey", label: "API Key", placeholder: "xxxxxxxx", secret: true },
      { key: "environment", label: "Entorno", placeholder: "playground o production" },
    ],
  },
  dlocal: {
    id: "dlocal",
    label: "dLocal",
    icon: "CreditCard",
    color: "#00AEEF",
    docsUrl: "https://docs.dlocal.com/",
    fields: [
      { key: "secretKey", label: "Secret Key", placeholder: "xxxxxxxx", secret: true },
      { key: "login", label: "Login", placeholder: "tu@email.com" },
      { key: "countryCode", label: "Código de país", placeholder: "BR, MX, AR, CO..." },
    ],
  },
};

export function getProviderConfig(id: string): PaymentProviderConfig | undefined {
  return PAYMENT_PROVIDERS[id];
}

export function getActiveProvider(integrations: StorePaymentIntegration[]): StorePaymentIntegration | undefined {
  return integrations.find(i => i.enabled && i.isDefault) || integrations.find(i => i.enabled);
}
