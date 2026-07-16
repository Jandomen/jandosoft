import type { PaymentProvider, StorePaymentIntegration, CheckoutRequest, CheckoutResult } from "./index";
import { stripeProvider } from "./stripe";
import { paypalProvider } from "./paypal";
import { mercadopagoProvider } from "./mercadopago";
import { nowpaymentsProvider } from "./nowpayments";
import { squareProvider } from "./square";
import { razorpayProvider } from "./razorpay";
import { paystackProvider } from "./paystack";
import { flutterwaveProvider } from "./flutterwave";
import { mollieProvider } from "./mollie";
import { paddleProvider } from "./paddle";
import { klarnaProvider } from "./klarna";
import { dlocalProvider } from "./dlocal";

const providers: Record<string, PaymentProvider> = {
  stripe: stripeProvider,
  paypal: paypalProvider,
  mercadopago: mercadopagoProvider,
  nowpayments: nowpaymentsProvider,
  square: squareProvider,
  razorpay: razorpayProvider,
  paystack: paystackProvider,
  flutterwave: flutterwaveProvider,
  mollie: mollieProvider,
  paddle: paddleProvider,
  klarna: klarnaProvider,
  dlocal: dlocalProvider,
};

export function getProvider(id: string): PaymentProvider | undefined {
  return providers[id];
}

export function getAllProviders(): PaymentProvider[] {
  return Object.values(providers);
}

export async function validateProvider(id: string, credentials: Record<string, string>): Promise<boolean> {
  const provider = providers[id];
  if (!provider) return false;
  return provider.validateCredentials(credentials);
}

export async function createProviderCheckout(
  integrations: StorePaymentIntegration[],
  req: CheckoutRequest
): Promise<CheckoutResult> {
  let active: StorePaymentIntegration | undefined;

  if (req.paymentMethod) {
    active = integrations.find(i => i.enabled && i.provider === req.paymentMethod);
  }
  if (!active) {
    active = integrations.find(i => i.enabled && i.isDefault) || integrations.find(i => i.enabled);
  }
  if (!active) return { error: "No hay proveedor de pagos configurado o activo" };

  const provider = providers[active.provider];
  if (!provider) return { error: `Proveedor '${active.provider}' no disponible` };

  return provider.createCheckout(req, active.credentials);
}

export function getDefaultProvider(integrations: StorePaymentIntegration[]): StorePaymentIntegration | undefined {
  return integrations.find(i => i.enabled && i.isDefault) || integrations.find(i => i.enabled);
}
