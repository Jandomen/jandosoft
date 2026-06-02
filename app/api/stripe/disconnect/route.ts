import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Store } from "@/lib/models/Store";

export async function POST(req: Request) {
  try {
    const { storeId } = await req.json();
    if (!storeId) {
      return NextResponse.json({ error: "storeId required" }, { status: 400 });
    }

    await connectDB();

    const store = await Store.findByIdAndUpdate(
      storeId,
      { $unset: { stripeAccountId: "" }, $set: { paymentsEnabled: false } },
      { new: true }
    );

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, store });
  } catch (error) {
    console.error("Stripe disconnect error:", error);
    return NextResponse.json({ error: "Error disconnecting Stripe" }, { status: 500 });
  }
}
