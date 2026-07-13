import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { PlanConfig, DEFAULT_PLANS, DEFAULT_FREE_PLAN } from "@/lib/models/PlanConfig";
import { invalidatePlanCache } from "@/lib/plan-config";
import { verifyAdminAuth } from "@/lib/admin-middleware";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const authResult = await verifyAdminAuth(req);
  if ("error" in authResult) return authResult.error;

  try {
    await connectDB();
    let config = await PlanConfig.findOne().lean();

    if (!config) {
      config = await PlanConfig.create({
        plans: DEFAULT_PLANS,
        freePlan: DEFAULT_FREE_PLAN,
      });
    }

    return NextResponse.json({ plans: (config as any).plans, freePlan: (config as any).freePlan });
  } catch (error) {
    console.error("GET plans error:", error);
    return NextResponse.json({ error: "Error fetching plans" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authResult = await verifyAdminAuth(req);
  if ("error" in authResult) return authResult.error;

  try {
    const body = await req.json();
    await connectDB();

    let config = await PlanConfig.findOne();
    if (!config) {
      config = await PlanConfig.create({
        plans: DEFAULT_PLANS,
        freePlan: DEFAULT_FREE_PLAN,
      });
    }

    if (body.plans) config.plans = body.plans;
    if (body.freePlan) config.freePlan = body.freePlan;

    await config.save();
    invalidatePlanCache();

    return NextResponse.json({ success: true, plans: config.plans, freePlan: config.freePlan });
  } catch (error) {
    console.error("PUT plans error:", error);
    return NextResponse.json({ error: "Error updating plans" }, { status: 500 });
  }
}
