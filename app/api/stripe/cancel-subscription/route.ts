import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { stripe } from "@/lib/stripe";
import { getAuthFromHeaders, getAuthFromCookies } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthFromHeaders(req) || await getAuthFromCookies();
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(auth.userId);
    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    if (!user.stripeSubscriptionId) {
      return NextResponse.json({ error: "No tienes una suscripción activa" }, { status: 400 });
    }

    const { immediately } = await req.json().catch(() => ({ immediately: false }));

    try {
      if (immediately) {
        await stripe.subscriptions.cancel(user.stripeSubscriptionId);
      } else {
        await stripe.subscriptions.update(user.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });
      }
    } catch (err: any) {
      console.error("[CancelSubscription] Error:", err.message);
      return NextResponse.json({ error: "Error al cancelar la suscripción" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: immediately
        ? "Suscripción cancelada inmediatamente"
        : "Tu plan se cancelará al final del periodo de facturación",
    });
  } catch (error: any) {
    console.error("[CancelSubscription] Error:", error?.message || error);
    return NextResponse.json({ error: error.message || "Error al cancelar" }, { status: 500 });
  }
}
