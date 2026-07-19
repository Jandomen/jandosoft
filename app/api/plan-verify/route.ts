/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { stripe } from "@/lib/stripe";
import { PLANS } from "@/lib/plans";

export async function POST(req: NextRequest) {
  try {
    const { sessionId, email } = await req.json();
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    }

    await connectDB();

    let session;
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["subscription", "customer"],
      });
    } catch {
      return NextResponse.json({ error: "Invalid session" }, { status: 400 });
    }

    if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") {
      return NextResponse.json({ error: "Payment not completed", status: session.payment_status }, { status: 400 });
    }

    const metadata = session.metadata || {};
    const planId = metadata.planId;
    const userId = metadata.userId || null;
    const customerEmail = email || metadata.customerEmail || (session.customer_details as any)?.email || null;
    const customerId = (session.customer as string) || null;

    if (!planId) {
      return NextResponse.json({ error: "No plan in session metadata" }, { status: 400 });
    }

    const plan = PLANS.find((p) => p.id === planId);
    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 400 });
    }

    let updateData: any = {
      subscription: planId,
      plan: planId,
      planStatus: "active",
      subscriptionStatus: "active",
      updatedAt: new Date(),
    };

    if (session.mode === "payment" && plan.durationDays) {
      const now = new Date();
      const expiry = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);
      updateData.subscriptionExpiry = expiry;
      updateData.expiresAt = expiry;
      updateData.billingPeriod = `${plan.durationDays}_days`;
      if (customerId) {
        updateData.stripeCustomerId = customerId;
        updateData.customerId = customerId;
      }
      if (session.payment_intent) {
        updateData.stripeSubscriptionId = session.payment_intent as string;
      }
    } else if (session.subscription) {
      const subId = session.subscription as string;
      try {
        const sub = await stripe.subscriptions.retrieve(subId) as any;
        const periodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        updateData.subscriptionExpiry = periodEnd;
        updateData.expiresAt = periodEnd;
        updateData.stripeSubscriptionId = subId;
        updateData.billingPeriod = sub.items?.data?.[0]?.plan?.interval || "month";
        if (customerId) {
          updateData.stripeCustomerId = customerId;
          updateData.customerId = customerId;
        }
      } catch {}
    }

    let result = null;
    if (userId) {
      result = await User.findByIdAndUpdate(userId, { $set: updateData }, { new: true });
    }
    if (!result && customerEmail) {
      result = await User.findOneAndUpdate({ email: customerEmail }, { $set: updateData }, { new: true });
    }
    if (!result && customerId) {
      result = await User.findOneAndUpdate({ stripeCustomerId: customerId }, { $set: updateData }, { new: true });
    }

    if (!result) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log(`[PlanVerify] Plan activated: ${planId} -> user=${customerEmail || userId}`);

    return NextResponse.json({
      success: true,
      subscription: planId,
      planStatus: "active",
      subscriptionExpiry: updateData.subscriptionExpiry || null,
    });
  } catch (error: any) {
    console.error("[PlanVerify] Error:", error?.message || error);
    return NextResponse.json({ error: error.message || "Verification failed" }, { status: 500 });
  }
}
