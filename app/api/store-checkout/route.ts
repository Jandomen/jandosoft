import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Store } from "@/lib/models/Store";
import { createProviderCheckout } from "@/lib/payment-providers/registry";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { storeId, amount, currency, description, customerEmail, customerName, paymentMethod, items } = body;

    if (!storeId) return NextResponse.json({ error: "storeId required" }, { status: 400 });
    if (!amount || amount <= 0) return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    if (!customerEmail) return NextResponse.json({ error: "customerEmail required" }, { status: 400 });

    if (parseFloat(amount) < 10) {
      return NextResponse.json({ error: "El monto mínimo de pago es $10 pesos mexicanos." }, { status: 400 });
    }

    await connectDB();
    const store = await Store.findById(storeId).lean() as any;
    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

    const integrations = store.paymentIntegrations || [];
    if (integrations.length === 0 && !store.stripeAccountId) {
      return NextResponse.json({ error: "Esta tienda no tiene proveedores de pago configurados" }, { status: 400 });
    }

    const effectiveIntegrations = integrations.length > 0 ? integrations : [
      { provider: "stripe", credentials: { connected: "true" }, enabled: true, isDefault: true }
    ];

    const result = await createProviderCheckout(effectiveIntegrations, {
      storeId,
      storeName: store.name || "Tienda",
      ownerEmail: store.ownerEmail || "",
      amount: parseFloat(amount),
      currency: "mxn",
      description: description || "Pago",
      customerEmail,
      customerName,
      paymentMethod,
      items,
      stripeAccountId: store.stripeAccountId || undefined,
      platformFeePercent: store.platformFeePercent ?? 5,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ url: result.url, id: result.id });
  } catch (error: any) {
    console.error("[StoreCheckout] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
