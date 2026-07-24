import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { PlanConfig, DEFAULT_PLANS, DEFAULT_FREE_PLAN } from "@/lib/models/PlanConfig";
import { invalidatePlanCache } from "@/lib/plan-config";
import { verifyAdminAuth } from "@/lib/admin-middleware";
import { stripe } from "@/lib/stripe";
import { User } from "@/lib/models/User";
import { PLANS as CODE_PLANS, getPlanLabel } from "@/lib/plans";

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

    const plans = (config as any).plans.map((p: any) => {
      const defaultPlan = DEFAULT_PLANS.find((d) => d.id === p.id);
      const codePlan = CODE_PLANS.find((c) => c.id === p.id);
      const price = codePlan?.price ?? defaultPlan?.price ?? p.price;
      const priceUsd = codePlan?.priceUsd ?? defaultPlan?.priceUsd ?? p.priceUsd;
      return { ...p, name: defaultPlan?.name ?? p.name, desc: defaultPlan?.desc ?? p.desc, price, priceUsd };
    });

    const freePlan = { ...(config as any).freePlan, name: DEFAULT_FREE_PLAN.name };

    return NextResponse.json({ plans, freePlan });
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

export async function DELETE(req: NextRequest) {
  const authResult = await verifyAdminAuth(req);
  if ("error" in authResult) return authResult.error;

  try {
    const { planId } = await req.json();
    if (!planId) return NextResponse.json({ error: "planId required" }, { status: 400 });

    await connectDB();
    const config = await PlanConfig.findOne();
    if (!config) return NextResponse.json({ error: "No plan config found" }, { status: 404 });

    const planIndex = config.plans.findIndex((p: any) => p.id === planId);
    if (planIndex === -1) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

    const plan = config.plans[planIndex];

    // Save original plan info on users before migrating
    await User.updateMany(
      { subscription: planId, originalPlan: { $exists: false } },
      { $set: { originalPlan: planId, originalPlanName: plan.name, originalPlanPrice: plan.priceUsd || plan.price } }
    );

    // Deactivate Stripe price if exists
    if (plan.stripePriceId) {
      try { await stripe.prices.update(plan.stripePriceId, { active: false }); } catch {}
    }

    // Migrate users on this plan to "starter" (or free if starter doesn't exist)
    const fallbackPlan = config.plans.find((p: any) => p.id === "starter")
      ? "starter"
      : DEFAULT_PLANS.find((p) => p.id === "starter")
        ? "starter"
        : null;
    const fallbackPlanName = getPlanLabel(fallbackPlan);
    const newExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const migrateResult = await User.updateMany(
      { subscription: planId },
      {
        $set: {
          subscription: fallbackPlan,
          plan: fallbackPlan,
          planStatus: "active",
          subscriptionStatus: "active",
          subscriptionExpiry: newExpiry,
          expiresAt: newExpiry,
        },
      }
    );

    // Remove plan from config
    config.plans.splice(planIndex, 1);
    await config.save();
    invalidatePlanCache();

    return NextResponse.json({
      success: true,
      deletedPlan: planId,
      migratedUsers: migrateResult.modifiedCount,
      fallbackPlan: fallbackPlanName,
    });
  } catch (error) {
    console.error("DELETE plan error:", error);
    return NextResponse.json({ error: "Error deleting plan" }, { status: 500 });
  }
}
