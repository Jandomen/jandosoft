import { NextResponse } from "next/server";
import { getPlanConfig } from "@/lib/plan-config";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = await getPlanConfig();
    return NextResponse.json({ plans: config.plans, freePlan: config.freePlan });
  } catch (error) {
    console.error("GET public plans error:", error);
    return NextResponse.json({ error: "Error fetching plans" }, { status: 500 });
  }
}
