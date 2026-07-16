import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { NowPaymentsPayment } from "@/lib/models/NowPaymentsPayment";
import { Store } from "@/lib/models/Store";
import { generatePaymentReceiptPDF } from "@/lib/pdf-utils";
import { sendPaymentReceiptEmail } from "@/lib/email-service";
import { notifyOwner } from "@/lib/notify";
import crypto from "crypto";

function verifyIPNSignature(rawBody: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");
  return hmac === signature;
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const sig = req.headers.get("x-nowpayments-sig") || "";
    const data = JSON.parse(rawBody);
    const orderId = data.order_id;

    if (!orderId) {
      return NextResponse.json({ error: "Missing order_id" }, { status: 400 });
    }

    await connectDB();

    const payment = await NowPaymentsPayment.findOne({ orderId });
    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const store = await Store.findById(payment.storeId);
    const ipnSecret = store?.paymentIntegrations?.find((i: any) => i.provider === "nowpayments")?.credentials?.ipnSecret;

    if (ipnSecret && sig) {
      const valid = verifyIPNSignature(rawBody, sig, ipnSecret);
      if (!valid) {
        console.error("[NowPayments] Invalid IPN signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
      }
    }

    const paymentStatus = data.payment_status;
    const paymentId = data.payment_id;
    const actuallyPaid = data.actually_paid;
    const payCurrency = data.pay_currency;

    const update: any = {
      paymentStatus,
      ...(paymentId && { invoiceId: paymentId }),
      ...(actuallyPaid && { actuallyPaid: parseFloat(actuallyPaid) }),
      ...(payCurrency && { payCurrency }),
    };

    if (paymentStatus === "finished" || paymentStatus === "confirmed") {
      update.completedAt = new Date();

      if (orderId.startsWith("PLAN-")) {
        const planId = orderId.split("-")[1];
        if (payment?.customerEmail && planId) {
          try {
            const { User } = await import("@/lib/models/User");
            const expiry = new Date();
            expiry.setMonth(expiry.getMonth() + 1);
            await User.findOneAndUpdate(
              { email: payment.customerEmail },
              { $set: { subscription: planId, subscriptionExpiry: expiry, subscriptionStatus: "active" } }
            );
            console.log(`[NowPayments] Plan ${planId} activated for ${payment.customerEmail}`);
          } catch (err) {
            console.error("[NowPayments] Error activating plan:", err);
          }
        }
      }

      if (payment?.customerEmail) {
        try {
          const receiptNumber = `RCP-NOW-${orderId.slice(-6).toUpperCase()}`;
          const pdfBuffer = await generatePaymentReceiptPDF({
            receiptNumber,
            customerName: payment.customerEmail?.split("@")[0] || "Cliente",
            customerEmail: payment.customerEmail,
            amount: payment.priceAmount,
            currency: payment.priceCurrency?.toUpperCase() || "USD",
            description: `Pago cripto (${payCurrency || "BTC"}) - Order #${orderId}`,
            paymentMethod: `Cripto (${payCurrency || "BTC"})`,
            storeName: "Jandosoft",
            paymentId: payment._id?.toString(),
          });
          await sendPaymentReceiptEmail({
            to: payment.customerEmail,
            customerName: payment.customerEmail?.split("@")[0] || "Cliente",
            amount: payment.priceAmount,
            currency: payment.priceCurrency?.toUpperCase() || "USD",
            description: `Pago cripto - Order #${orderId}`,
            storeName: "Jandosoft",
            receiptPdf: pdfBuffer,
          });
          update.receiptNumber = receiptNumber;
          update.receiptSentAt = new Date();
        } catch (err) {
          console.error("[NowPayments] Error sending receipt:", err);
        }
      }
    }

    await NowPaymentsPayment.findOneAndUpdate(
      { orderId },
      { $set: update },
    );

    if ((paymentStatus === "finished" || paymentStatus === "confirmed") && store) {
      const ownerId = String((store as any).ownerId || (store as any).userId);
      if (ownerId) {
        await notifyOwner(ownerId, String(store._id), "payment", "Pago crypto recibido", `$${payment.priceAmount} - ${payment.customerEmail || "Cliente"}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("NowPayments webhook error:", error);
    return NextResponse.json({ received: true });
  }
}
