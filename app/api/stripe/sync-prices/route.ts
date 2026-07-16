import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { PlanConfig } from "@/lib/models/PlanConfig";
import { stripe } from "@/lib/stripe";
import { invalidatePlanCache } from "@/lib/plan-config";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await connectDB();
    let config = await PlanConfig.findOne();
    if (!config) {
      return NextResponse.json({ error: "No plan config found. Save plans first." }, { status: 400 });
    }

    const results: any[] = [];
    const errors: any[] = [];

    for (let i = 0; i < config.plans.length; i++) {
      const plan = config.plans[i];
      if (!plan.price || plan.price <= 0) continue;

      try {
        let productId = plan.stripeProductId;

        if (productId) {
          try {
            await stripe.products.update(productId, { name: plan.name, description: plan.desc || "" });
          } catch {
            productId = undefined;
          }
        }

        if (!productId) {
          const product = await stripe.products.create({
            name: plan.name,
            description: plan.desc || "",
            metadata: { plan_id: plan.id },
          });
          productId = product.id;
        }

        const planCurrency = (plan.currency || "usd").toLowerCase();

        const monthlyPrice = await stripe.prices.create({
          product: productId,
          unit_amount: plan.price * 100,
          currency: planCurrency,
          recurring: { interval: "month" },
          metadata: { plan_id: plan.id },
        });

        if (plan.stripePriceId && plan.stripePriceId !== monthlyPrice.id) {
          try { await stripe.prices.update(plan.stripePriceId, { active: false }); } catch {}
        }

        config.plans[i].stripeProductId = productId;
        config.plans[i].stripePriceId = monthlyPrice.id;

        let priceIdUsd = plan.stripePriceIdUsd;

        if (planCurrency !== "usd" && plan.priceUsd && plan.priceUsd > 0) {
          const usdPrice = await stripe.prices.create({
            product: productId,
            unit_amount: plan.priceUsd * 100,
            currency: "usd",
            recurring: { interval: "month" },
            metadata: { plan_id: plan.id, currency: "usd" },
          });
          if (plan.stripePriceIdUsd && plan.stripePriceIdUsd !== usdPrice.id) {
            try { await stripe.prices.update(plan.stripePriceIdUsd, { active: false }); } catch {}
          }
          priceIdUsd = usdPrice.id;
          config.plans[i].stripePriceIdUsd = priceIdUsd;
        }

        results.push({
          plan: plan.id,
          name: plan.name,
          currency: planCurrency,
          priceId: monthlyPrice.id,
          priceIdUsd: priceIdUsd || null,
        });
      } catch (err: any) {
        errors.push({ plan: plan.id, name: plan.name, error: err.message });
        console.error(`[Sync] Error syncing plan ${plan.id}:`, err.message);
      }
    }

    await config.save();
    invalidatePlanCache();

    return NextResponse.json({ success: true, results, errors });
  } catch (error: any) {
    console.error("Sync prices error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
