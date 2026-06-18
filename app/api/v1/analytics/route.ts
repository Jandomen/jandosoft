import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { PageView } from "@/lib/models/PageView";
import { Store } from "@/lib/models/Store";
import { authenticateApiKey } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await authenticateApiKey(req);
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });

  if (!auth.scopes?.includes("analytics:read")) {
    return NextResponse.json({ error: "Missing scope: analytics:read" }, { status: 403 });
  }

  await connectDB();

  const totalViews = await PageView.countDocuments({ storeId: auth.storeId });
  const uniqueVisitors = (await PageView.distinct("visitorId", { storeId: auth.storeId })).length;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const viewsToday = await PageView.countDocuments({ storeId: auth.storeId, timestamp: { $gte: today } });

  const store = await Store.findById(auth.storeId).select("products orders").lean();
  const products = (store as any)?.products?.length || 0;
  const orders = (store as any)?.orders?.length || 0;

  return NextResponse.json({
    analytics: {
      totalViews,
      uniqueVisitors,
      viewsToday,
      totalProducts: products,
      totalOrders: orders,
    },
  });
}
