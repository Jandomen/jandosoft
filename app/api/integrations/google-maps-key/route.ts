import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    const raw = req.nextUrl.searchParams.get("storeId");
    if (!raw) return NextResponse.json({ key: null });

    await connectDB();
    const { Integration } = await import("@/lib/models/Integration");

    // Try both string and ObjectId to ensure match
    const storeIds: any[] = [raw];
    if (mongoose.Types.ObjectId.isValid(raw)) {
      storeIds.push(new mongoose.Types.ObjectId(raw));
    }

    const integration = await Integration.findOne({
      storeId: { $in: storeIds },
      platform: "google_maps",
      "credentials.apiKey": { $exists: true, $ne: "" },
    }).lean();

    if (integration?.credentials?.apiKey) {
      return NextResponse.json({ key: integration.credentials.apiKey });
    }

    return NextResponse.json({ key: null });
  } catch {
    return NextResponse.json({ key: null });
  }
}
