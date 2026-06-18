import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Store } from "@/lib/models/Store";
import { authenticateApiKey } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await authenticateApiKey(req);
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });

  if (!auth.scopes?.includes("products:read")) {
    return NextResponse.json({ error: "Missing scope: products:read" }, { status: 403 });
  }

  await connectDB();
  const store = await Store.findById(auth.storeId).select("products").lean();
  if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

  return NextResponse.json({ products: (store as any).products || [] });
}

export async function POST(req: NextRequest) {
  const auth = await authenticateApiKey(req);
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });

  if (!auth.scopes?.includes("products:write")) {
    return NextResponse.json({ error: "Missing scope: products:write" }, { status: 403 });
  }

  const body = await req.json();
  if (!body.name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  await connectDB();
  const store = await Store.findById(auth.storeId);
  if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

  const products = (store as any).products || [];
  const newProduct = {
    id: Date.now().toString(),
    name: body.name,
    price: body.price || 0,
    stock: body.stock ?? 0,
    desc: body.desc || "",
    images: body.images || [],
    createdAt: new Date().toISOString(),
  };

  products.push(newProduct);
  (store as any).products = products;
  (store as any).save();

  return NextResponse.json({ product: newProduct }, { status: 201 });
}
