import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Store } from "@/lib/models/Store";
import { User } from "@/lib/models/User";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const { storeId, items, amount, currency, customerEmail, customerName, description, priceId, planId } = await req.json();
    if (!customerEmail) {
      return NextResponse.json({ error: "customerEmail required" }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

    if (priceId) {
      await connectDB();
      let user = await User.findOne({ email: customerEmail });
      let stripeCustomerId = user?.stripeCustomerId;

      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: customerEmail,
          name: customerName || undefined,
          metadata: { userId: user?._id?.toString() || "" },
        });
        stripeCustomerId = customer.id;
        if (user) {
          await User.findByIdAndUpdate(user._id, { stripeCustomerId });
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
        },
        subscription_data: {
          metadata: {
            customerEmail,
            planId: planId || "",
          },
        },
      });

      return NextResponse.json({ url: session.url, sessionId: session.id });
    }

    let totalAmount = amount;
    let itemsList = items;
    let desc = description;

    if (items && Array.isArray(items) && items.length > 0) {
      totalAmount = items.reduce((sum: number, i: any) => sum + (i.price * i.quantity), 0);
      itemsList = items;
      desc = items.map((i: any) => `${i.quantity}x ${i.name}`).join(", ");
    }

    if (!totalAmount) {
      return NextResponse.json({ error: "amount or items required" }, { status: 400 });
    }

    const amountInCents = Math.round(totalAmount * 100);

    const sessionParams: any = {
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: (currency || "usd").toLowerCase(),
          product_data: {
            name: desc?.substring(0, 150) || "Pago Jandosoft",
          },
          unit_amount: amountInCents,
        },
        quantity: 1,
      }],
      customer_email: customerEmail,
      customer_name: customerName || undefined,
      success_url: `${baseUrl}/?stripe_success={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/?stripe_cancel=1`,
      metadata: {
        customerEmail,
        customerName: customerName || "",
        items: itemsList ? JSON.stringify(itemsList) : "",
      },
    };

    if (storeId) {
      await connectDB();
      const store = await Store.findById(storeId);
      if (!store) {
        return NextResponse.json({ error: "Store not found" }, { status: 404 });
      }
      if (!store.stripeAccountId || !store.paymentsEnabled) {
        return NextResponse.json({ error: "Store payments not enabled" }, { status: 400 });
      }

      const feePercent = store.platformFeePercent ?? 5;
      const applicationFee = Math.round(amountInCents * (feePercent / 100));

      sessionParams.payment_intent_data = {
        transfer_data: { destination: store.stripeAccountId },
        application_fee_amount: applicationFee,
        metadata: {
          storeId: store._id.toString(),
          storeName: store.name,
          ownerEmail: store.ownerEmail,
          customerEmail,
          customerName: customerName || "",
          platformFeePercent: feePercent.toString(),
          items: itemsList ? JSON.stringify(itemsList) : "",
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
