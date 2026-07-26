import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Affiliate } from "@/lib/models/Affiliate";
import { Commission } from "@/lib/models/Commission";
import { AffiliatePayout } from "@/lib/models/AffiliatePayout";
import { User } from "@/lib/models/User";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const { affiliateId, amount, method } = await req.json();

    if (!affiliateId || !amount) {
      return NextResponse.json({ error: "affiliateId and amount required" }, { status: 400 });
    }

    if (amount < 50) {
      return NextResponse.json({ error: "Minimum withdrawal is $50" }, { status: 400 });
    }

    await connectDB();

    const affiliate = await Affiliate.findById(affiliateId);
    if (!affiliate) {
      return NextResponse.json({ error: "Affiliate not found" }, { status: 404 });
    }

    const user = await User.findById(affiliate.userId);
    if (!user || !user.emailVerified) {
      return NextResponse.json({ error: "Email not verified. Please verify your email before withdrawing." }, { status: 403 });
    }

    if (affiliate.pendingBalance < amount) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }

    if (method === "stripe" && !affiliate.stripeAccountId) {
      return NextResponse.json({ error: "Stripe account not connected" }, { status: 400 });
    }

    const pendingCommissions = await Commission.find({
      affiliateId,
      status: "pending",
    }).sort({ createdAt: 1 });

    let remaining = amount;
    const commissionIds: string[] = [];

    for (const commission of pendingCommissions) {
      if (remaining <= 0) break;
      commissionIds.push(commission._id.toString());
      remaining -= commission.amount;
    }

    const now = new Date();
    const receiptNumber = `AF-RCP-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    const payout = new AffiliatePayout({
      affiliateId,
      amount,
      method: method || "stripe",
      status: "processing",
      commissions: commissionIds,
      receiptNumber,
    });

    await payout.save();

    await Commission.updateMany(
      { _id: { $in: commissionIds } },
      { $set: { status: "approved", payoutId: payout._id } }
    );

    await Affiliate.findByIdAndUpdate(affiliateId, {
      $inc: { pendingBalance: -amount },
    });

    if (method === "stripe" && affiliate.stripeAccountId) {
      try {
        const transfer = await stripe.transfers.create({
          amount: Math.round(amount * 100),
          currency: "mxn",
          destination: affiliate.stripeAccountId,
          metadata: {
            affiliateId: affiliate._id.toString(),
            payoutId: payout._id.toString(),
          },
        });

        await AffiliatePayout.findByIdAndUpdate(payout._id, {
          status: "completed",
          stripeTransferId: transfer.id,
          processedAt: new Date(),
          receiptSentAt: new Date(),
        });

        await Commission.updateMany(
          { _id: { $in: commissionIds } },
          { $set: { status: "paid", paidAt: new Date() } }
        );

        await Affiliate.findByIdAndUpdate(affiliateId, {
          $inc: { paidBalance: amount },
          $set: { lastPayoutDate: new Date() },
        });
      } catch (stripeError: any) {
        console.error("Stripe transfer failed:", stripeError);
        await AffiliatePayout.findByIdAndUpdate(payout._id, {
          status: "failed",
          notes: stripeError.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      payout: {
        id: payout._id,
        amount: payout.amount,
        method: payout.method,
        status: payout.status,
      },
    });
  } catch (error: any) {
    console.error("Error processing withdrawal:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}