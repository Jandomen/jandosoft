/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Store } from "@/lib/models/Store";
import { User } from "@/lib/models/User";
import { Payment } from "@/lib/models/Payment";
import { Appointment } from "@/lib/models/Appointment";
import { Affiliate } from "@/lib/models/Affiliate";
import { stripe } from "@/lib/stripe";
import { getPlanConfig } from "@/lib/plan-config";
import { PLANS } from "@/lib/plans";

function generateReceiptNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RCP-${y}${m}${d}-${rand}`;
}

async function sendReceiptForPayment(payment: any) {
  try {
    const { generatePaymentReceiptPDF } = await import("@/lib/pdf-utils");
    const { sendPaymentReceiptEmail, sendPaymentReceivedNotificationEmail } = await import("@/lib/email-service");
    const receiptNumber = generateReceiptNumber();
    const pdfBuffer = await generatePaymentReceiptPDF({
      receiptNumber,
      customerName: payment.customerName || payment.customerEmail,
      customerEmail: payment.customerEmail,
      amount: payment.amount,
      currency: payment.currency?.toUpperCase() || "USD",
      description: payment.description || "Pago en tienda",
      paymentMethod: "Tarjeta (Stripe)",
      storeName: payment.storeName,
      paymentId: payment._id?.toString(),
    });
    await sendPaymentReceiptEmail({
      to: payment.customerEmail,
      customerName: payment.customerName || "Cliente",
      amount: payment.amount,
      currency: payment.currency?.toUpperCase() || "USD",
      description: payment.description || "Pago en tienda",
      storeName: payment.storeName || "Jandosoft",
      receiptPdf: pdfBuffer,
      storeId: payment.storeId?.toString(),
    });
    if (payment.ownerEmail && payment.ownerEmail !== payment.customerEmail) {
      await sendPaymentReceivedNotificationEmail({
        to: payment.ownerEmail,
        storeName: payment.storeName || "Jandosoft",
        customerName: payment.customerName || payment.customerEmail,
        amount: payment.amount,
        currency: payment.currency?.toUpperCase() || "USD",
        date: new Date().toLocaleDateString("es-MX", { timeZone: "America/Mexico_City" }),
        storeId: payment.storeId?.toString(),
      }).catch((err) => console.error("[Receipt] Error notifying owner:", err));
    }
    await Payment.findByIdAndUpdate(payment._id, {
      receiptNumber,
      receiptSentAt: new Date(),
    });
  } catch (err) {
    console.error("[Receipt] Error sending receipt:", err);
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function updateUserSubscription(
  userId: string | null,
  email: string | null,
  planId: string,
  subscriptionId: string,
  customerId: string,
  status: string,
  periodEnd: Date,
  billingPeriod: string
) {
  const config = await getPlanConfig();
  const plan = config.plans.find((p) => p.id === planId);
  const planType = plan?.id || "starter";

  const safePeriodEnd = periodEnd instanceof Date && !isNaN(periodEnd.getTime())
    ? periodEnd
    : (() => {
        const fallback = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        console.log(`[Webhook] Invalid periodEnd for sub=${subscriptionId} plan=${planId}. Using fallback: ${fallback.toISOString()}. Raw: ${periodEnd}`);
        return fallback;
      })();

  const updateData = {
    subscription: planType,
    plan: planType,
    planStatus: status,
    subscriptionExpiry: safePeriodEnd,
    expiresAt: safePeriodEnd,
    stripeSubscriptionId: subscriptionId,
    stripeCustomerId: customerId,
    customerId: customerId,
    subscriptionStatus: status,
    billingPeriod: billingPeriod,
    updatedAt: new Date(),
  };

  // Try to find by userId first, then by email, then by stripe subscription/customer
  let result = null;
  if (userId) {
    result = await User.findByIdAndUpdate(userId, { $set: updateData }, { new: true });
  }
  if (!result && email) {
    result = await User.findOneAndUpdate({ email }, { $set: updateData }, { new: true });
  }
  if (!result) {
    result = await User.findOneAndUpdate(
      { stripeSubscriptionId: subscriptionId },
      { $set: updateData },
      { new: true }
    );
  }
  if (!result) {
    result = await User.findOneAndUpdate(
      { stripeCustomerId: customerId },
      { $set: updateData },
      { new: true }
    );
  }

  console.log(`[Webhook] User updated: ${result ? "OK" : "NOT FOUND"} plan=${planType} sub=${subscriptionId} userId=${userId}`);
  return result;
}

async function resetUserToFree(userId: string | null, email: string | null, subscriptionId: string, deviceId: string | null) {
  const freePlan = { id: "free", name: "Gratis" };

  const updateData = {
    subscription: freePlan.id,
    plan: freePlan.id,
    planStatus: "canceled",
    subscriptionStatus: "canceled",
    subscriptionExpiry: null,
    expiresAt: null,
    billingPeriod: null,
    updatedAt: new Date(),
  };

  let result = null;
  if (userId) {
    result = await User.findByIdAndUpdate(userId, { $set: updateData }, { new: true });
  }
  if (!result && email) {
    result = await User.findOneAndUpdate({ email }, { $set: updateData }, { new: true });
  }
  if (!result) {
    result = await User.findOneAndUpdate(
      { stripeSubscriptionId: subscriptionId },
      { $set: updateData },
      { new: true }
    );
  }
  if (!result && deviceId) {
    result = await User.findOneAndUpdate(
      { "devices.deviceId": deviceId },
      { $set: updateData },
      { new: true }
    );
  }

  console.log(`[Webhook] User reset to Free: ${result ? "OK" : "NOT FOUND"} sub=${subscriptionId}`);
  return result;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature") || "";

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    await connectDB();

    // Idempotency: skip duplicate webhook delivery using Stripe's Idempotency-Key or event ID
    const eventId = event.id;
    const existingEvent = await Payment.findOne({ stripePaymentIntentId: `wh_${eventId}` }).lean();
    if (existingEvent) {
      console.log(`[Webhook] Skipping duplicate event: ${eventId}`);
      return NextResponse.json({ received: true });
    }

    console.log(`[Webhook] Received event: ${event.type} (${eventId})`);

    switch (event.type) {
      case "checkout.session.completed":
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        if (event.type === "checkout.session.completed") {
          const session = event.data.object;
          const metadata = session.metadata || {};
          const piId = session.payment_intent as string;

          if (session.mode === "subscription") {
            const userId = metadata.userId || null;
            const customerEmail = metadata.customerEmail || null;
            const planId = metadata.planId;
            const subscriptionId = session.subscription as string;
            const customerId = session.customer as string;
            const orgId = metadata.organizationId || null;

            if (!subscriptionId) {
              break;
            }

            const sub = await stripe.subscriptions.retrieve(subscriptionId) as any;
            const rawPeriodEnd = sub.current_period_end;
            const periodEnd = rawPeriodEnd && !isNaN(rawPeriodEnd)
              ? new Date(rawPeriodEnd * 1000)
              : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            if (!rawPeriodEnd || isNaN(rawPeriodEnd)) {
              console.warn("[Webhook] checkout.session.completed: current_period_end missing, using 30-day fallback");
            }
            const status = sub.status;
            const billingInterval = sub.items?.data?.[0]?.plan?.interval || "month";

            await updateUserSubscription(
              userId, customerEmail, planId || "starter",
              subscriptionId, customerId, status, periodEnd, billingInterval
            );

            if (userId) {
              try {
                const { generateCommissionForPayment } = await import("@/lib/affiliate-utils");
                const config = await getPlanConfig();
                const plan = config.plans.find((p: any) => p.id === planId) || PLANS.find((p) => p.id === planId);
                const planPrice = plan?.price || 0;
                await generateCommissionForPayment(userId, planId || "starter", planPrice, piId || "");
              } catch (e) {
                console.error("[Webhook] Failed to generate affiliate commission:", e);
              }
            }

            if (orgId) {
              try {
                const { Organization } = await import("@/lib/models/Organization");
                await Organization.findByIdAndUpdate(orgId, {
                  stripeCustomerId: customerId,
                  plan: planId || "starter",
                });
              } catch (e) {
                console.error("[Webhook] Failed to update organization:", e);
              }
            }
          } else if (session.mode === "payment" && metadata.planId && metadata.durationDays) {
            // One-time payment for a flexible plan with durationDays
            const userId = metadata.userId || null;
            const customerEmail = metadata.customerEmail || null;
            const planId = metadata.planId;
            const customerId = session.customer as string;
            const piId = session.payment_intent as string;
            const durationDays = parseInt(metadata.durationDays, 10) || 30;

            const config = await getPlanConfig();
            const plan = config.plans.find((p: any) => p.id === planId) || PLANS.find((p) => p.id === planId);
            const planType = plan?.id || "free";

            const now = new Date();
            const expiry = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

            const updateData = {
              subscription: planType,
              plan: planType,
              planStatus: "active",
              subscriptionExpiry: expiry,
              expiresAt: expiry,
              stripeSubscriptionId: piId,
              stripeCustomerId: customerId,
              customerId: customerId,
              subscriptionStatus: "active",
              billingPeriod: `${durationDays}_days`,
              updatedAt: new Date(),
            };

            let result = null;
            if (userId) {
              result = await User.findByIdAndUpdate(userId, { $set: updateData }, { new: true });
            }
            if (!result && customerEmail) {
              result = await User.findOneAndUpdate({ email: customerEmail }, { $set: updateData }, { new: true });
            }
            if (!result && customerId) {
              result = await User.findOneAndUpdate({ stripeCustomerId: customerId }, { $set: updateData }, { new: true });
            }

            console.log(`[Webhook] Duration plan activated: ${planId} (${durationDays}d) -> ${result ? "OK" : "NOT FOUND"} user=${userId || customerEmail}`);

            try {
              const amount = (session.amount_total || 0) / 100;
              await Payment.create({
                customerEmail: customerEmail || "",
                customerName: "",
                amount,
                currency: session.currency || "mxn",
                platformFee: 0,
                netAmount: amount,
                stripePaymentIntentId: piId || "",
                externalId: session.id || "",
                status: "succeeded",
                description: `Plan ${plan?.name || planId} - ${durationDays} días`,
                type: "plan_one_time",
                planId: planId || "",
                storeName: "",
                ownerEmail: "",
              });
            } catch (e) {
              console.error("[Webhook] Failed to create payment record for one-time plan:", e);
            }
          } else if (metadata.type === "appointment_payment" && metadata.appointmentId) {
            if (piId) {
              const amount = (session.amount_total || 0) / 100;
              await Appointment.findByIdAndUpdate(metadata.appointmentId, {
                $set: {
                  paymentStatus: "paid",
                  stripePaymentIntentId: piId,
                },
              });
              const feePercent = parseFloat(metadata.platformFeePercent || "5");
              const platformFee = Math.round(amount * (feePercent / 100));
              const netAmount = amount - platformFee;
              const appointment = await Appointment.findById(metadata.appointmentId);
              const appointmentPayment = await Payment.create({
                storeId: metadata.storeId,
                storeName: metadata.storeName || "",
                ownerEmail: metadata.ownerEmail || "",
                customerEmail: metadata.customerEmail || session.customer_email || "",
                customerName: appointment?.customerInfo?.name || metadata.customerName || "",
                amount,
                currency: session.currency || "usd",
                platformFee,
                netAmount,
                stripePaymentIntentId: piId,
                provider: "stripe",
                status: "completed",
                description: `Pago de cita: ${appointment?.service?.name || "Servicio"}`,
                appointmentId: appointment?._id,
              });
              await sendReceiptForPayment(appointmentPayment);
            }
          } else if (metadata.storeId) {
            if (piId) {
              const amount = (session.amount_total || 0) / 100;
              const feePercent = parseFloat(metadata.platformFeePercent || "5");
              const platformFee = Math.round(amount * (feePercent / 100));
              const netAmount = amount - platformFee;

              let storeStripeAccountId = "";
              if (metadata.storeId) {
                try {
                  const storeDoc = await Store.findById(metadata.storeId).lean() as any;
                  storeStripeAccountId = storeDoc?.stripeAccountId || "";
                } catch {}
              }

              const payment = await Payment.create({
                storeId: metadata.storeId,
                storeName: metadata.storeName || "",
                ownerEmail: metadata.ownerEmail || "",
                customerEmail: metadata.customerEmail || session.customer_email || "",
                customerName: metadata.customerName || "",
                amount,
                currency: session.currency || "usd",
                platformFee,
                netAmount,
                stripePaymentIntentId: piId,
                stripeAccountId: storeStripeAccountId,
                provider: "stripe",
                status: "completed",
                description: session.metadata?.items || session.custom_fields?.[0]?.text?.value || "",
              });
              await sendReceiptForPayment(payment);
            }
          }
        } else if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
          const sub = event.data.object as any;
          const subMetadata = sub.metadata || {};
          const userId = subMetadata.userId || null;
          const customerEmail = subMetadata.customerEmail || null;
          const planId = subMetadata.planId;
          const subscriptionId = sub.id;
          const customerId = sub.customer as string;
          const rawPeriodEnd2 = sub.current_period_end;
          const periodEnd = rawPeriodEnd2 && !isNaN(rawPeriodEnd2)
            ? new Date(rawPeriodEnd2 * 1000)
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          if (!rawPeriodEnd2 || isNaN(rawPeriodEnd2)) {
            console.warn("[Webhook] subscription.created/updated: current_period_end missing, using 30-day fallback");
          }
          const status = sub.status;
          const billingInterval = sub.items?.data?.[0]?.plan?.interval || "month";

          if (!planId && !userId && !customerEmail) {
            // Try to get details from the checkout session
            const sessions = await stripe.checkout.sessions.list({
              subscription: subscriptionId,
              limit: 1,
            });
            const firstSession = sessions.data[0];
            if (firstSession?.metadata?.planId) {
              await updateUserSubscription(
                firstSession.metadata.userId || null,
                firstSession.metadata.customerEmail || null,
                firstSession.metadata.planId,
                subscriptionId,
                customerId,
                status,
                periodEnd,
                billingInterval
              );
            }
          } else {
            await updateUserSubscription(
              userId, customerEmail, planId || "starter",
              subscriptionId, customerId, status, periodEnd, billingInterval
            );
          }

          if (sub.cancel_at_period_end && event.type === "customer.subscription.updated") {
            try {
              const planConfigCP = await getPlanConfig();
              const planDefCP = planConfigCP.plans.find((p: any) => p.id === planId) || PLANS.find((p) => p.id === planId);
              const existingCancelled = await Payment.findOne({
                externalId: subscriptionId,
                type: "subscription_cancellation_pending",
              }).lean();
              if (!existingCancelled) {
                await Payment.create({
                  customerEmail: customerEmail || "",
                  customerName: "",
                  amount: 0,
                  currency: "mxn",
                  platformFee: 0,
                  netAmount: 0,
                  stripePaymentIntentId: `wh_${eventId}`,
                  externalId: subscriptionId,
                  status: "cancelled",
                  description: `Cancelación programada: ${planDefCP?.name || planId || "Plan"} — activo hasta ${periodEnd.toLocaleDateString("es-MX")}`,
                  type: "subscription_cancellation_pending",
                  planId: planId || "",
                  storeName: "",
                  ownerEmail: "",
                });
              }
            } catch (e) {
              console.error("[Webhook] Failed to create payment record for pending cancellation:", e);
            }
          }
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as any;
        const subId = invoice.subscription as string;

        if (subId) {
          const subscription = await stripe.subscriptions.retrieve(subId) as any;
          const subMetadata = subscription.metadata || {};
          const userId = subMetadata.userId || null;
          const customerEmail = subMetadata.customerEmail || null;
          const planId = subMetadata.planId;
          const customerId = subscription.customer as string;
          const rawPeriodEnd3 = subscription.current_period_end;
          const periodEnd = rawPeriodEnd3 && !isNaN(rawPeriodEnd3)
            ? new Date(rawPeriodEnd3 * 1000)
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          if (!rawPeriodEnd3 || isNaN(rawPeriodEnd3)) {
            console.warn("[Webhook] invoice.paid: current_period_end missing, using 30-day fallback");
          }
          const status = subscription.status;
          const billingInterval = subscription.items?.data?.[0]?.plan?.interval || "month";

          // Only update if we have enough information
          if (userId || customerEmail || planId) {
            await updateUserSubscription(
              userId, customerEmail, planId || "starter",
              subId, customerId, status, periodEnd, billingInterval
            );

            try {
              const amount = (invoice.amount_paid || 0) / 100;
              const planConfig2 = await getPlanConfig();
              const planDef2 = planConfig2.plans.find((p: any) => p.id === planId) || PLANS.find((p) => p.id === planId);
              await Payment.create({
                customerEmail: customerEmail || "",
                customerName: "",
                amount,
                currency: invoice.currency || "mxn",
                platformFee: 0,
                netAmount: amount,
                stripePaymentIntentId: invoice.payment_intent as string || "",
                externalId: invoice.id || "",
                status: "succeeded",
                description: `Plan ${planDef2?.name || planId} - Renovación`,
                type: "subscription_renewal",
                planId: planId || "",
                storeName: "",
                ownerEmail: "",
              });

              if (userId) {
                try {
                  const { generateCommissionForPayment } = await import("@/lib/affiliate-utils");
                  const planPrice = planDef2?.price || 0;
                  await generateCommissionForPayment(userId, planId || "starter", planPrice, invoice.payment_intent as string || "");
                } catch (e) {
                  console.error("[Webhook] Failed to generate affiliate commission for renewal:", e);
                }
              }
            } catch (e) {
              console.error("[Webhook] Failed to create payment record for renewal:", e);
            }
          } else {
            // Fallback: look up by subscription field
            const updateData = {
              subscriptionExpiry: periodEnd,
              expiresAt: periodEnd,
              subscriptionStatus: status,
              planStatus: status,
              updatedAt: new Date(),
            };
            await User.findOneAndUpdate(
              { stripeSubscriptionId: subId },
              { $set: updateData }
            );
            console.log(`[Webhook] invoice.paid: fallback update for sub ${subId}`);
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const failedInvoice = event.data.object as any;
        const failedSubId = failedInvoice.subscription as string;
        if (failedSubId) {
          const updateData = {
            subscriptionStatus: "past_due",
            planStatus: "past_due",
            updatedAt: new Date(),
          };
          await User.findOneAndUpdate(
            { stripeSubscriptionId: failedSubId },
            { $set: updateData }
          );
          console.log(`[Webhook] invoice.payment_failed: marked sub ${failedSubId} as past_due`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const deletedSub = event.data.object as any;
        const delMetadata = deletedSub.metadata || {};
        const deletedUserId = delMetadata.userId || null;
        const deletedEmail = delMetadata.customerEmail || null;
        const deletedSubId = deletedSub.id;
        const deletedPlanId = delMetadata.planId || "";

        await resetUserToFree(deletedUserId, deletedEmail, deletedSubId, null);

        try {
          const planConfig3 = await getPlanConfig();
          const planDef3 = planConfig3.plans.find((p: any) => p.id === deletedPlanId) || PLANS.find((p) => p.id === deletedPlanId);
          await Payment.create({
            customerEmail: deletedEmail || "",
            customerName: "",
            amount: 0,
            currency: "mxn",
            platformFee: 0,
            netAmount: 0,
            stripePaymentIntentId: `wh_${eventId}`,
            externalId: deletedSubId,
            status: "cancelled",
            description: `Suscripción cancelada: ${planDef3?.name || deletedPlanId || "Plan"}`,
            type: "subscription_cancellation",
            planId: deletedPlanId,
            storeName: "",
            ownerEmail: "",
          });
        } catch (e) {
          console.error("[Webhook] Failed to create payment record for cancellation:", e);
        }
        break;
      }

      case "payment_intent.succeeded": {
        const pi = event.data.object;
        const piMetadata = pi.metadata;

        if (piMetadata.storeId && !piMetadata.from_checkout) {
          const feePercent = parseFloat(piMetadata.platformFeePercent || "5");
          const amount = pi.amount / 100;
          const platformFee = Math.round(amount * (feePercent / 100));
          const netAmount = amount - platformFee;

          const payment = await Payment.create({
            storeId: piMetadata.storeId,
            storeName: piMetadata.storeName || "",
            ownerEmail: piMetadata.ownerEmail || "",
            customerEmail: piMetadata.customerEmail || "",
            customerName: piMetadata.customerName || "",
            amount,
            currency: pi.currency,
            platformFee,
            netAmount,
            stripePaymentIntentId: pi.id,
            provider: "stripe",
            status: "completed",
            description: pi.description || "",
          });
          await sendReceiptForPayment(payment);
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const failedPi = event.data.object;
        await Payment.findOneAndUpdate(
          { stripePaymentIntentId: failedPi.id },
          { status: "failed" }
        );
        break;
      }

      case "account.updated": {
        const account = event.data.object;
        await Store.findOneAndUpdate(
          { stripeAccountId: account.id },
          {
            paymentsEnabled:
              account.charges_enabled &&
              account.payouts_enabled &&
              account.details_submitted,
          }
        );

        if (account.charges_enabled && account.payouts_enabled && account.details_submitted) {
          await Affiliate.findOneAndUpdate(
            { stripeAccountId: account.id },
            { stripeAccountStatus: "active" }
          );
        } else if (account.requirements?.currently_due?.length) {
          await Affiliate.findOneAndUpdate(
            { stripeAccountId: account.id },
            { stripeAccountStatus: "restricted" }
          );
        }

        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
