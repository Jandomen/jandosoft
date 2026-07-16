import { NextRequest, NextResponse } from "next/server";
import { runScheduler } from "@/lib/scheduler/registry";
import "@/lib/scheduler/modules";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }

  if (!authHeader || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const report = await runScheduler();

  return NextResponse.json({
    ok: true,
    startedAt: report.startedAt.toISOString(),
    finishedAt: report.finishedAt.toISOString(),
    durationMs: report.totalDurationMs,
    total: report.totalTasks,
    processed: report.processed,
    succeeded: report.succeeded,
    failed: report.failed,
    skipped: report.skipped,
    errors: report.errors,
    results: report.results,
  });
}

export async function POST(req: NextRequest) {
  return GET(req);
}
