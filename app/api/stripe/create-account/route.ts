import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Store } from "@/lib/models/Store";

export async function POST(req: NextRequest) {
  try {
    const { storeId, userId, email } = await req.json();
    if (!storeId || !userId) {
      return NextResponse.json({ error: "storeId and userId required" }, { status: 400 });
    }

    await connectDB();
    const store = await Store.findById(storeId);
    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    if (store.stripeAccountId) {
      return NextResponse.json({ alreadyConnected: true, accountId: store.stripeAccountId });
    }

    const state = Buffer.from(JSON.stringify({ storeId, userId })).toString("base64");

    const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
    const redirectUri = `${baseUrl}/api/stripe/callback`;

    const client_id = process.env.STRIPE_CONNECT_CLIENT_ID;
    if (!client_id) {
      return NextResponse.json({
        error: "Stripe Connect no está configurado. El administrador debe agregar STRIPE_CONNECT_CLIENT_ID en el servidor.",
        setupRequired: true,
      }, { status: 500 });
    }

    const authUrl = `https://connect.stripe.com/oauth/authorize?` +
      `client_id=${client_id}` +
      `&state=${state}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=read_write` +
      (email ? `&stripe_user_email=${encodeURIComponent(email)}` : "");

    return NextResponse.json({ url: authUrl });
  } catch (error: any) {
    console.error("Error generating Stripe Connect URL:", error);
    return NextResponse.json({ error: error.message || "Error al generar link de conexión" }, { status: 500 });
  }
}
