import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { PlanConfig } from "@/lib/models/PlanConfig";
import { stripe } from "@/lib/stripe";
import { invalidatePlanCache } from "@/lib/plan-config";

export async function POST() {
  try {
    await connectDB();
    let config = await PlanConfig.findOne();
    if (!config) {
      return NextResponse.json({ error: "No plan config found. Save plans first." }, { status: 400 });
    }

    const results: any[] = [];

    for (let i = 0; i < config.plans.length; i++) {
      const plan = config.plans[i];

      let productId = plan.stripeProductId;
      let priceId = plan.stripePriceId;

      if (productId) {
        try {
          await stripe.products.update(productId, { name: plan.name, description: plan.desc });
        } catch {
          productId = undefined;
        }
      }

      if (!productId) {
        const product = await stripe.products.create({
          name: plan.name,
          description: plan.desc,
          metadata: { plan_id: plan.id },
        });
        productId = product.id;
      }

      const monthlyPrice = await stripe.prices.create({
        product: productId,
        unit_amount: plan.price * 100,
        currency: "usd",
        recurring: { interval: "month" },
        metadata: { plan_id: plan.id },
      });
      priceId = monthlyPrice.id;

      if (plan.stripePriceId && plan.stripePriceId !== priceId) {
        try {
          await stripe.prices.update(plan.stripePriceId, { active: false });
        } catch {}
      }

      config.plans[i].stripeProductId = productId;
      config.plans[i].stripePriceId = priceId;

      results.push({ plan: plan.id, productId, priceId });
    }

    await config.save();
    invalidatePlanCache();

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error("Sync prices error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
