import { connectDB } from "@/lib/mongodb";
import { PlanConfig, DEFAULT_PLANS, DEFAULT_FREE_PLAN, type IPlan, type IFreePlan } from "@/lib/models/PlanConfig";
import { PLANS as CODE_PLANS } from "@/lib/plans";

export interface PlanConfigResult {
  plans: IPlan[];
  freePlan: IFreePlan;
}

let cached: PlanConfigResult | null = null;
let lastFetch = 0;
const CACHE_TTL = 60000;

export async function getPlanConfig(): Promise<PlanConfigResult> {
  if (cached && Date.now() - lastFetch < CACHE_TTL) return cached;

  try {
    await connectDB();
    const doc = await PlanConfig.findOne().lean();
    if (doc && (doc as any).plans?.length > 0) {
      const plans = ((doc as any).plans as IPlan[]).map((p) => {
        const def = DEFAULT_PLANS.find((d) => d.id === p.id);
        const codePlan = CODE_PLANS.find((c) => c.id === p.id);
        const price = codePlan?.price ?? def?.price ?? p.price;
        const priceUsd = codePlan?.priceUsd ?? def?.priceUsd ?? p.priceUsd;
        return {
          ...p,
          name: def?.name ?? p.name,
          desc: def?.desc ?? p.desc,
          price,
          priceUsd,
        };
      });
      const freePlan = { ...((doc as any).freePlan as IFreePlan || DEFAULT_FREE_PLAN), name: DEFAULT_FREE_PLAN.name };
      cached = { plans, freePlan };
      lastFetch = Date.now();
      return cached!;
    }
  } catch {}

  return { plans: DEFAULT_PLANS, freePlan: DEFAULT_FREE_PLAN };
}

export function getPlanLimitsFromConfig(config: PlanConfigResult, subscription: string | null) {
  const sub = subscription || "free";
  if (sub === "free") return config.freePlan.limits;
  const plan = config.plans.find((p) => p.id === sub);
  return plan?.limits || config.freePlan.limits;
}

export function invalidatePlanCache() {
  cached = null;
  lastFetch = 0;
}
