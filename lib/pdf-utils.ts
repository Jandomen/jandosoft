import jsPDF from "jspdf";
import QRCode from "qrcode";
import { getCurrencySymbol } from "@/lib/utils/currency";

let wallpoetBase64: string | null = null;
let wallpoetLoaded = false;

async function loadWallpoetFont(): Promise<string | null> {
  if (wallpoetBase64) return wallpoetBase64;
  try {
    const res = await fetch("/fonts/Wallpoet-Regular.ttf");
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    wallpoetBase64 = btoa(binary);
    return wallpoetBase64;
  } catch {}
  return null;
}

async function ensureWallpoetFont(doc: jsPDF) {
  if (wallpoetLoaded) return;
  const b64 = await loadWallpoetFont();
  if (b64) {
    doc.addFileToVFS("Wallpoet-Regular.ttf", b64);
    doc.addFont("Wallpoet-Regular.ttf", "Wallpoet", "normal");
    wallpoetLoaded = true;
  }
}

async function addBrandHeader(doc: jsPDF) {
  doc.setFillColor(255, 0, 0);
  doc.rect(0, 0, 210, 42, "F");

  doc.setFillColor(220, 0, 0);
  doc.rect(0, 38, 210, 4, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(26);
  await ensureWallpoetFont(doc);
  if (wallpoetLoaded) {
    doc.setFont("Wallpoet", "normal");
  } else {
    doc.setFont("helvetica", "bold");
  }
  doc.text("JANDOSOFT", 20, 26);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(255, 200, 200);
  doc.text("Plataforma empresarial", 20, 34);
}

async function addBrandFooter(doc: jsPDF, y: number) {
  doc.setTextColor(161, 161, 170);
  doc.setFontSize(8);
  await ensureWallpoetFont(doc);
  if (wallpoetLoaded) {
    doc.setFont("Wallpoet", "normal");
  } else {
    doc.setFont("helvetica", "normal");
  }
  doc.text("© 2026 JANDOSOFT ENTERPRISE", 105, y, { align: "center" });
}

export async function generatePaymentReceiptPDF(transaction: {
  receiptNumber?: string;
  date?: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  currency: string;
  description: string;
  paymentMethod: string;
  storeName?: string;
  paymentId?: string;
}): Promise<Uint8Array> {
  const doc = new jsPDF();
  await addBrandHeader(doc);

  doc.setFontSize(14);
  doc.setTextColor(30, 30, 30);
  await ensureWallpoetFont(doc);
  if (wallpoetLoaded) {
    doc.setFont("Wallpoet", "normal");
  } else {
    doc.setFont("helvetica", "bold");
  }
  doc.text("RECIBO DE PAGO", 20, 52);

  doc.setDrawColor(255, 0, 0);
  doc.setLineWidth(0.8);
  doc.line(20, 56, 100, 56);

  const now = new Date();
  const tz = "America/Mexico_City";
  const fullDate = transaction.date
    ? transaction.date
    : now.toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric", timeZone: tz });
  const fullTime = now.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: tz });

  const infoBoxY = 65;
  doc.setFillColor(248, 248, 250);
  doc.roundedRect(20, infoBoxY, 170, 48, 3, 3, "F");

  doc.setFontSize(9);
  doc.setTextColor(130, 130, 140);
  doc.setFont("helvetica", "normal");

  doc.text("RECIBO #", 28, infoBoxY + 10);
  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "bold");
  doc.text(transaction.receiptNumber || transaction.paymentId || "N/A", 60, infoBoxY + 10);

  doc.setTextColor(130, 130, 140);
  doc.setFont("helvetica", "normal");
  doc.text("FECHA", 28, infoBoxY + 20);
  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "bold");
  doc.text(fullDate, 60, infoBoxY + 20);

  doc.setTextColor(130, 130, 140);
  doc.setFont("helvetica", "normal");
  doc.text("HORA", 120, infoBoxY + 20);
  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "bold");
  doc.text(fullTime, 138, infoBoxY + 20);

  doc.setTextColor(130, 130, 140);
  doc.setFont("helvetica", "normal");
  doc.text("CLIENTE", 28, infoBoxY + 30);
  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "bold");
  doc.text(transaction.customerName || transaction.customerEmail || "N/A", 60, infoBoxY + 30);

  doc.setTextColor(130, 130, 140);
  doc.setFont("helvetica", "normal");
  doc.text("EMAIL", 28, infoBoxY + 40);
  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "bold");
  const emailText = transaction.customerEmail || "N/A";
  doc.text(emailText.length > 40 ? emailText.slice(0, 38) + "..." : emailText, 60, infoBoxY + 40);

  if (transaction.storeName) {
    doc.setTextColor(130, 130, 140);
    doc.setFont("helvetica", "normal");
    doc.text("EMPRESA", 120, infoBoxY + 30);
    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "bold");
    doc.text(transaction.storeName, 150, infoBoxY + 30);
  }

  const tableTopY = 130;
  doc.setFillColor(255, 0, 0);
  doc.roundedRect(20, tableTopY, 170, 10, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("CONCEPTO", 28, tableTopY + 7);
  doc.text("IMPORTE", 170, tableTopY + 7, { align: "right" });

  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const rowY = tableTopY + 20;
  doc.text(transaction.description || "Pago", 28, rowY);

  const symbol = getCurrencySymbol(transaction.currency);
  doc.setFont("helvetica", "bold");
  doc.text(`${symbol}${transaction.amount.toFixed(2)} ${transaction.currency.toUpperCase()}`, 170, rowY, { align: "right" });

  const totalY = rowY + 15;
  doc.setDrawColor(255, 0, 0);
  doc.setLineWidth(1);
  doc.line(20, totalY, 190, totalY);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text("TOTAL PAGADO", 28, totalY + 10);
  doc.setTextColor(255, 0, 0);
  doc.setFontSize(13);
  doc.text(`${symbol}${transaction.amount.toFixed(2)} ${transaction.currency.toUpperCase()}`, 170, totalY + 10, { align: "right" });

  const infoBottomY = totalY + 22;
  doc.setFillColor(248, 248, 250);
  doc.roundedRect(20, infoBottomY, 170, 16, 3, 3, "F");

  doc.setTextColor(130, 130, 140);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Metodo de pago: ${transaction.paymentMethod || "Tarjeta"}`, 28, infoBottomY + 6);
  doc.text("JANDOSOFT Empresarial - Plataforma SaaS", 28, infoBottomY + 12);

  doc.setDrawColor(220, 220, 225);
  doc.setLineWidth(0.3);
  doc.line(20, 270, 190, 270);

  doc.setTextColor(180, 180, 185);
  doc.setFontSize(7);
  doc.text("Este recibo es generado automaticamente por JANDOSOFT Soluciones.", 105, 275, { align: "center" });
  doc.text("Para soporte: soporte@jandosoft.com", 105, 279, { align: "center" });

  await addBrandFooter(doc, 285);

  return new Uint8Array(doc.output("arraybuffer"));
}

export async function generateAffiliatePayoutReceiptPDF(data: {
  receiptNumber: string;
  affiliateName: string;
  affiliateEmail: string;
  amount: number;
  currency: string;
  method: string;
  payoutId: string;
  processedAt?: string;
  commissionCount?: number;
  referralCount?: number;
}): Promise<Uint8Array> {
  const doc = new jsPDF();
  await addBrandHeader(doc);

  doc.setFontSize(14);
  doc.setTextColor(30, 30, 30);
  await ensureWallpoetFont(doc);
  if (wallpoetLoaded) {
    doc.setFont("Wallpoet", "normal");
  } else {
    doc.setFont("helvetica", "bold");
  }
  doc.text("RECIBO DE COMISIÓN AFILIADO", 20, 52);

  doc.setDrawColor(255, 0, 0);
  doc.setLineWidth(0.8);
  doc.line(20, 56, 120, 56);

  const now = new Date();
  const tz = "America/Mexico_City";
  const fullDate = data.processedAt
    ? new Date(data.processedAt).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric", timeZone: tz })
    : now.toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric", timeZone: tz });
  const fullTime = now.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: tz });

  const infoBoxY = 65;
  doc.setFillColor(248, 248, 250);
  doc.roundedRect(20, infoBoxY, 170, 58, 3, 3, "F");

  doc.setFontSize(9);
  doc.setTextColor(130, 130, 140);
  doc.setFont("helvetica", "normal");

  doc.text("RECIBO #", 28, infoBoxY + 10);
  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "bold");
  doc.text(data.receiptNumber, 60, infoBoxY + 10);

  doc.setTextColor(130, 130, 140);
  doc.setFont("helvetica", "normal");
  doc.text("FECHA", 28, infoBoxY + 20);
  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "bold");
  doc.text(fullDate, 60, infoBoxY + 20);

  doc.setTextColor(130, 130, 140);
  doc.setFont("helvetica", "normal");
  doc.text("HORA", 120, infoBoxY + 20);
  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "bold");
  doc.text(fullTime, 138, infoBoxY + 20);

  doc.setTextColor(130, 130, 140);
  doc.setFont("helvetica", "normal");
  doc.text("AFILIADO", 28, infoBoxY + 30);
  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "bold");
  doc.text(data.affiliateName || "N/A", 60, infoBoxY + 30);

  doc.setTextColor(130, 130, 140);
  doc.setFont("helvetica", "normal");
  doc.text("EMAIL", 28, infoBoxY + 40);
  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "bold");
  const emailText = data.affiliateEmail || "N/A";
  doc.text(emailText.length > 40 ? emailText.slice(0, 38) + "..." : emailText, 60, infoBoxY + 40);

  doc.setTextColor(130, 130, 140);
  doc.setFont("helvetica", "normal");
  doc.text("MÉTODO", 28, infoBoxY + 50);
  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "bold");
  const methodLabel = data.method === "stripe" ? "Stripe Transfer" : data.method === "paypal" ? "PayPal" : "Transferencia Bancaria";
  doc.text(methodLabel, 60, infoBoxY + 50);

  const tableTopY = 140;
  doc.setFillColor(255, 0, 0);
  doc.roundedRect(20, tableTopY, 170, 10, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("CONCEPTO", 28, tableTopY + 7);
  doc.text("IMPORTE", 170, tableTopY + 7, { align: "right" });

  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const rowY = tableTopY + 20;
  const desc = `Comisión afiliado - ${data.commissionCount || 0} comision(es)`;
  doc.text(desc, 28, rowY);

  const symbol = getCurrencySymbol(data.currency);
  doc.setFont("helvetica", "bold");
  doc.text(`${symbol}${data.amount.toFixed(2)} ${data.currency.toUpperCase()}`, 170, rowY, { align: "right" });

  const totalY = rowY + 15;
  doc.setDrawColor(255, 0, 0);
  doc.setLineWidth(1);
  doc.line(20, totalY, 190, totalY);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text("TOTAL RETIRADO", 28, totalY + 10);
  doc.setTextColor(255, 0, 0);
  doc.setFontSize(13);
  doc.text(`${symbol}${data.amount.toFixed(2)} ${data.currency.toUpperCase()}`, 170, totalY + 10, { align: "right" });

  const infoBottomY = totalY + 22;
  doc.setFillColor(248, 248, 250);
  doc.roundedRect(20, infoBottomY, 170, 16, 3, 3, "F");

  doc.setTextColor(130, 130, 140);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Método de pago: ${methodLabel}`, 28, infoBottomY + 6);
  doc.text(`ID de retiro: ${data.payoutId}`, 28, infoBottomY + 12);

  doc.setDrawColor(220, 220, 225);
  doc.setLineWidth(0.3);
  doc.line(20, 270, 190, 270);

  doc.setTextColor(180, 180, 185);
  doc.setFontSize(7);
  doc.text("Este recibo es generado automaticamente por JANDOSOFT Soluciones.", 105, 275, { align: "center" });
  doc.text("Para soporte: soporte@jandosoft.com", 105, 279, { align: "center" });

  await addBrandFooter(doc, 285);

  return new Uint8Array(doc.output("arraybuffer"));
}

