import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Invoice } from "@/lib/models/Invoice";
import { Organization } from "@/lib/models/Organization";
import { getAuthFromCookies, getAuthFromHeaders } from "@/lib/auth";
import {
  computeInvoiceHash,
  generateQRContent,
  getNextInvoiceNumber,
} from "@/lib/verifactu";

export const dynamic = "force-dynamic";

async function getAuth(req: NextRequest) {
  return getAuthFromHeaders(req) || await getAuthFromCookies();
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuth(req);
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    await connectDB();
    let filter: any = {};

    if (auth) {
      filter.organizationId = auth.organizationId;
    }
    if (email && !auth) {
      filter.userEmail = email;
    }

    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    const [total, invoices] = await Promise.all([
      Invoice.countDocuments(filter),
      Invoice.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);
    return NextResponse.json({ invoices, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("GET invoices error:", error);
    return NextResponse.json({ error: "Error loading invoices" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuth(req);
    await connectDB();
    const body = await req.json();

    const org = auth
      ? await Organization.findById(auth.organizationId).lean()
      : null;

    const series = org?.invoiceSeries || "";
    const taxId = org?.taxId || body.taxId || "";
    const verifactuEnabled = org?.verifactuEnabled || false;

    const lastInvoice = await Invoice.findOne({ series })
      .sort({ createdAt: -1 })
      .lean();
    const invoiceNumber = getNextInvoiceNumber(lastInvoice as any, series);
    const previousHash = (lastInvoice as any)?.invoiceHash || "INICIAL";

    const vatRate = body.vatRate || 21;
    const baseAmount = body.baseAmount ?? (body.amount / (1 + vatRate / 100));
    const vatAmount = body.vatAmount ?? (body.amount - baseAmount);
    const issuedAt = new Date();

    const hashData = {
      series,
      invoiceNumber,
      taxId,
      recipientTaxId: body.recipientTaxId || body.userEmail || "",
      recipientName: body.recipientName || body.userName || "",
      baseAmount: Math.round(baseAmount * 100) / 100,
      vatAmount: Math.round(vatAmount * 100) / 100,
      vatRate,
      totalAmount: body.amount,
      currency: body.currency || "EUR",
      issuedAt,
      items: body.items || [],
    };

    const invoiceHash = computeInvoiceHash(hashData, previousHash);
    const verifactuQR = verifactuEnabled
      ? generateQRContent(taxId, invoiceNumber, series, issuedAt, baseAmount, vatAmount, invoiceHash, previousHash)
      : "";

    const invoice = await Invoice.create({
      ...body,
      invoiceNumber,
      series,
      taxId,
      previousHash,
      invoiceHash,
      verifactuQR,
      baseAmount: Math.round(baseAmount * 100) / 100,
      vatAmount: Math.round(vatAmount * 100) / 100,
      vatRate,
      signedAt: issuedAt,
      organizationId: auth?.organizationId || null,
    });

    return NextResponse.json({ invoice });
  } catch (error) {
    console.error("POST invoice error:", error);
    return NextResponse.json({ error: "Error creating invoice" }, { status: 500 });
  }
}
