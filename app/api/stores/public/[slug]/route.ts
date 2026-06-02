import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Store } from "@/lib/models/Store";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    await connectDB();
    const store = await Store.findOne({ slug, isPublic: true }).lean();
    if (!store) {
      return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });
    }
    const { customers, orders, stripeAccountId, paymentsEnabled, platformFeePercent, ...publicData } = store as any;
    return NextResponse.json({ store: publicData });
  } catch (error) {
    console.error("GET public store error:", error);
    return NextResponse.json({ error: "Error fetching store" }, { status: 500 });
  }
}
