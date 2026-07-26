import { connectDB } from "@/lib/mongodb";
import { Affiliate } from "@/lib/models/Affiliate";
import { Referral } from "@/lib/models/Referral";
import { Commission } from "@/lib/models/Commission";

export async function generateCommissionForPayment(
  userId: string,
  plan: string,
  planPrice: number,
  stripePaymentIntentId: string
) {
  try {
    await connectDB();

    const referral = await Referral.findOne({
      referredUserId: userId,
      status: { $in: ["pending", "active"] },
    });

    if (!referral) {
      return null;
    }

    const affiliate = await Affiliate.findById(referral.affiliateId);
    if (!affiliate || affiliate.status !== "active") {
      return null;
    }

    const commissionAmount = Math.round(planPrice * (affiliate.commissionRate / 100) * 100) / 100;

    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const existingCommission = await Commission.findOne({
      referralId: referral._id,
      period,
    });

    if (existingCommission) {
      return null;
    }

    const commission = new Commission({
      affiliateId: affiliate._id,
      referralId: referral._id,
      referredUserId: userId,
      amount: commissionAmount,
      percentage: affiliate.commissionRate,
      plan,
      planPrice,
      period,
      stripePaymentIntentId,
      status: "pending",
    });

    await commission.save();

    await Referral.findByIdAndUpdate(referral._id, {
      status: "active",
      plan,
      planPrice,
      totalCommissions: (referral.totalCommissions || 0) + commissionAmount,
      lastCommissionDate: now,
    });

    await Affiliate.findByIdAndUpdate(affiliate._id, {
      $inc: {
        totalEarnings: commissionAmount,
        pendingBalance: commissionAmount,
        activeReferrals: referral.status === "pending" ? 1 : 0,
      },
    });

    console.log(`Commission generated: $${commissionAmount} for affiliate ${affiliate.code}`);

    return commission;
  } catch (error) {
    console.error("Error generating commission:", error);
    return null;
  }
}