import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Store } from "@/lib/models/Store";
import { verifyAdminAuth } from "@/lib/admin-middleware";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await verifyAdminAuth(req);
  if ("error" in authResult) return authResult.error;

  try {
    await connectDB();
    const { id } = await params;
    const store = await Store.findById(id).lean();
    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }
    return NextResponse.json({ products: (store as any).products || [] });
  } catch (error) {
    console.error("Admin GET store products error:", error);
    return NextResponse.json({ error: "Error fetching products" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await verifyAdminAuth(req);
  if ("error" in authResult) return authResult.error;

  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const store = await Store.findByIdAndUpdate(
      id,
      { $set: { products: body.products } },
      { new: true }
    ).lean();
    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }
    return NextResponse.json({ products: (store as any).products || [] });
  } catch (error) {
    console.error("Admin PUT store products error:", error);
    return NextResponse.json({ error: "Error updating products" }, { status: 500 });
  }
}
