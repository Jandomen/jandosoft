import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Invoice } from "@/lib/models/Invoice";
import { getAuthFromCookies, getAuthFromHeaders } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function getAuth(req: NextRequest) {
  return getAuthFromHeaders(req) || await getAuthFromCookies();
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "json";
    const year = searchParams.get("year") || new Date().getFullYear().toString();

    const invoices = await Invoice.find({
      organizationId: auth.organizationId,
      signedAt: {
        $gte: new Date(`${year}-01-01T00:00:00Z`),
        $lte: new Date(`${year}-12-31T23:59:59Z`),
      },
    })
      .sort({ signedAt: 1 })
      .lean();

    if (format === "json") {
      return NextResponse.json({
        empresa: auth.email,
        año: year,
        totalFacturas: invoices.length,
        libroRegistro: invoices.map((inv: any) => ({
          numeroFactura: inv.invoiceNumber,
          serie: inv.series,
          fechaEmision: inv.signedAt?.toISOString?.() || inv.signedAt,
          nifEmisor: inv.taxId,
          nifReceptor: inv.recipientTaxId,
          nombreReceptor: inv.recipientName,
          baseImponible: inv.baseAmount,
          cuotaIva: inv.vatAmount,
          tipoIva: inv.vatRate,
          total: inv.amount,
          moneda: inv.currency,
          hash: inv.invoiceHash,
          hashAnterior: inv.previousHash,
          qr: inv.verifactuQR,
          tipo: inv.invoiceType,
        })),
      });
    }

    const header = "NumeroFactura;Serie;FechaEmision;NIFEmisor;NIFReceptor;NombreReceptor;BaseImponible;CuotaIVA;TipoIVA;Total;Moneda;Hash;HashAnterior;Tipo";
    const rows = invoices.map((inv: any) =>
      [
        inv.invoiceNumber,
        inv.series,
        inv.signedAt?.toISOString?.() || inv.signedAt,
        inv.taxId,
        inv.recipientTaxId,
        `"${inv.recipientName || ""}"`,
        inv.baseAmount,
        inv.vatAmount,
        inv.vatRate,
        inv.amount,
        inv.currency,
        inv.invoiceHash,
        inv.previousHash,
        inv.invoiceType,
      ].join(";")
    );

    return new NextResponse([header, ...rows].join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="verifactu-${year}.csv"`,
      },
    });
  } catch (error) {
    console.error("Verifactu export error:", error);
    return NextResponse.json({ error: "Error al exportar libro registro" }, { status: 500 });
  }
}
