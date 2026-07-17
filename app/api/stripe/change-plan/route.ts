import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { stripe } from "@/lib/stripe";
import { getPlanConfig } from "@/lib/plan-config";
import { getAuthFromHeaders, getAuthFromCookies } from "@/lib/auth";

const USD_TO_MXN = 20.5;

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthFromHeaders(req) || await getAuthFromCookies();
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { newPlanId } = await req.json();
    if (!newPlanId) {
      return NextResponse.json({ error: "newPlanId required" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findById(auth.userId);
    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    if (!user.stripeSubscriptionId) {
      return NextResponse.json({ error: "No tienes una suscripción activa en Stripe" }, { status: 400 });
    }

    const config = await getPlanConfig();
    const newPlan = config.plans.find((p) => p.id === newPlanId);
    if (!newPlan || newPlan.price === 0) {
      return NextResponse.json({ error: "Plan no encontrado o es gratis" }, { status: 400 });
    }

    const currentPlanId = user.subscription;
    if (currentPlanId === newPlanId) {
      return NextResponse.json({ error: "Ya tienes este plan" }, { status: 400 });
    }

    try {
      await stripe.subscriptions.cancel(user.stripeSubscriptionId);
    } catch (err: any) {
      console.error("[ChangePlan] Error canceling old subscription:", err.message);
      return NextResponse.json({ error: "Error al cancelar suscripción anterior" }, { status: 500 });
    }

    const usdPrice = newPlan.priceUsd || newPlan.price;
    const mxnAmount = Math.round(usdPrice * USD_TO_MXN);
    if (mxnAmount < 10) {
      return NextResponse.json({ error: "El monto mínimo de pago es $10 pesos mexicanos." }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "mxn",
          product_data: { name: `Plan ${newPlan.name} - Jandosoft` },
          unit_amount: mxnAmount * 100,
          recurring: { interval: "month" },
        },
        quantity: 1,
      }],
      customer_email: user.email,
      success_url: `${baseUrl}/?stripe_success={CHECKOUT_SESSION_ID}&plan=${newPlanId}`,
      cancel_url: `${baseUrl}/?stripe_cancel=1`,
      metadata: { customerEmail: user.email, planId: newPlanId, planName: `Plan ${newPlan.name}` },
      subscription_data: { metadata: { customerEmail: user.email, planId: newPlanId } },
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error: any) {
    console.error("[ChangePlan] Error:", error?.message || error);
    return NextResponse.json({ error: error.message || "Error al cambiar plan" }, { status: 500 });
  }
}
