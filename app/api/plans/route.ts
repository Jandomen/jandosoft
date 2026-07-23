import { NextResponse } from "next/server";
import { getPlanConfig } from "@/lib/plan-config";
import { DEFAULT_PLANS, DEFAULT_FREE_PLAN } from "@/lib/models/PlanConfig";
import { PLANS as CODE_PLANS } from "@/lib/plans";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = await getPlanConfig();
    const plans = config.plans.map((p) => {
      const def = DEFAULT_PLANS.find((d) => d.id === p.id);
      const codePlan = CODE_PLANS.find((c) => c.id === p.id);
      const price = codePlan?.price ?? def?.price ?? p.price;
      const priceUsd = codePlan?.priceUsd ?? def?.priceUsd ?? p.priceUsd;
      return { ...p, name: def?.name ?? p.name, desc: def?.desc ?? p.desc, price, priceUsd };
    });
    const freePlan = { ...config.freePlan, name: DEFAULT_FREE_PLAN.name };
    return NextResponse.json({ plans, freePlan });
  } catch (error) {
    console.error("GET public plans error:", error);
    return NextResponse.json({ error: "Error fetching plans" }, { status: 500 });
  }
}
