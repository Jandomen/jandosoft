import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { PlanConfig } from "@/lib/models/PlanConfig";
import { stripe } from "@/lib/stripe";
import { invalidatePlanCache } from "@/lib/plan-config";

export const dynamic = "force-dynamic";

const USD_TO_MXN = 20.5;

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
      const usdPrice = plan.priceUsd || plan.price;
      if (!usdPrice || usdPrice <= 0) continue;

      const mxnAmount = Math.round(usdPrice * USD_TO_MXN);
      if (mxnAmount < 10) {
        errors.push({ plan: plan.id, name: plan.name, error: `USD $${usdPrice} = $${mxnAmount} MXN, menor al mínimo ($10 MXN). Sube el precio a al menos $0.50 USD.` });
        continue;
      }

      try {
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

        const mxnPrice = await stripe.prices.create({
          product: productId,
          unit_amount: mxnAmount * 100,
          currency: "mxn",
          recurring: { interval: "month" },
          metadata: { plan_id: plan.id, usd_price: usdPrice.toString() },
        });

        if (plan.stripePriceId && plan.stripePriceId !== mxnPrice.id) {
          try { await stripe.prices.update(plan.stripePriceId, { active: false }); } catch {}
        }

        config.plans[i].stripeProductId = productId;
        config.plans[i].stripePriceId = mxnPrice.id;
        config.plans[i].stripePriceIdUsd = mxnPrice.id;

        results.push({
          plan: plan.id,
          name: plan.name,
          usdPrice,
          mxnPrice,
          priceId: mxnPrice.id,
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
