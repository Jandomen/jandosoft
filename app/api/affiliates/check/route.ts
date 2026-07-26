import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Affiliate } from "@/lib/models/Affiliate";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "email required" }, { status: 400 });
    }

    await connectDB();

    const affiliate = await Affiliate.findOne({ email });

    if (affiliate) {
      return NextResponse.json({
        success: true,
        affiliate: {
          id: affiliate._id,
          code: affiliate.code,
          name: affiliate.name,
          email: affiliate.email,
          status: affiliate.status,
        },
      });
    }

    return NextResponse.json({
      success: true,
      affiliate: null,
    });
  } catch (error: any) {
    console.error("Error checking affiliate:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}