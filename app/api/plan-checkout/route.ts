import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { stripe } from "@/lib/stripe";
import { getPlanConfig } from "@/lib/plan-config";

export async function POST(req: NextRequest) {
  try {
    const { email, name, planId, paymentMethod, amount, currency } = await req.json();
    if (!email || !planId) {
      return NextResponse.json({ error: "email and planId required" }, { status: 400 });
    }

    const config = await getPlanConfig();
    const plan = config.plans.find((p: any) => p.id === planId);
    if (!plan || plan.price === 0) {
      return NextResponse.json({ error: "Plan not found or is free" }, { status: 400 });
    }

    const usdPrice = amount || plan.priceUsd || plan.price;
    if (!usdPrice || usdPrice <= 0) {
      return NextResponse.json({ error: "Plan sin precio configurado" }, { status: 400 });
    }
    if (usdPrice < 0.50) {
      return NextResponse.json({ error: `El precio mínimo en Stripe es $0.50 USD. Precio actual: $${usdPrice} USD.` }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
    const finalCurrency = "usd";

    if (paymentMethod === "stripe" || !paymentMethod) {
      await connectDB();
      let user = await User.findOne({ email });
      let stripeCustomerId = user?.stripeCustomerId;

      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email,
          name: name || undefined,
          metadata: { userId: user?._id?.toString() || "" },
        });
        stripeCustomerId = customer.id;
        if (user) await User.findByIdAndUpdate(user._id, { stripeCustomerId });
      }

      const amountInCents = Math.round(usdPrice * 100);

      if (plan.stripePriceIdUsd) {
        const session = await stripe.checkout.sessions.create({
          mode: "subscription",
          payment_method_types: ["card"],
          line_items: [{ price: plan.stripePriceIdUsd, quantity: 1 }],
          customer: stripeCustomerId,
          success_url: `${baseUrl}/?stripe_success={CHECKOUT_SESSION_ID}&plan=${planId}`,
          cancel_url: `${baseUrl}/?stripe_cancel=1`,
          metadata: { customerEmail: email, planId, planName: `Plan ${plan.name}` },
          subscription_data: { metadata: { customerEmail: email, planId } },
        });
        return NextResponse.json({ url: session.url, sessionId: session.id });
      }

      if (plan.stripePriceId) {
        const session = await stripe.checkout.sessions.create({
          mode: "subscription",
          payment_method_types: ["card"],
          line_items: [{ price: plan.stripePriceId, quantity: 1 }],
          customer: stripeCustomerId,
          success_url: `${baseUrl}/?stripe_success={CHECKOUT_SESSION_ID}&plan=${planId}`,
          cancel_url: `${baseUrl}/?stripe_cancel=1`,
          metadata: { customerEmail: email, planId, planName: `Plan ${plan.name}` },
          subscription_data: { metadata: { customerEmail: email, planId } },
        });
        return NextResponse.json({ url: session.url, sessionId: session.id });
      }

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [{
          price_data: {
            currency: finalCurrency,
            product_data: { name: `Plan ${plan.name} - Jandosoft` },
            unit_amount: amountInCents,
          },
          quantity: 1,
        }],
        customer_email: email,
        success_url: `${baseUrl}/?stripe_success={CHECKOUT_SESSION_ID}&plan=${planId}`,
        cancel_url: `${baseUrl}/?stripe_cancel=1`,
        metadata: { customerEmail: email, planId, planName: `Plan ${plan.name}`, type: "plan_purchase" },
      });
      return NextResponse.json({ url: session.url, sessionId: session.id });
    }

    if (paymentMethod === "nowpayments") {
      const apiKey = process.env.NOWPAYMENTS_API_KEY;
      if (!apiKey) {
        return NextResponse.json({ error: "Pagos con cripto no disponibles actualmente" }, { status: 400 });
      }

      const orderId = `PLAN-${planId}-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

      const res = await fetch("https://api.nowpayments.io/v1/invoice", {
        method: "POST",
        headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          price_amount: usdPrice,
          price_currency: "usd",
          order_id: orderId,
          order_description: `Plan ${plan.name} - Jandosoft`,
          ipn_callback_url: `${baseUrl}/api/nowpayments/webhook`,
          customer_email: email,
        }),
      });
      const data = await res.json();
      if (data.invoice_url) {
        return NextResponse.json({ url: data.invoice_url, id: orderId });
      }
      return NextResponse.json({ error: data.message || "Error creando factura" }, { status: 400 });
    }

    return NextResponse.json({ error: "Método de pago no soportado" }, { status: 400 });
  } catch (error: any) {
    console.error("[PlanCheckout] Error:", error?.message || error, error?.type, error?.code);
    if (error?.message?.includes("No such price")) {
      return NextResponse.json({ error: "El plan no está sincronizado con Stripe. Ve a Admin → Planes → SINCRONIZAR CON STRIPE." }, { status: 400 });
    }
    if (error?.message?.includes("amount_too_small")) {
      return NextResponse.json({ error: "El monto es menor al mínimo de Stripe ($0.50 USD). Sube el precio del plan." }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "Error al crear sesión de pago" }, { status: 500 });
  }
}
