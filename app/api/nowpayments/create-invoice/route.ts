import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/mongodb";
import { NowPaymentsPayment } from "@/lib/models/NowPaymentsPayment";

const NP_API = "https://api.nowpayments.io/v1/invoice";
const NP_API_KEY = process.env.NOWPAYMENTS_API_KEY || "";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, currency, email, storeId, description } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Monto inválido" }, { status: 400 });
    }

    const orderId = crypto.randomUUID();
    const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

    const invoiceRes = await fetch(NP_API, {
      method: "POST",
      headers: {
        "x-api-key": NP_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        price_amount: amount,
        price_currency: (currency || "usd").toLowerCase(),
        order_id: orderId,
        order_description: description || "Compra Jandosoft",
        ipn_callback_url: `${baseUrl}/api/nowpayments/webhook`,
        success_url: `${baseUrl}/?crypto_success=${orderId}`,
        cancel_url: `${baseUrl}/?crypto_cancel=${orderId}`,
        is_fixed_rate: true,
        is_fee_paid_by_user: true,
      }),
    });

    if (!invoiceRes.ok) {
      const errText = await invoiceRes.text();
      console.error("NowPayments invoice error:", invoiceRes.status, errText);
      return NextResponse.json({ error: "Error al crear la factura crypto" }, { status: 502 });
    }

    const invoiceData = await invoiceRes.json();

    await connectDB();
    await NowPaymentsPayment.create({
      storeId: storeId || undefined,
      orderId,
      invoiceId: invoiceData.id,
      invoiceUrl: invoiceData.invoice_url,
      priceAmount: amount,
      priceCurrency: (currency || "usd").toLowerCase(),
      customerEmail: email || "",
    });

    return NextResponse.json({
      invoiceUrl: invoiceData.invoice_url,
      orderId,
    });
  } catch (error) {
    console.error("POST /api/nowpayments/create-invoice error:", error);
    return NextResponse.json({ error: "Error al procesar pago crypto" }, { status: 500 });
  }
}
