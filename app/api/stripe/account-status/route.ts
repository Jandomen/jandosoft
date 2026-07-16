import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Store } from "@/lib/models/Store";
import { stripe } from "@/lib/stripe";
import { getAuthFromHeaders, getAuthFromCookies } from "@/lib/auth";

async function getAuth(req: NextRequest) {
  return getAuthFromHeaders(req) || await getAuthFromCookies();
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuth(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId");
    if (!storeId) return NextResponse.json({ error: "storeId required" }, { status: 400 });

    await connectDB();
    const store = await Store.findById(storeId).lean() as any;
    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

    if (!store.stripeAccountId) {
      return NextResponse.json({ connected: false });
    }

    try {
      const account = await stripe.accounts.retrieve(store.stripeAccountId);

      const chargesEnabled = account.charges_enabled;
      const payoutsEnabled = account.payouts_enabled;
      const detailsSubmitted = account.details_submitted;
      const onboarded = chargesEnabled && payoutsEnabled && detailsSubmitted;

      return NextResponse.json({
        connected: true,
        accountId: store.stripeAccountId,
        email: account.email || store.stripeConnectEmail || "",
        onboarded,
        chargesEnabled,
        payoutsEnabled,
        detailsSubmitted,
        businessProfile: {
          name: account.business_profile?.name || "",
          url: account.business_profile?.url || "",
          mcc: account.business_profile?.mcc || "",
        },
        capabilities: {
          cardPayments: account.capabilities?.card_payments || "inactive",
          transfers: account.capabilities?.transfers || "inactive",
        },
      });
    } catch (e: any) {
      if (e.statusCode === 404) {
        await Store.findByIdAndUpdate(storeId, { $unset: { stripeAccountId: "" } });
        return NextResponse.json({ connected: false, error: "Cuenta no encontrada en Stripe" });
      }
      throw e;
    }
  } catch (error: any) {
    console.error("Error checking Stripe account status:", error);
    return NextResponse.json({ error: error.message || "Error checking status" }, { status: 500 });
  }
}
