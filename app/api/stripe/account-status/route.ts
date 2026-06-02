import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Store } from "@/lib/models/Store";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const { storeId } = await req.json();
    if (!storeId) {
      return NextResponse.json({ error: "storeId required" }, { status: 400 });
    }

    await connectDB();
    const store = await Store.findById(storeId);
    if (!store || !store.stripeAccountId) {
      return NextResponse.json({ onboarded: false, error: "No Stripe account" });
    }

    const account = await stripe.accounts.retrieve(store.stripeAccountId);

    const onboarded =
      account.charges_enabled &&
      account.payouts_enabled &&
      account.details_submitted;

    return NextResponse.json({
      onboarded,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
    });
  } catch (error: any) {
    console.error("Error checking account status:", error);
    return NextResponse.json({ onboarded: false, error: error.message }, { status: 500 });
  }
}
