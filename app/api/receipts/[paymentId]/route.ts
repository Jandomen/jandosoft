import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Payment } from "@/lib/models/Payment";
import { NowPaymentsPayment } from "@/lib/models/NowPaymentsPayment";
import { generatePaymentReceiptPDF } from "@/lib/pdf-utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const { paymentId } = await params;

    await connectDB();

    let payment = await Payment.findById(paymentId);
    let source = "stripe";

    if (!payment) {
      payment = await NowPaymentsPayment.findById(paymentId);
      source = "nowpayments";
    }

    if (!payment) {
      return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });
    }

    const receiptNumber = payment.receiptNumber || `RCP-${paymentId.slice(-6).toUpperCase()}`;

    let customerName: string;
    let customerEmail: string;
    let amount: number;
    let currency: string;
    let description: string;
    let storeName: string;
    let paymentMethod: string;

    if (source === "stripe") {
      customerName = (payment as any).customerName || (payment as any).customerEmail || "Cliente";
      customerEmail = (payment as any).customerEmail || "";
      amount = (payment as any).amount;
      currency = ((payment as any).currency || "usd").toUpperCase();
      description = (payment as any).description || "Pago en tienda";
      storeName = (payment as any).storeName || "Jandosoft";
      paymentMethod = "Tarjeta (Stripe)";
    } else {
      customerName = (payment as any).customerEmail?.split("@")[0] || "Cliente";
      customerEmail = (payment as any).customerEmail || "";
      amount = (payment as any).priceAmount;
      currency = ((payment as any).priceCurrency || "usd").toUpperCase();
      description = `Pago cripto - Order #${(payment as any).orderId}`;
      storeName = "Jandosoft";
      paymentMethod = "Cripto";
    }

    const pdfBuffer = await generatePaymentReceiptPDF({
      receiptNumber,
      customerName,
      customerEmail,
      amount,
      currency,
      description,
      paymentMethod,
      storeName,
      paymentId,
    });

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Recibo_${receiptNumber}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("[Receipt] Download error:", error);
    return NextResponse.json({ error: "Error al generar el recibo" }, { status: 500 });
  }
}
