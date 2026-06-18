import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { EmailLog } from "@/lib/models/EmailLog";
import { withAuth } from "@/lib/api-middleware";
import { NextRequest } from "next/server";

export const GET = withAuth(async (_req: NextRequest, auth) => {
  await connectDB();

  const filter = { organizationId: auth.organizationId };

  const [totalSent, totalFailed, totalOpened, recentLogs] = await Promise.all([
    EmailLog.countDocuments({ ...filter, status: "sent" }),
    EmailLog.countDocuments({ ...filter, status: "failed" }),
    EmailLog.countDocuments({ ...filter, status: "opened" }),
    EmailLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
  ]);

  const totalEmails = totalSent + totalFailed;
  const openRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : "0.0";

  return NextResponse.json({
    success: true,
    metrics: {
      totalSent,
      totalFailed,
      totalOpened,
      totalEmails,
      openRate: `${openRate}%`,
    },
    recentLogs,
  });
});
