import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Store } from "@/lib/models/Store";
import { Payment } from "@/lib/models/Payment";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature") || "";

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    await connectDB();

    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object;
        const metadata = pi.metadata;

        if (metadata.storeId) {
          const feePercent = parseFloat(metadata.platformFeePercent || "5");
          const amount = pi.amount / 100;
          const platformFee = (pi.application_fee_amount || Math.round(amount * (feePercent / 100))) / 100;
          const netAmount = amount - platformFee;

          await Payment.create({
            storeId: metadata.storeId,
            storeName: metadata.storeName || "",
            ownerEmail: metadata.ownerEmail || "",
            customerEmail: metadata.customerEmail || "",
            customerName: metadata.customerName || "",
            amount,
            currency: pi.currency,
            platformFee,
            netAmount,
            stripePaymentIntentId: pi.id,
            stripeAccountId: pi.transfer_data?.destination || "",
            status: "completed",
            description: pi.description || "",
          });
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const failedPi = event.data.object;
        await Payment.findOneAndUpdate(
          { stripePaymentIntentId: failedPi.id },
          { status: "failed" }
        );
        break;
      }

      case "account.updated": {
        const account = event.data.object;
        await Store.findOneAndUpdate(
          { stripeAccountId: account.id },
          {
            paymentsEnabled:
              account.charges_enabled &&
              account.payouts_enabled &&
              account.details_submitted,
          }
        );
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
