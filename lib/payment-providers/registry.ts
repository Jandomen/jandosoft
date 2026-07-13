import type { PaymentProvider, StorePaymentIntegration, CheckoutRequest, CheckoutResult } from "./index";
import { stripeProvider } from "./stripe";
import { paypalProvider } from "./paypal";
import { mercadopagoProvider } from "./mercadopago";
import { nowpaymentsProvider } from "./nowpayments";

const providers: Record<string, PaymentProvider> = {
  stripe: stripeProvider,
  paypal: paypalProvider,
  mercadopago: mercadopagoProvider,
  nowpayments: nowpaymentsProvider,
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
  const active = integrations.find(i => i.enabled && i.isDefault) || integrations.find(i => i.enabled);
  if (!active) return { error: "No hay proveedor de pagos configurado o activo" };

  const provider = providers[active.provider];
  if (!provider) return { error: `Proveedor '${active.provider}' no disponible` };

  return provider.createCheckout(req, active.credentials);
}

export function getDefaultProvider(integrations: StorePaymentIntegration[]): StorePaymentIntegration | undefined {
  return integrations.find(i => i.enabled && i.isDefault) || integrations.find(i => i.enabled);
}
