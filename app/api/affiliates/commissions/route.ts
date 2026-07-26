import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Commission } from "@/lib/models/Commission";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const affiliateId = searchParams.get("affiliateId");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    if (!affiliateId) {
      return NextResponse.json({ error: "affiliateId required" }, { status: 400 });
    }

    await connectDB();

    const query: any = { affiliateId };
    if (status) {
      query.status = status;
    }

    const total = await Commission.countDocuments(query);
    const commissions = await Commission.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      success: true,
      commissions: commissions.map((c) => ({
        id: c._id,
        amount: c.amount,
        percentage: c.percentage,
        plan: c.plan,
        planPrice: c.planPrice,
        period: c.period,
        status: c.status,
        createdAt: c.createdAt,
        paidAt: c.paidAt,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching commissions:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}