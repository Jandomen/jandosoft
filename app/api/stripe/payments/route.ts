import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Payment } from "@/lib/models/Payment";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId");
    const email = searchParams.get("email");

    await connectDB();

    let filter: any = {};
    if (storeId) filter.storeId = storeId;
    if (email) filter.ownerEmail = email;

    const payments = await Payment.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    const totalRevenue = payments
      .filter((p: any) => p.status === "completed")
      .reduce((sum: number, p: any) => sum + p.amount, 0);

    const totalFees = payments
      .filter((p: any) => p.status === "completed")
      .reduce((sum: number, p: any) => sum + p.platformFee, 0);

    const totalNet = payments
      .filter((p: any) => p.status === "completed")
      .reduce((sum: number, p: any) => sum + p.netAmount, 0);

    return NextResponse.json({
      payments,
      stats: { totalRevenue, totalFees, totalNet, count: payments.length },
    });
  } catch (error: any) {
    console.error("Error fetching payments:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
