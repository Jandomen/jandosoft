import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Store } from "@/lib/models/Store";
import { getProviderConfig, PAYMENT_PROVIDERS } from "@/lib/payment-providers";
import { validateProvider } from "@/lib/payment-providers/registry";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await params;
    if (!storeId) return NextResponse.json({ error: "storeId required" }, { status: 400 });

    await connectDB();
    const store = await Store.findById(storeId).lean() as any;
    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

    const integrations = (store.paymentIntegrations || []).map((i: any) => ({
      provider: i.provider,
      enabled: i.enabled,
      isDefault: i.isDefault,
      connectedAt: i.connectedAt,
      hasCredentials: !!(i.credentials && Object.keys(i.credentials).length > 0),
      config: PAYMENT_PROVIDERS[i.provider] || null,
    }));

    const defaultProvider = integrations.find((i: any) => i.enabled && i.isDefault) || integrations.find((i: any) => i.enabled);

    return NextResponse.json({
      integrations,
      defaultProvider: defaultProvider?.provider || null,
      available: Object.keys(PAYMENT_PROVIDERS),
      paymentPolicy: store.paymentPolicy || "optional",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { storeId, provider, credentials } = await req.json();
    if (!storeId || !provider) return NextResponse.json({ error: "storeId and provider required" }, { status: 400 });

    const config = getProviderConfig(provider);
    if (!config) return NextResponse.json({ error: `Unknown provider: ${provider}` }, { status: 400 });

    await connectDB();
    const store = await Store.findById(storeId) as any;
    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

    const valid = await validateProvider(provider, credentials || {});
    if (!valid) return NextResponse.json({ error: "Credenciales inválidas. Verifica los datos e intenta de nuevo." }, { status: 400 });

    const integrations = store.paymentIntegrations || [];
    const existingIdx = integrations.findIndex((i: any) => i.provider === provider);

    if (existingIdx >= 0) {
      integrations[existingIdx].credentials = credentials;
      integrations[existingIdx].enabled = true;
      integrations[existingIdx].connectedAt = new Date();
    } else {
      integrations.push({
        provider,
        credentials,
        enabled: true,
        isDefault: integrations.length === 0,
        connectedAt: new Date(),
      });
    }

    store.paymentIntegrations = integrations;
    store.paymentsEnabled = integrations.some((i: any) => i.enabled);
    await store.save();

    return NextResponse.json({ success: true, provider, enabled: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { storeId, provider, enabled, isDefault, paymentPolicy } = await req.json();
    if (!storeId) return NextResponse.json({ error: "storeId required" }, { status: 400 });

    await connectDB();
    const store = await Store.findById(storeId) as any;
    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

    if (paymentPolicy) {
      store.paymentPolicy = paymentPolicy;
    }

    if (provider) {
      const integrations = store.paymentIntegrations || [];
      const idx = integrations.findIndex((i: any) => i.provider === provider);
      if (idx < 0) return NextResponse.json({ error: "Integration not found" }, { status: 404 });

      if (enabled !== undefined) integrations[idx].enabled = enabled;
      if (isDefault) {
        integrations.forEach((i: any) => { i.isDefault = false; });
        integrations[idx].isDefault = true;
      }

      store.paymentIntegrations = integrations;
      store.paymentsEnabled = integrations.some((i: any) => i.enabled);
    }

    await store.save();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await params;
    const { searchParams } = new URL(req.url);
    const provider = searchParams.get("provider");
    if (!storeId || !provider) return NextResponse.json({ error: "storeId and provider required" }, { status: 400 });

    await connectDB();
    const store = await Store.findById(storeId) as any;
    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

    store.paymentIntegrations = (store.paymentIntegrations || []).filter((i: any) => i.provider !== provider);
    store.paymentsEnabled = (store.paymentIntegrations || []).some((i: any) => i.enabled);
    await store.save();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
