import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { PlanConfig, DEFAULT_PLANS, DEFAULT_FREE_PLAN } from "@/lib/models/PlanConfig";
import { invalidatePlanCache } from "@/lib/plan-config";
import { verifyAdminAuth } from "@/lib/admin-middleware";
import { stripe } from "@/lib/stripe";

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

async function syncPlanToStripe(plan: any): Promise<{ productId?: string; priceId?: string }> {
  const USD_TO_MXN = 20.5;
  const usdPrice = plan.priceUsd || plan.price;
  if (!usdPrice || usdPrice <= 0) return {};

  const mxnAmount = Math.round(usdPrice * USD_TO_MXN);
  if (mxnAmount < 10) return {};

  let productId = plan.stripeProductId;

  if (productId) {
    try {
      await stripe.products.update(productId, { name: plan.name, description: plan.desc || "" });
    } catch { productId = undefined; }
  }

  if (!productId) {
    const product = await stripe.products.create({
      name: plan.name,
      description: plan.desc || "",
      metadata: { plan_id: plan.id },
    });
    productId = product.id;
  }

  const monthlyPrice = await stripe.prices.create({
    product: productId,
    unit_amount: mxnAmount * 100,
    currency: "mxn",
    recurring: { interval: "month" },
    metadata: { plan_id: plan.id, usd_price: usdPrice.toString() },
  });

  if (plan.stripePriceId && plan.stripePriceId !== monthlyPrice.id) {
    try { await stripe.prices.update(plan.stripePriceId, { active: false }); } catch {}
  }

  return { productId, priceId: monthlyPrice.id };
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

    const results: any[] = [];
    const syncErrors: string[] = [];

    for (let i = 0; i < config.plans.length; i++) {
      const plan = config.plans[i];
      const usdPrice = plan.priceUsd || plan.price;
      const mxnAmount = Math.round(usdPrice * 20.5);

      if (usdPrice > 0 && mxnAmount < 10) {
        syncErrors.push(`${plan.name}: $${usdPrice} USD = $${mxnAmount} MXN < mínimo ($10 MXN). Sube a $0.50+ USD.`);
        continue;
      }
      if (usdPrice > 0) {
        try {
          const { productId, priceId } = await syncPlanToStripe(plan);
          if (productId) config.plans[i].stripeProductId = productId;
          if (priceId) config.plans[i].stripePriceId = priceId;
          if (priceId) config.plans[i].stripePriceIdUsd = priceId;
        } catch (err: any) {
          syncErrors.push(`${plan.name}: ${err.message}`);
        }
      }
    }

    if (syncErrors.length > 0) {
      console.error("[Plans] Stripe sync errors:", syncErrors);
    }

    await config.save();
    invalidatePlanCache();

    return NextResponse.json({ success: true, plans: config.plans, freePlan: config.freePlan, syncErrors });
  } catch (error) {
    console.error("PUT plans error:", error);
    return NextResponse.json({ error: "Error updating plans" }, { status: 500 });
  }
}
