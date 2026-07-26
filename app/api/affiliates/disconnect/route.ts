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

    const hadConnect = !!affiliate.stripeAccountId;

    if (affiliate.stripeAccountId) {
      try {
        await stripe.accounts.del(affiliate.stripeAccountId);
      } catch (e) {
        console.error("Failed to delete Stripe account remotely (continuing with local cleanup):", e);
      }
    }

    await Affiliate.findByIdAndUpdate(affiliateId, {
      $unset: {
        stripeAccountId: "",
        stripeAccountStatus: "",
      },
    });

    return NextResponse.json({ success: true, hadConnect });
  } catch (error: any) {
    console.error("Error disconnecting Stripe:", error);
    return NextResponse.json({ error: error.message || "Error al desconectar" }, { status: 500 });
  }
}
