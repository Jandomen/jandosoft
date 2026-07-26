import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Affiliate } from "@/lib/models/Affiliate";
import { Referral } from "@/lib/models/Referral";
import { Commission } from "@/lib/models/Commission";
import { AffiliatePayout } from "@/lib/models/AffiliatePayout";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const affiliateId = searchParams.get("affiliateId");

    if (!affiliateId) {
      return NextResponse.json({ error: "affiliateId required" }, { status: 400 });
    }

    await connectDB();

    const affiliate = await Affiliate.findById(affiliateId);
    if (!affiliate) {
      return NextResponse.json({ error: "Affiliate not found" }, { status: 404 });
    }

    const activeReferrals = await Referral.find({
      affiliateId,
      status: "active",
    }).sort({ createdAt: -1 });

    const recentCommissions = await Commission.find({
      affiliateId,
    }).sort({ createdAt: -1 }).limit(10);

    const payouts = await AffiliatePayout.find({
      affiliateId,
    }).sort({ createdAt: -1 }).limit(20);

    const totalPending = await Commission.aggregate([
      { $match: { affiliateId: affiliate._id, status: "pending" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const monthlyEarnings = await Commission.aggregate([
      {
        $match: {
          affiliateId: affiliate._id,
          status: { $in: ["pending", "approved"] },
          createdAt: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    return NextResponse.json({
      success: true,
      affiliate: {
        id: affiliate._id,
        code: affiliate.code,
        name: affiliate.name,
        email: affiliate.email,
        status: affiliate.status,
        commissionRate: affiliate.commissionRate,
        stripeAccountStatus: affiliate.stripeAccountStatus,
        totalEarnings: affiliate.totalEarnings,
        pendingBalance: affiliate.pendingBalance,
        paidBalance: affiliate.paidBalance,
        totalReferrals: affiliate.totalReferrals,
        activeReferrals: affiliate.activeReferrals,
      },
      stats: {
        activeReferralsCount: activeReferrals.length,
        pendingCommissions: totalPending[0]?.total || 0,
        monthlyEarnings: monthlyEarnings[0]?.total || 0,
      },
      recentCommissions: recentCommissions.map((c) => ({
        id: c._id,
        amount: c.amount,
        plan: c.plan,
        status: c.status,
        createdAt: c.createdAt,
      })),
      activeReferrals: activeReferrals.map((r) => ({
        id: r._id,
        email: r.referredUserEmail,
        plan: r.plan,
        startDate: r.startDate,
        totalCommissions: r.totalCommissions,
      })),
      payouts: payouts.map((p) => ({
        id: p._id,
        amount: p.amount,
        method: p.method,
        status: p.status,
        receiptNumber: p.receiptNumber,
        processedAt: p.processedAt,
        createdAt: p.createdAt,
      })),
    });
  } catch (error: any) {
    console.error("Error fetching affiliate dashboard:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}