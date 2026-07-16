import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { connectDB } from "@/lib/mongodb";
import { Store } from "@/lib/models/Store";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code) {
      return NextResponse.redirect(new URL("/dashboard?stripe=error&msg=missing_code", req.url));
    }

    if (!state) {
      return NextResponse.redirect(new URL("/dashboard?stripe=error&msg=missing_state", req.url));
    }

    const stateData = JSON.parse(Buffer.from(state, "base64").toString());
    const { storeId, userId } = stateData;

    if (!storeId || !userId) {
      return NextResponse.redirect(new URL("/dashboard?stripe=error&msg=invalid_state", req.url));
    }

    await connectDB();
    const store = await Store.findById(storeId);
    if (!store) {
      return NextResponse.redirect(new URL("/dashboard?stripe=error&msg=store_not_found", req.url));
    }

    const tokenResponse = await stripe.oauth.token({
      grant_type: "authorization_code",
      code,
    });

    const accountId = tokenResponse.stripe_user_id;
    const accessToken = tokenResponse.access_token;
    const refreshToken = tokenResponse.refresh_token;

    if (!accountId) {
      return NextResponse.redirect(new URL("/dashboard?stripe=error&msg=no_account_id", req.url));
    }

    const account = await stripe.accounts.retrieve(accountId);

    const existingIntegrations = (store as any).paymentIntegrations || [];
    const hasStripe = existingIntegrations.some((i: any) => i.provider === "stripe");

    const update: any = {
      stripeAccountId: accountId,
      stripeConnectAccessToken: accessToken,
      stripeConnectRefreshToken: refreshToken || "",
      stripeConnectEmail: account.email || "",
      paymentsEnabled: account.charges_enabled && account.payouts_enabled,
    };

    if (!hasStripe) {
      update.paymentIntegrations = [
        ...existingIntegrations,
        {
          provider: "stripe",
          credentials: { connected: "true" },
          enabled: true,
          isDefault: existingIntegrations.length === 0,
          connectedAt: new Date(),
        },
      ];
    }

    await Store.findByIdAndUpdate(storeId, { $set: update });

    return NextResponse.redirect(new URL("/dashboard?stripe=success&connected=true", req.url));
  } catch (error: any) {
    console.error("Stripe OAuth callback error:", error);
    const msg = encodeURIComponent(error.message || "unknown_error");
    return NextResponse.redirect(new URL(`/dashboard?stripe=error&msg=${msg}`, req.url));
  }
}
