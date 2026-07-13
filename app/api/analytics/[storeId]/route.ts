import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { PageView } from "@/lib/models/PageView";
import { Store } from "@/lib/models/Store";
import { getAuthFromCookies, getAuthFromHeaders } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ storeId: string }> }) {
  try {
    const auth = getAuthFromHeaders(req) || await getAuthFromCookies();
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { storeId } = await params;

    await connectDB();
    const store = await Store.findOne({ _id: storeId }).lean();
    if (!store) {
      return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });
    }

    const isOwner = store.organizationId === auth.organizationId;
    const isAdmin = auth.role === "admin";
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") || "7");

    const now = new Date();
    const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const [totalViews, uniqueVisitors, dailyViews, topPages] = await Promise.all([
      PageView.countDocuments({ storeId, timestamp: { $gte: since } }),
      PageView.distinct("visitorId", { storeId, timestamp: { $gte: since } }),
      PageView.aggregate([
        { $match: { storeId: storeId as any, timestamp: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
            views: { $sum: 1 },
            visitors: { $addToSet: "$visitorId" },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      PageView.aggregate([
        { $match: { storeId: storeId as any, timestamp: { $gte: since } } },
        { $group: { _id: "$path", views: { $sum: 1 } } },
        { $sort: { views: -1 } },
        { $limit: 10 },
      ]),
    ]);

    const dailyBreakdown = dailyViews.map((d: any) => ({
      date: d._id,
      views: d.views,
      uniqueVisitors: d.visitors.length,
    }));

    const viewsToday = await PageView.countDocuments({
      storeId,
      timestamp: { $gte: new Date(now.setHours(0, 0, 0, 0)) },
    });

    return NextResponse.json({
      totalViews,
      uniqueVisitors: uniqueVisitors.length,
      viewsToday,
      dailyBreakdown,
      topPages,
    });
  } catch (error) {
    console.error("GET analytics error:", error);
    return NextResponse.json({ error: "Error fetching analytics" }, { status: 500 });
  }
}
