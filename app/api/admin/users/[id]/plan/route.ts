import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { subscription, subscriptionExpiry } = body;

    if (!subscription && !subscriptionExpiry) {
      return NextResponse.json({ error: "subscription or subscriptionExpiry required" }, { status: 400 });
    }

    await connectDB();

    const update: Record<string, any> = {};
    if (subscription) update.subscription = subscription;
    if (subscriptionExpiry) update.subscriptionExpiry = new Date(subscriptionExpiry);

    const user = await User.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: { id: (user as any)._id, email: (user as any).email, subscription: (user as any).subscription, subscriptionExpiry: (user as any).subscriptionExpiry } });
  } catch (error) {
    console.error("PATCH user plan error:", error);
    return NextResponse.json({ error: "Error updating user plan" }, { status: 500 });
  }
}
