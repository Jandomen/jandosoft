import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Store } from "@/lib/models/Store";
import { stripe } from "@/lib/stripe";
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
    const store = await Store.findById(storeId).lean() as any;
    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

    if (!store.stripeAccountId) {
      return NextResponse.json({ error: "No hay cuenta Stripe conectada" }, { status: 400 });
    }

    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

    const accountLink = await stripe.accountLinks.create({
      account: store.stripeAccountId,
      refresh_url: `${origin}/dashboard`,
      return_url: `${origin}/dashboard?stripe=onboarding_complete`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error: any) {
    console.error("Error creating onboarding link:", error);
    return NextResponse.json({ error: error.message || "Error creating onboarding link" }, { status: 500 });
  }
}