export const generateInvoicePDF = async (transaction: {
  id?: string;
  invoiceNumber?: string;
  date?: string;
  userEmail: string;
  userName?: string;
  amount: number;
  currency: string;
  items?: string[];
  paymentMethod?: string;
  taxId?: string;
  recipientTaxId?: string;
  recipientName?: string;
  recipientAddress?: string;
  baseAmount?: number;
  vatAmount?: number;
  vatRate?: number;
  verifactuQR?: string;
  invoiceHash?: string;
  previousHash?: string;
  series?: string;
}) => {
  const doc = new jsPDF();

  await addBrandHeader(doc);

  doc.setFontSize(10);
  await ensureWallpoetFont(doc);
  if (wallpoetLoaded) {
    doc.setFont("Wallpoet", "normal");
  } else {
    doc.setFont("helvetica", "bold");
  }
  doc.text("FACTURA VERIFACTU", 150, 25);

  const yStart = 55;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);

  let y = yStart;
  const leftX = 20;
  const rightX = 110;

  const emit = (label: string, value: string, x: number, row: number) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, x, row);
    doc.setFont("helvetica", "normal");
    const vX = x + doc.getTextWidth(label) + 3;
    doc.text(value, vX, row);
    return row + 7;
  };

  y = emit("Factura:", `${transaction.series ? transaction.series + "-" : ""}${transaction.invoiceNumber || transaction.id || "N/A"}`, leftX, y);
  y = emit("Fecha:", transaction.date || new Date().toLocaleDateString("es-MX", { timeZone: "America/Mexico_City" }), leftX, y);
  y = emit("NIF Emisor:", transaction.taxId || "PENDIENTE", leftX, y);
  y = emit("Cliente:", transaction.recipientName || transaction.userName || transaction.userEmail, leftX, y);
  y = emit("NIF Cliente:", transaction.recipientTaxId || "---", leftX, y);
  if (transaction.recipientAddress) {
    y = emit("Dirección:", transaction.recipientAddress, leftX, y);
  }

  const items = transaction.items || ["Servicio Jandosoft"];
  const tableY = y + 5;

  doc.setFillColor(244, 244, 245);
  doc.rect(20, tableY - 5, 170, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Concepto", 25, tableY);
  doc.text("Base", 120, tableY);
  doc.text("IVA", 145, tableY);
  doc.text("Total", 170, tableY);

  doc.setFont("helvetica", "normal");
  let rowY = tableY + 7;
  items.forEach((item) => {
    doc.text(item, 25, rowY);
    rowY += 6;
  });

  const totalY = rowY + 3;
  doc.setDrawColor(228, 228, 231);
  doc.line(20, totalY - 2, 190, totalY - 2);

  doc.setFontSize(9);
  const base = transaction.baseAmount ?? transaction.amount;
  const vatRate = transaction.vatRate ?? 21;
  const vat = transaction.vatAmount ?? (transaction.amount - base);
  const currency = transaction.currency || "EUR";

  doc.setFont("helvetica", "normal");
  doc.text(`Base Imponible:`, 110, totalY + 5);
  doc.text(`${currency} ${base.toFixed(2)}`, 170, totalY + 5, { align: "right" });
  doc.text(`IVA (${vatRate}%):`, 110, totalY + 12);
  doc.text(`${currency} ${vat.toFixed(2)}`, 170, totalY + 12, { align: "right" });

  doc.setDrawColor(255, 0, 0);
  doc.line(20, totalY + 16, 190, totalY + 16);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("TOTAL:", 110, totalY + 23);
  doc.setTextColor(255, 0, 0);
  doc.text(`${currency} ${transaction.amount.toFixed(2)}`, 170, totalY + 23, { align: "right" });

  let footerY = 250;

  if (transaction.verifactuQR) {
    try {
      const qrDataUrl = await QRCode.toDataURL(transaction.verifactuQR, {
        width: 60,
        margin: 1,
      });
      doc.addImage(qrDataUrl, "PNG", 20, footerY - 5, 25, 25);
    } catch {
      doc.text("QR: " + transaction.verifactuQR, 20, footerY - 5);
    }
  }

  doc.text("Verifactu - Sistema de Facturación", 55, footerY);
  doc.text(`Hash: ${transaction.invoiceHash?.slice(0, 32) || "---"}...`, 55, footerY + 5);
  doc.text(`Hash Anterior: ${transaction.previousHash?.slice(0, 32) || "---"}...`, 55, footerY + 10);

  doc.text("Este documento cumple con la Ley Antifraude 11/2021", 105, 275, { align: "center" });
  await addBrandFooter(doc, 280);

  doc.save(`Factura_${transaction.invoiceNumber || transaction.id || Date.now()}.pdf`);

  try {
    await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userEmail: transaction.userEmail,
        userName: transaction.userName || transaction.userEmail?.split("@")[0] || "Usuario",
        amount: transaction.amount,
        currency: transaction.currency,
        items: transaction.items || ["Servicio Jandosoft"],
        paymentMethod: transaction.paymentMethod || "Transferencia",
        taxId: transaction.taxId,
        recipientTaxId: transaction.recipientTaxId,
        recipientName: transaction.recipientName,
        recipientAddress: transaction.recipientAddress,
        baseAmount: transaction.baseAmount,
        vatAmount: transaction.vatAmount,
        vatRate: transaction.vatRate,
      }),
    });
  } catch (e) {
    console.error("Error saving invoice:", e);
  }
};
