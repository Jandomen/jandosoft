import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Store } from "@/lib/models/Store";

export async function PATCH(req: NextRequest) {
  try {
    const { storeId, paymentsEnabled, platformFeePercent } = await req.json();
    if (!storeId) {
      return NextResponse.json({ error: "storeId required" }, { status: 400 });
    }

    await connectDB();
    const store = await Store.findById(storeId);
    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    if (typeof paymentsEnabled === "boolean") {
      store.paymentsEnabled = paymentsEnabled;
    }
    if (typeof platformFeePercent === "number") {
      store.platformFeePercent = platformFeePercent;
    }

    await store.save();

    return NextResponse.json({
      paymentsEnabled: store.paymentsEnabled,
      platformFeePercent: store.platformFeePercent,
    });
  } catch (error: any) {
    console.error("Error updating stripe settings:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
