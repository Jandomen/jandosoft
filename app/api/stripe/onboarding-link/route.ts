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
      return NextResponse.json({ error: "Store or Stripe account not found" }, { status: 404 });
    }

    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

    const accountLink = await stripe.accountLinks.create({
      account: store.stripeAccountId,
      refresh_url: `${origin}/dashboard`,
      return_url: `${origin}/dashboard`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error: any) {
    console.error("Error creating onboarding link:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
