import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Store } from "@/lib/models/Store";
import { authenticateApiKey } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await authenticateApiKey(req);
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });

  if (!auth.scopes?.includes("store:read")) {
    return NextResponse.json({ error: "Missing scope: store:read" }, { status: 403 });
  }

  await connectDB();
  const store = await Store.findById(auth.storeId)
    .select("name slug desc industry type isPublic")
    .lean();

  return NextResponse.json({ store });
}
