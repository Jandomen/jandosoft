import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Store } from "@/lib/models/Store";
import { User } from "@/lib/models/User";
import { getAuthFromCookies, getAuthFromHeaders } from "@/lib/auth";

const PLAN_LIMITS: Record<string, { maxStores: number; maxProductsPerStore: number }> = {
  free: { maxStores: 3, maxProductsPerStore: 20 },
  basic: { maxStores: 10, maxProductsPerStore: 100 },
  enterprise: { maxStores: 999, maxProductsPerStore: 9999 },
};

async function getAuth(req: NextRequest) {
  return getAuthFromHeaders(req) || await getAuthFromCookies();
}

async function checkProductLimit(storeId: string, organizationId: string, newProductCount: number): Promise<string | null> {
  const store = await Store.findOne({ _id: storeId, organizationId }).lean();
  if (!store) return null;
  const user = await User.findOne({ email: store.ownerEmail }).lean();
  if (!user) return "Usuario no encontrado";
  const sub = user.subscription || "free";
  const limits = PLAN_LIMITS[sub] || PLAN_LIMITS.free;
  const expiry = user.subscriptionExpiry ? new Date(user.subscriptionExpiry) : null;
  if (expiry && expiry < new Date()) return "Plan vencido. No puedes modificar productos.";
  if (newProductCount > limits.maxProductsPerStore) {
    return `Límite de ${limits.maxProductsPerStore} productos por tienda alcanzado en tu plan actual.`;
  }
  return null;
}

async function getStore(storeId: string, organizationId: string) {
  await connectDB();
  const store = await Store.findOne({ _id: storeId, organizationId });
  if (!store) return null;
  return store;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ storeId: string }> }) {
  try {
    const auth = await getAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const { storeId } = await params;
    const store = await getStore(storeId, auth.organizationId);
    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

    const plain = store.toObject ? JSON.parse(JSON.stringify(store)) : store;
    return NextResponse.json({ store: plain });
  } catch (error) {
    console.error("GET store error:", error);
    return NextResponse.json({ error: "Error fetching store" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ storeId: string }> }) {
  try {
    const auth = await getAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const { storeId } = await params;
    const body = await req.json();

    if (body.slug) {
      const existing = await Store.findOne({ slug: body.slug, _id: { $ne: storeId } }).lean();
      if (existing) {
        return NextResponse.json({ error: `El slug "${body.slug}" ya está en uso. Elige otro.` }, { status: 409 });
      }
    }

    const store = await Store.findOneAndUpdate(
      { _id: storeId, organizationId: auth.organizationId },
      body,
      { new: true }
    ).lean();
    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });
    return NextResponse.json({ store });
  } catch (error: any) {
    if (error?.code === 11000) {
      return NextResponse.json({ error: "El slug ya está en uso. Elige otro." }, { status: 409 });
    }
    console.error("PUT store error:", error);
    return NextResponse.json({ error: "Error updating store" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ storeId: string }> }) {
  try {
    const auth = await getAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const { storeId } = await params;
    const store = await Store.findOneAndDelete({ _id: storeId, organizationId: auth.organizationId });
    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE store error:", error);
    return NextResponse.json({ error: "Error deleting store" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ storeId: string }> }) {
  try {
    const auth = await getAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const { storeId } = await params;
    const body = await req.json();

    if (body.slug) {
      const existing = await Store.findOne({ slug: body.slug, _id: { $ne: storeId } }).lean();
      if (existing) {
        return NextResponse.json({ error: `El slug "${body.slug}" ya está en uso. Elige otro.` }, { status: 409 });
      }
    }

    if (body.products) {
      const limitError = await checkProductLimit(storeId, auth.organizationId, body.products.length);
      if (limitError) {
        return NextResponse.json({ error: limitError }, { status: 403 });
      }
    }

    const store = await Store.findOneAndUpdate(
      { _id: storeId, organizationId: auth.organizationId },
      { $set: body },
      { new: true }
    ).lean();
    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });
    return NextResponse.json({ store });
  } catch (error: any) {
    if (error?.code === 11000) {
      return NextResponse.json({ error: "El slug ya está en uso. Elige otro." }, { status: 409 });
    }
    console.error("PATCH store error:", error);
    return NextResponse.json({ error: "Error updating store data" }, { status: 500 });
  }
}
