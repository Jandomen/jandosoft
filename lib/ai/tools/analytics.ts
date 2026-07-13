import type { ToolDefinition, ToolResult } from "./base";

export const TOOLS: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "get_analytics",
      description: "Get analytics data for the store: total views, unique visitors, daily breakdown, top pages",
      parameters: {
        type: "object",
        properties: {
          days: { type: "number", description: "Number of days to analyze (default 30)" },
        },
      },
    },
  },
];

export async function executeAnalyticsTool(name: string, args: any, store: any, _userId: string): Promise<ToolResult> {
  if (name !== "get_analytics") return { error: `Unknown analytics tool: ${name}` };

  const storeId = store?._id || store?.id;
  if (!storeId) return { error: "No store selected" };

  const { connectDB } = await import("@/lib/mongodb");
  const { PageView } = await import("@/lib/models/PageView");
  await connectDB();

  const days = args.days || 30;
  const since = new Date();
  since.setDate(since.getDate() - days);

  const match = { storeId, timestamp: { $gte: since } };
  const [aggregation] = await PageView.aggregate([
    { $match: match },
    { $facet: {
      total: [{ $count: "views" }],
      unique: [{ $group: { _id: "$visitorId" } }, { $count: "visitors" }],
      daily: [
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } }, views: { $sum: 1 }, uniqueVisitors: { $addToSet: "$visitorId" } } },
        { $sort: { _id: 1 } },
        { $project: { date: "$_id", views: 1, uniqueVisitors: { $size: "$uniqueVisitors" }, _id: 0 } },
      ],
      topPages: [
        { $group: { _id: "$path", views: { $sum: 1 } } },
        { $sort: { views: -1 } },
        { $limit: 10 },
        { $project: { path: "$_id", views: 1, _id: 0 } },
      ],
    } },
  ]);

  return {
    success: true,
    totalViews: aggregation?.total[0]?.views || 0,
    uniqueVisitors: aggregation?.unique[0]?.visitors || 0,
    dailyBreakdown: aggregation?.daily || [],
    topPages: aggregation?.topPages || [],
  };
}
