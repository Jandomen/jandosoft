import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Store } from "@/lib/models/Store";
import { getAuthFromHeaders, getAuthFromCookies } from "@/lib/auth";

async function getAuth(req: NextRequest) {
  return getAuthFromHeaders(req) || await getAuthFromCookies();
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuth(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { storeId } = await req.json();
    if (!storeId) return NextResponse.json({ error: "storeId required" }, { status: 400 });

    await connectDB();
    const store = await Store.findById(storeId);
    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

    const hadConnect = !!store.stripeAccountId;

    if (store.stripeAccountId) {
      try {
        const { stripe } = await import("@/lib/stripe");
        await stripe.accounts.del(store.stripeAccountId);
      } catch (e) {
        console.error("Failed to delete Stripe account remotely (continuing with local cleanup):", e);
      }
    }

    await Store.findByIdAndUpdate(storeId, {
      $unset: {
        stripeAccountId: "",
        stripeConnectAccessToken: "",
        stripeConnectRefreshToken: "",
        stripeConnectEmail: "",
      },
      $set: { paymentsEnabled: false },
    });

    return NextResponse.json({ success: true, hadConnect });
  } catch (error: any) {
    console.error("Error disconnecting Stripe:", error);
    return NextResponse.json({ error: error.message || "Error al desconectar" }, { status: 500 });
  }
}
