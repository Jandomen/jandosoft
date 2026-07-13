import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Store } from "@/lib/models/Store";
import { User } from "@/lib/models/User";
import { Payment } from "@/lib/models/Payment";
import { Appointment } from "@/lib/models/Appointment";
import { stripe } from "@/lib/stripe";
import { getPlanConfig } from "@/lib/plan-config";
import { generatePaymentReceiptPDF } from "@/lib/pdf-utils";
import { sendPaymentReceiptEmail, sendPaymentReceivedNotificationEmail } from "@/lib/email-service";

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
        date: new Date().toLocaleDateString(),
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

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const metadata = session.metadata || {};
        const piId = session.payment_intent as string;

        if (session.mode === "subscription") {
          const email = metadata.customerEmail;
          const planId = metadata.planId;
          const subscriptionId = session.subscription as string;

          if (email && subscriptionId) {
            const sub = await stripe.subscriptions.retrieve(subscriptionId) as any;
            const expiry = new Date(sub.current_period_end * 1000);

            const config = await getPlanConfig();
            const plan = config.plans.find((p) => p.id === planId);
            const subType = plan?.id || "starter";

            await User.findOneAndUpdate(
              { email },
              {
                subscription: subType,
                subscriptionExpiry: expiry,
                stripeSubscriptionId: subscriptionId,
                subscriptionStatus: sub.status,
                stripeCustomerId: session.customer as string,
              }
            );
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
              stripeAccountId: metadata.stripeAccountId || "",
              status: "completed",
              description: `Pago de cita: ${appointment?.service?.name || "Servicio"}`,
              appointmentId: appointment?._id,
            });
            await sendReceiptForPayment(appointmentPayment);
          }
        } else if (metadata.storeId) {
          if (piId) {
            const pi = await stripe.paymentIntents.retrieve(piId);
            const feePercent = parseFloat(metadata.platformFeePercent || "5");
            const amount = (session.amount_total || 0) / 100;
            const platformFee = pi.application_fee_amount
              ? pi.application_fee_amount / 100
              : Math.round(amount * (feePercent / 100));
            const netAmount = amount - platformFee;

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
              stripeAccountId: (pi.transfer_data as any)?.destination || "",
              status: "completed",
              description: session.metadata?.items || session.custom_fields?.[0]?.text?.value || "",
            });
            await sendReceiptForPayment(payment);
          }
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as any;
        const subId = invoice.subscription as string;
        const email = invoice.customer_email || invoice.customer_details?.email;

        if (subId) {
          const subscription = await stripe.subscriptions.retrieve(subId) as any;
          const metadata = subscription.metadata || {};
          const planId = metadata.planId;
          const expiry = new Date(subscription.current_period_end * 1000);

          const config = await getPlanConfig();
          const plan = config.plans.find((p) => p.id === planId);
          const subType = plan?.id || "starter";

          const updateData: any = {
            subscriptionExpiry: expiry,
            subscriptionStatus: subscription.status,
            stripeSubscriptionId: subId,
          };
          if (planId) updateData.subscription = subType;

          if (email) {
            await User.findOneAndUpdate({ email }, { $set: updateData });
          } else if (subscription.metadata?.customerEmail) {
            await User.findOneAndUpdate(
              { email: subscription.metadata.customerEmail },
              { $set: updateData }
            );
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const failedInvoice = event.data.object as any;
        const failedSubId = failedInvoice.subscription as string;
        if (failedSubId) {
          await User.findOneAndUpdate(
            { stripeSubscriptionId: failedSubId },
            { subscriptionStatus: "past_due" }
          );
        }
        break;
      }

      case "customer.subscription.updated": {
        const updatedSub = event.data.object as any;
        const updatedMetadata = updatedSub.metadata || {};
        const customerEmail = updatedMetadata.customerEmail;
        const periodEnd = new Date(updatedSub.current_period_end * 1000);
        const status = updatedSub.status;

        const updateFields: any = {
          subscriptionExpiry: periodEnd,
          subscriptionStatus: status,
        };

        if (status === "canceled" || status === "unpaid" || status === "incomplete_expired") {
          updateFields.subscription = null;
          updateFields.stripeSubscriptionId = null;
        }

        if (customerEmail) {
          await User.findOneAndUpdate({ email: customerEmail }, { $set: updateFields });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const deletedSub = event.data.object as any;
        const delEmail = deletedSub.metadata?.customerEmail;
        const updateDel: any = {
          subscription: null,
          subscriptionExpiry: null,
          stripeSubscriptionId: null,
          subscriptionStatus: "canceled",
        };
        if (delEmail) {
          await User.findOneAndUpdate({ email: delEmail }, { $set: updateDel });
        }
        break;
      }

      case "payment_intent.succeeded": {
        const pi = event.data.object;
        const piMetadata = pi.metadata;

        if (piMetadata.storeId && !piMetadata.from_checkout) {
          const feePercent = parseFloat(piMetadata.platformFeePercent || "5");
          const amount = pi.amount / 100;
          const platformFee = (pi.application_fee_amount || Math.round(amount * (feePercent / 100))) / 100;
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
            stripeAccountId: pi.transfer_data?.destination || "",
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
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
