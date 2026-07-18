import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Payment } from "@/lib/models/Payment";
import { NowPaymentsPayment } from "@/lib/models/NowPaymentsPayment";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId");
    const email = searchParams.get("email");
    const ownerEmail = searchParams.get("ownerEmail");
    const customerEmail = searchParams.get("customerEmail");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    await connectDB();

    let filter: any = {};
    if (storeId) filter.storeId = storeId;
    if (email) filter.ownerEmail = email;
    if (ownerEmail) filter.ownerEmail = ownerEmail;
    if (customerEmail) filter.customerEmail = customerEmail;
    if (status && status !== "all") {
      filter.status = status;
    }
    if (search) {
      filter.$or = [
        { customerEmail: { $regex: search, $options: "i" } },
        { customerName: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { receiptNumber: { $regex: search, $options: "i" } },
      ];
    }

    let nowFilter: any = {};
    if (customerEmail) nowFilter.customerEmail = customerEmail;
    if (status === "completed") nowFilter.paymentStatus = "finished";
    if (status === "pending") nowFilter.paymentStatus = { $in: ["waiting", "confirming"] };
    if (status === "failed") nowFilter.paymentStatus = { $in: ["failed", "expired", "cancelled"] };
    if (search) {
      nowFilter.$or = [
        { customerEmail: { $regex: search, $options: "i" } },
        { orderId: { $regex: search, $options: "i" } },
      ];
    }

    const [stripePayments, nowPayments, stripeTotal, nowTotal] = await Promise.all([
      Payment.find(filter).sort({ createdAt: -1 }).lean(),
      NowPaymentsPayment.find(nowFilter).sort({ createdAt: -1 }).lean(),
      Payment.countDocuments(filter),
      NowPaymentsPayment.countDocuments(nowFilter),
    ]);

    const allPayments = [
      ...stripePayments.map((p: any) => ({
        ...p,
        source: "stripe",
        displayAmount: p.amount,
        displayCurrency: (p.currency || "usd").toUpperCase(),
        displayDescription: p.description || "Pago en tienda",
        displayPaymentMethod: "Tarjeta (Stripe)",
      })),
      ...nowPayments.map((p: any) => ({
        ...p,
        source: "nowpayments",
        displayAmount: p.priceAmount,
        displayCurrency: (p.priceCurrency || "usd").toUpperCase(),
        displayDescription: `Pago cripto - Order #${p.orderId}`,
        displayPaymentMethod: `Cripto (${p.payCurrency || "BTC"})`,
      })),
    ].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const totalCount = allPayments.length;
    const paginatedPayments = allPayments.slice((page - 1) * limit, page * limit);

    const totalRevenue = allPayments
      .filter((p: any) => p.status === "completed" || p.paymentStatus === "finished" || p.paymentStatus === "confirmed")
      .reduce((sum: number, p: any) => sum + (p.displayAmount || 0), 0);

    return NextResponse.json({
      payments: paginatedPayments,
      stats: { totalRevenue, count: totalCount },
      page,
      totalPages: Math.ceil(totalCount / limit),
      total: totalCount,
    });
  } catch (error: any) {
    console.error("Error fetching payments:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
