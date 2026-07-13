import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Store } from "@/lib/models/Store";
import { withAuth } from "@/lib/api-middleware";
import { getIntegrations, setIntegration, deleteIntegration } from "@/lib/services/integrations";

export const GET = withAuth(async (req: NextRequest, auth) => {
  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get("storeId");
  if (!storeId) return NextResponse.json({ error: "storeId required" }, { status: 400 });

  await connectDB();
  const store = await Store.findOne({ _id: storeId, organizationId: auth.organizationId });
  if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

  const integrations = await getIntegrations(storeId);
  return NextResponse.json({ success: true, integrations });
});

export const POST = withAuth(async (req: NextRequest, auth, body) => {
  const { storeId, platform, credentials, enabled } = body;
  if (!storeId || !platform || !credentials) {
    return NextResponse.json({ error: "storeId, platform, and credentials required" }, { status: 400 });
  }

  await connectDB();
  const store = await Store.findOne({ _id: storeId, organizationId: auth.organizationId });
  if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

  const integration = await setIntegration(storeId, { platform, credentials, enabled });
  return NextResponse.json({ success: true, integration });
});

export const DELETE = withAuth(async (req: NextRequest, auth) => {
  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get("storeId");
  const platform = searchParams.get("platform");
  if (!storeId || !platform) return NextResponse.json({ error: "storeId and platform required" }, { status: 400 });

  await connectDB();
  const store = await Store.findOne({ _id: storeId, organizationId: auth.organizationId });
  if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

  await deleteIntegration(storeId, platform);
  return NextResponse.json({ success: true });
});
