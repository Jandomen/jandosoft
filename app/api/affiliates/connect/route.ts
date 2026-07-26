import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Affiliate } from "@/lib/models/Affiliate";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const { affiliateId } = await req.json();

    if (!affiliateId) {
      return NextResponse.json({ error: "affiliateId required" }, { status: 400 });
    }

    await connectDB();

    const affiliate = await Affiliate.findById(affiliateId);
    if (!affiliate) {
      return NextResponse.json({ error: "Affiliate not found" }, { status: 404 });
    }

    let accountId = affiliate.stripeAccountId;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: affiliate.email,
        metadata: {
          affiliateId: affiliate._id.toString(),
          affiliateCode: affiliate.code,
        },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: "individual",
        business_profile: {
          name: affiliate.name,
          product_description: "Jandosoft Affiliate Commission",
        },
      });

      accountId = account.id;

      await Affiliate.findByIdAndUpdate(affiliateId, {
        stripeAccountId: accountId,
        stripeAccountStatus: "pending",
      });
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/affiliates?refresh=1`,
      return_url: `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/affiliates?connected=1`,
      type: "account_onboarding",
    });

    return NextResponse.json({
      success: true,
      url: accountLink.url,
      accountId,
    });
  } catch (error: any) {
    console.error("Error creating Stripe Connect account:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}