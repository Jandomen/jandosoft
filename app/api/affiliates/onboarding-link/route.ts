import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Affiliate } from "@/lib/models/Affiliate";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const { affiliateId } = await req.json();
    if (!affiliateId) return NextResponse.json({ error: "affiliateId required" }, { status: 400 });

    await connectDB();
    const affiliate = await Affiliate.findById(affiliateId);
    if (!affiliate) return NextResponse.json({ error: "Affiliate not found" }, { status: 404 });

    if (!affiliate.stripeAccountId) {
      return NextResponse.json({ error: "No hay cuenta Stripe conectada" }, { status: 400 });
    }

    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

    const accountLink = await stripe.accountLinks.create({
      account: affiliate.stripeAccountId,
      refresh_url: `${origin}/affiliates?refresh=1`,
      return_url: `${origin}/affiliates?connected=1`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error: any) {
    console.error("Error creating onboarding link:", error);
    return NextResponse.json({ error: error.message || "Error creating onboarding link" }, { status: 500 });
  }
}
