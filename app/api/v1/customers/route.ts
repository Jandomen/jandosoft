import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Customer } from "@/lib/models/Customer";
import { authenticateApiKey } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await authenticateApiKey(req);
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });

  if (!auth.scopes?.includes("customers:read")) {
    return NextResponse.json({ error: "Missing scope: customers:read" }, { status: 403 });
  }

  await connectDB();
  const customers = await Customer.find({ storeId: auth.storeId })
    .select("name email phone tags notes createdAt")
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ customers, total: customers.length });
}
