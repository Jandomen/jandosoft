import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { AffiliatePayout } from "@/lib/models/AffiliatePayout";
import { Affiliate } from "@/lib/models/Affiliate";
import { Commission } from "@/lib/models/Commission";
import { generateAffiliatePayoutReceiptPDF } from "@/lib/pdf-utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ payoutId: string }> }
) {
  try {
    const { payoutId } = await params;

    await connectDB();

    const payout = await AffiliatePayout.findById(payoutId);
    if (!payout) {
      return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });
    }

    const affiliate = await Affiliate.findById(payout.affiliateId);
    if (!affiliate) {
      return NextResponse.json({ error: "Afiliado no encontrado" }, { status: 404 });
    }

    const commissionCount = payout.commissions?.length || 0;

    const receiptNumber = payout.receiptNumber || `AF-RCP-${payoutId.slice(-6).toUpperCase()}`;

    const pdfBuffer = await generateAffiliatePayoutReceiptPDF({
      receiptNumber,
      affiliateName: affiliate.name || "Afiliado",
      affiliateEmail: affiliate.email || "",
      amount: payout.amount,
      currency: "MXN",
      method: payout.method,
      payoutId: payout._id.toString(),
      processedAt: payout.processedAt?.toISOString(),
      commissionCount,
    });

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Recibo_Afiliado_${receiptNumber}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("[AffiliateReceipt] Download error:", error);
    return NextResponse.json({ error: "Error al generar el recibo" }, { status: 500 });
  }
}
