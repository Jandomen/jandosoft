/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { stripe } from "@/lib/stripe";

const STRIPE_SUPPORTED = new Set([
  "usd", "eur", "gbp", "cad", "aud", "nzd", "sgd", "hkd", "chf", "sek", "nok", "dkk", "pln", "czk", "huf", "ron", "bgd", "hrk",
  "mxn", "brl", "ars", "clp", "cop", "pen", "uyu", "pyg", "bob", "crc", "gtq", "hnl", "nio", "svc", "pab",
  "jpy", "cny", "krw", "inr", "idr", "myr", "php", "thb", "vnd", "twd", "pkr", "bdt", "lkr", "npr", "kes", "ngn", "zar", "egp", "mad", "tnd",
  "try", "rub", "uah", "kzt", "azn", "georg", "am", "ils", "sar", "qar", "aed", "omr", "bhd", "kwd", "jod", "lbp",
  "isk", "mnt", "lak", "mmk", "khr", "btn", "mvr", "xaf", "xof", "xpf",
]);
function safeCurrency(c?: string): string {
  const v = (c || "usd").toLowerCase();
  return STRIPE_SUPPORTED.has(v) ? v : "usd";
}

export async function POST(req: NextRequest) {
  try {
    const { items, amount, currency, customerEmail, customerName, description, priceId, planId, userId, organizationId } = await req.json();
    if (!customerEmail) {
      return NextResponse.json({ error: "customerEmail required" }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

    if (priceId) {
      await connectDB();
      const user = userId ? await User.findById(userId) : await User.findOne({ email: customerEmail });
      let stripeCustomerId = user?.stripeCustomerId;

      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: customerEmail,
          name: customerName || undefined,
          metadata: { userId: user?._id?.toString() || "" },
        });
        stripeCustomerId = customer.id;
        if (user) {
          await User.findByIdAndUpdate(user._id, { stripeCustomerId, customerId: customer.id });
        }
      }

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [{ price: priceId, quantity: 1 }],
        customer: stripeCustomerId,
        success_url: `${baseUrl}/?stripe_success={CHECKOUT_SESSION_ID}&plan=${planId}`,
        cancel_url: `${baseUrl}/?stripe_cancel=1`,
        metadata: {
          customerEmail,
          planId: planId || "",
          planName: description || "",
          userId: user?._id?.toString() || "",
          organizationId: organizationId || "",
        },
        subscription_data: {
          metadata: {
            customerEmail,
            planId: planId || "",
            userId: user?._id?.toString() || "",
            organizationId: organizationId || "",
          },
        },
      });

      return NextResponse.json({ url: session.url, sessionId: session.id });
    }

    let totalAmount = amount;
    let desc = description;

    if (items && Array.isArray(items) && items.length > 0) {
      totalAmount = items.reduce((sum: number, i: any) => sum + (i.price * i.quantity), 0);
      desc = items.map((i: any) => `${i.quantity}x ${i.name}`).join(", ");
    }

    if (!totalAmount) {
      return NextResponse.json({ error: "amount or items required" }, { status: 400 });
    }

    const amountInCents = Math.round(totalAmount * 100);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: safeCurrency(currency),
          product_data: {
            name: desc?.substring(0, 150) || "Pago Jandosoft",
          },
          unit_amount: amountInCents,
        },
        quantity: 1,
      }],
      customer_email: customerEmail,
      success_url: `${baseUrl}/?stripe_success={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/?stripe_cancel=1`,
      metadata: {
        customerEmail,
        customerName: customerName || "",
        items: items ? JSON.stringify(items) : "",
      },
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
