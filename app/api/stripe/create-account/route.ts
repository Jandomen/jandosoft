import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Store } from "@/lib/models/Store";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const { storeId, email } = await req.json();
    if (!storeId || !email) {
      return NextResponse.json({ error: "storeId and email required" }, { status: 400 });
    }

    await connectDB();
    const store = await Store.findById(storeId);
    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    if (store.stripeAccountId) {
      return NextResponse.json({ accountId: store.stripeAccountId });
    }

    const account = await stripe.accounts.create({
      type: "express",
      country: "US",
      email: email,
      business_type: "individual",
      business_profile: {
        name: store.name || "Jandosoft Store",
        url: process.env.NEXT_PUBLIC_URL || "https://jandosoft.com",
      },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    store.stripeAccountId = account.id;
    await store.save();

    return NextResponse.json({ accountId: account.id });
  } catch (error: any) {
    console.error("Error creating Stripe account:", error);
    const message = error?.raw?.message || error?.message || "Error desconocido al crear cuenta Stripe";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
