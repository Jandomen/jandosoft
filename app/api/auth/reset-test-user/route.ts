import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";

export async function POST(req: NextRequest) {
  try {
    const { email, secret } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "email required" }, { status: 400 });
    }

    if (secret !== process.env.RESET_TEST_SECRET) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    await connectDB();

    const result = await User.findOneAndUpdate(
      { email },
      {
        $set: {
          subscription: null,
          plan: null,
          planStatus: null,
          subscriptionStatus: null,
          stripeSubscriptionId: null,
          stripeCustomerId: null,
          customerId: null,
          subscriptionExpiry: null,
          expiresAt: null,
          billingPeriod: null,
          updatedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!result) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `User ${email} reset to free plan`,
    });
  } catch (error: any) {
    console.error("[ResetTestUser] Error:", error?.message || error);
    return NextResponse.json({ error: error.message || "Error resetting user" }, { status: 500 });
  }
}
