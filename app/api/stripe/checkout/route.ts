import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Store } from "@/lib/models/Store";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const { storeId, items, amount, currency, customerEmail, customerName, description } = await req.json();
    if (!customerEmail) {
      return NextResponse.json({ error: "customerEmail required" }, { status: 400 });
    }

    // Support both single-item (legacy) and multi-item (cart) checkout
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

    // If storeId provided, use Stripe Connect (transfer to store)
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

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: (currency || "usd").toLowerCase(),
        application_fee_amount: applicationFee,
        description: (desc || `Pago a ${store.name}`).substring(0, 250),
        metadata: {
          storeId: store._id.toString(),
          storeName: store.name,
          ownerEmail: store.ownerEmail,
          customerEmail,
          customerName: customerName || "",
          platformFeePercent: feePercent.toString(),
          items: itemsList ? JSON.stringify(itemsList) : "",
        },
        transfer_data: {
          destination: store.stripeAccountId,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: amountInCents,
        applicationFee,
      });
    }

    // Direct payment (no store) — for platform plan purchases
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: (currency || "usd").toLowerCase(),
      description: (desc || "Pago a Jandosoft").substring(0, 250),
      metadata: {
        customerEmail,
        customerName: customerName || "",
        items: itemsList ? JSON.stringify(itemsList) : "",
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: amountInCents,
    });
  } catch (error: any) {
    console.error("Error creating payment intent:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
