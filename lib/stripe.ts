import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
});

export const PLATFORM_FEE_PERCENT = 5;

export function calculateFee(amount: number, feePercent: number = PLATFORM_FEE_PERCENT): number {
  return Math.round(amount * (feePercent / 100));
}
