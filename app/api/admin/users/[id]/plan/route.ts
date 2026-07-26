import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { verifyAdminAuth } from "@/lib/admin-middleware";
import { getPlanConfig } from "@/lib/plan-config";
import { invalidatePlanCache } from "@/lib/plan-config";
import { emitUserEvent } from "@/lib/socket-server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await verifyAdminAuth(req);
  if ("error" in authResult) return authResult.error;

  try {
    const { id } = await params;
    const body = await req.json();
    const { subscription, subscriptionExpiry } = body;

    if (!subscription && !subscriptionExpiry) {
      return NextResponse.json({ error: "subscription or subscriptionExpiry required" }, { status: 400 });
    }

    await connectDB();

    const update: Record<string, any> = {};
    if (subscription) {
      update.subscription = subscription;
      update.plan = subscription;
      update.planStatus = "active";
      update.subscriptionStatus = "active";
      // Save original plan info if user doesn't have one yet
      const existingUser = await User.findById(id).lean();
      if (existingUser && !(existingUser as any).originalPlan && subscription !== "free") {
        const config = await getPlanConfig();
        const plan = config.plans.find((p) => p.id === subscription);
        if (plan) {
          update.originalPlan = plan.id;
          update.originalPlanName = plan.name;
          update.originalPlanPrice = plan.priceUsd || plan.price;
        }
      }
    }
    if (subscriptionExpiry) {
      update.subscriptionExpiry = new Date(subscriptionExpiry);
      update.expiresAt = new Date(subscriptionExpiry);
    } else if (subscription && subscription !== "free") {
      // Default to 30 days from now for paid plans
      const defaultExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      update.subscriptionExpiry = defaultExpiry;
      update.expiresAt = defaultExpiry;
    }

    const user = await User.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    emitUserEvent(String(user.email), "user-updated", {
      subscription: (user as any).subscription,
      subscriptionExpiry: (user as any).subscriptionExpiry,
      subscriptionStatus: (user as any).subscriptionStatus,
    });

    return NextResponse.json({ success: true, user: { id: (user as any)._id, email: (user as any).email, subscription: (user as any).subscription, subscriptionExpiry: (user as any).subscriptionExpiry } });
  } catch (error) {
    console.error("PATCH user plan error:", error);
    return NextResponse.json({ error: "Error updating user plan" }, { status: 500 });
  }
}
