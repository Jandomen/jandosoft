import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Store } from "@/lib/models/Store";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const { storeId, amount, currency, customerEmail, customerName, description } = await req.json();
    if (!amount || !customerEmail) {
      return NextResponse.json({ error: "amount and customerEmail required" }, { status: 400 });
    }

    const amountInCents = Math.round(amount * 100);

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
        description: description || `Pago a ${store.name}`,
        metadata: {
          storeId: store._id.toString(),
          storeName: store.name,
          ownerEmail: store.ownerEmail,
          customerEmail,
          customerName: customerName || "",
          platformFeePercent: feePercent.toString(),
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
      description: description || "Pago a Jandosoft",
      metadata: {
        customerEmail,
        customerName: customerName || "",
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
