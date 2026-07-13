import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Store } from "@/lib/models/Store";
import { createProviderCheckout } from "@/lib/payment-providers/registry";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { storeId, amount, currency, description, customerEmail, customerName, items } = body;

    if (!storeId) return NextResponse.json({ error: "storeId required" }, { status: 400 });
    if (!amount || amount <= 0) return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    if (!customerEmail) return NextResponse.json({ error: "customerEmail required" }, { status: 400 });

    await connectDB();
    const store = await Store.findById(storeId).lean() as any;
    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

    const integrations = store.paymentIntegrations || [];
    if (integrations.length === 0) {
      return NextResponse.json({ error: "Esta tienda no tiene proveedores de pago configurados" }, { status: 400 });
    }

    const result = await createProviderCheckout(integrations, {
      storeId,
      storeName: store.name || "Tienda",
      ownerEmail: store.ownerEmail || "",
      amount: parseFloat(amount),
      currency: currency || store.currency || "USD",
      description: description || "Pago",
      customerEmail,
      customerName,
      items,
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
