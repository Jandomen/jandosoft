import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { EmailLog } from "@/lib/models/EmailLog";
import { withAuth } from "@/lib/api-middleware";

export const GET = withAuth(async (req: NextRequest, auth) => {
  await connectDB();

  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
  const page = parseInt(url.searchParams.get("page") || "1");
  const status = url.searchParams.get("status");
  const template = url.searchParams.get("template");

  const filter: any = { organizationId: auth.organizationId };
  if (status) filter.status = status;
  if (template) filter.template = template;

  const [logs, total] = await Promise.all([
    EmailLog.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    EmailLog.countDocuments(filter),
  ]);

  return NextResponse.json({
    success: true,
    logs,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  });
});
