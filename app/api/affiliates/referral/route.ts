import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Affiliate } from "@/lib/models/Affiliate";
import { Referral } from "@/lib/models/Referral";

export async function POST(req: NextRequest) {
  try {
    const { code, userId, email } = await req.json();

    if (!code || !userId || !email) {
      return NextResponse.json({ error: "code, userId and email required" }, { status: 400 });
    }

    await connectDB();

    const affiliate = await Affiliate.findOne({ code: code.toUpperCase() });
    if (!affiliate) {
      return NextResponse.json({ error: "Invalid referral code" }, { status: 404 });
    }

    const existingReferral = await Referral.findOne({ referredUserId: userId });
    if (existingReferral) {
      return NextResponse.json({ error: "User already referred" }, { status: 409 });
    }

    const referral = new Referral({
      affiliateId: affiliate._id,
      referredUserId: userId,
      referredUserEmail: email,
      plan: "pending",
      planPrice: 0,
      status: "pending",
    });

    await referral.save();

    await Affiliate.findByIdAndUpdate(affiliate._id, {
      $inc: { totalReferrals: 1 },
    });

    return NextResponse.json({
      success: true,
      referral: {
        id: referral._id,
        affiliateCode: affiliate.code,
        status: referral.status,
      },
    });
  } catch (error: any) {
    console.error("Error tracking referral:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}