import crypto from "crypto";

export interface VerifactuInvoiceData {
  series: string;
  invoiceNumber: string;
  taxId: string;
  recipientTaxId: string;
  recipientName: string;
  baseAmount: number;
  vatAmount: number;
  vatRate: number;
  totalAmount: number;
  currency: string;
  issuedAt: Date;
  items: string[];
}

export function computeInvoiceHash(data: VerifactuInvoiceData, previousHash: string): string {
  const payload = JSON.stringify({
    previousHash,
    series: data.series,
    invoiceNumber: data.invoiceNumber,
    taxId: data.taxId,
    recipientTaxId: data.recipientTaxId,
    recipientName: data.recipientName,
    baseAmount: data.baseAmount,
    vatAmount: data.vatAmount,
    vatRate: data.vatRate,
    totalAmount: data.totalAmount,
    currency: data.currency,
    issuedAt: data.issuedAt.toISOString(),
    items: data.items,
  });
  return crypto.createHash("sha256").update(payload).digest("hex");
}

export function generateQRContent(
  taxId: string,
  invoiceNumber: string,
  series: string,
  issuedAt: Date,
  baseAmount: number,
  vatAmount: number,
  invoiceHash: string,
  previousHash: string,
): string {
  const dateStr = issuedAt.toLocaleDateString("es-ES", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
  return `NIF:${taxId};FACTURA:${series}${series ? "-" : ""}${invoiceNumber};FECHA:${dateStr};BASE:${baseAmount.toFixed(2)};IVA:${vatAmount.toFixed(2)};HASH:${invoiceHash};HASH_PREV:${previousHash}`;
}

export function getNextInvoiceNumber(lastInvoice: { series: string; invoiceNumber: string } | null, series: string): string {
  const year = new Date().getFullYear();
  if (!lastInvoice) return `${series ? series + "-" : ""}${year}-0001`;
  const parts = lastInvoice.invoiceNumber.split("-");
  const lastNum = parseInt(parts[parts.length - 1] || "0", 10);
  const nextNum = lastNum + 1;
  return `${series ? series + "-" : ""}${year}-${String(nextNum).padStart(4, "0")}`;
}

export function formatInvoiceNumber(num: string, series: string): string {
  return series ? `${series}-${num}` : num;
}
