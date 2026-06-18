import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Store } from "@/lib/models/Store";
import { authenticateApiKey } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await authenticateApiKey(req);
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });

  if (!auth.scopes?.includes("orders:read")) {
    return NextResponse.json({ error: "Missing scope: orders:read" }, { status: 403 });
  }

  await connectDB();
  const store = await Store.findById(auth.storeId).select("orders").lean();
  if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

  return NextResponse.json({ orders: (store as any).orders || [] });
}
