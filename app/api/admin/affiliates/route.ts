import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Affiliate } from "@/lib/models/Affiliate";
import { Referral } from "@/lib/models/Referral";
import { Commission } from "@/lib/models/Commission";
import { AffiliatePayout } from "@/lib/models/AffiliatePayout";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const affiliates = await Affiliate.find({}).sort({ createdAt: -1 });

    const totalAffiliates = affiliates.length;
    const activeAffiliates = affiliates.filter((a) => a.status === "active").length;
    const totalReferrals = affiliates.reduce((sum, a) => sum + (a.totalReferrals || 0), 0);

    const pendingPayouts = await AffiliatePayout.aggregate([
      { $match: { status: { $in: ["pending", "processing"] } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const totalCommissionsPaid = await Commission.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    return NextResponse.json({
      success: true,
      affiliates,
      stats: {
        totalAffiliates,
        activeAffiliates,
        totalCommissionsPaid: totalCommissionsPaid[0]?.total || 0,
        pendingPayouts: pendingPayouts[0]?.total || 0,
        totalReferrals,
      },
    });
  } catch (error: any) {
    console.error("Error fetching affiliates:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { affiliateId, status, commissionRate } = await req.json();

    if (!affiliateId) {
      return NextResponse.json({ error: "affiliateId required" }, { status: 400 });
    }

    await connectDB();

    const updateData: any = {};
    if (status) updateData.status = status;
    if (commissionRate !== undefined) {
      if (commissionRate < 0 || commissionRate > 100) {
        return NextResponse.json({ error: "Commission rate must be between 0 and 100" }, { status: 400 });
      }
      updateData.commissionRate = commissionRate;
    }

    const affiliate = await Affiliate.findByIdAndUpdate(
      affiliateId,
      updateData,
      { new: true }
    );

    if (!affiliate) {
      return NextResponse.json({ error: "Affiliate not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      affiliate,
    });
  } catch (error: any) {
    console.error("Error updating affiliate:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}