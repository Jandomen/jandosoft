import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { NowPaymentsPayment } from "@/lib/models/NowPaymentsPayment";
import { generatePaymentReceiptPDF } from "@/lib/pdf-utils";
import { sendPaymentReceiptEmail } from "@/lib/email-service";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const data = JSON.parse(rawBody);

    const orderId = data.order_id;
    const paymentStatus = data.payment_status;
    const paymentId = data.payment_id;
    const actuallyPaid = data.actually_paid;
    const payCurrency = data.pay_currency;

    if (!orderId) {
      return NextResponse.json({ error: "Missing order_id" }, { status: 400 });
    }

    await connectDB();

    const update: any = {
      paymentStatus,
      ...(paymentId && { invoiceId: paymentId }),
      ...(actuallyPaid && { actuallyPaid: parseFloat(actuallyPaid) }),
      ...(payCurrency && { payCurrency }),
    };

    if (paymentStatus === "finished" || paymentStatus === "confirmed") {
      update.completedAt = new Date();

      const payment = await NowPaymentsPayment.findOne({ orderId });
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

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("NowPayments webhook error:", error);
    return NextResponse.json({ received: true });
  }
}
