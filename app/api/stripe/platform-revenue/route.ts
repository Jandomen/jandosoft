import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Payment } from "@/lib/models/Payment";

export async function GET() {
  try {
    await connectDB();

    const payments = await Payment.find({ status: "completed" })
      .sort({ createdAt: -1 })
      .lean();

    const totalPlatformRevenue = payments.reduce(
      (sum: number, p: any) => sum + p.platformFee,
      0
    );

    const totalProcessed = payments.reduce(
      (sum: number, p: any) => sum + p.amount,
      0
    );

    const byStore = payments.reduce((acc: any, p: any) => {
      const name = p.storeName || "Unknown";
      if (!acc[name]) acc[name] = { revenue: 0, fees: 0, count: 0 };
      acc[name].revenue += p.amount;
      acc[name].fees += p.platformFee;
      acc[name].count += 1;
      return acc;
    }, {});

    return NextResponse.json({
      totalPlatformRevenue,
      totalProcessed,
      totalPayments: payments.length,
      byStore,
    });
  } catch (error: any) {
    console.error("Error fetching platform revenue:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
