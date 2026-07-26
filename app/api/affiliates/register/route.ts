import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Affiliate } from "@/lib/models/Affiliate";
import { User } from "@/lib/models/User";
import { stripe } from "@/lib/stripe";

function generateAffiliateCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "REF-";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(req: NextRequest) {
  try {
    const { email, name, phone } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "email required" }, { status: 400 });
    }

    await connectDB();

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "User not found. Please register first." }, { status: 404 });
    }

    const userId = user._id;

    const existingAffiliate = await Affiliate.findOne({ userId });
    if (existingAffiliate) {
      return NextResponse.json({ error: "Already registered as affiliate" }, { status: 409 });
    }

    const existingEmail = await Affiliate.findOne({ email });
    if (existingEmail) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    let code = generateAffiliateCode();
    while (await Affiliate.findOne({ code })) {
      code = generateAffiliateCode();
    }

    const affiliate = new Affiliate({
      userId,
      code,
      name: name || user.name,
      email,
      phone,
      status: "active",
      commissionRate: 20,
    });

    await affiliate.save();

    return NextResponse.json({
      success: true,
      affiliate: {
        id: affiliate._id,
        code: affiliate.code,
        name: affiliate.name,
        email: affiliate.email,
        status: affiliate.status,
        commissionRate: affiliate.commissionRate,
      },
    });
  } catch (error: any) {
    console.error("Error registering affiliate:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}