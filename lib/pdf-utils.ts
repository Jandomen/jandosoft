import jsPDF from "jspdf";

export const generateInvoicePDF = async (transaction: {
  id?: string;
  date?: string;
  userEmail: string;
  userName?: string;
  amount: number;
  currency: string;
  items?: string[];
  paymentMethod?: string;
}) => {
  const doc = new jsPDF();

  doc.setFillColor(220, 38, 38);
  doc.rect(0, 0, 210, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("JANDOSOFT", 20, 25);

  doc.setFontSize(10);
  doc.text("COMPROBANTE DE PAGO OFICIAL", 150, 25);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.text(`ID: ${transaction.id || "N/A"}`, 20, 60);
  doc.text(`Fecha: ${transaction.date || new Date().toLocaleDateString()}`, 20, 70);
  doc.text(`Cliente: ${transaction.userEmail}`, 20, 80);
  doc.text(`Método: ${(transaction.paymentMethod || "Transferencia").toUpperCase()}`, 20, 90);

  doc.setFillColor(244, 244, 245);
  doc.rect(20, 105, 170, 10, "F");
  doc.setFont("helvetica", "bold");
  doc.text("Concepto", 25, 112);
  doc.text("Total", 160, 112);

  doc.setFont("helvetica", "normal");
  let y = 125;
  const items = transaction.items || ["Servicio Jandosoft"];
  items.forEach(item => {
    doc.text(item, 25, y);
    y += 10;
  });

  doc.setDrawColor(228, 228, 231);
  doc.line(20, y, 190, y);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL PAGADO:", 110, y + 15);
  doc.setTextColor(220, 38, 38);
  doc.text(`${transaction.currency} $${transaction.amount}`, 160, y + 15);

  doc.setTextColor(161, 161, 170);
  doc.setFontSize(8);
  doc.text("Este es un comprobante generado automáticamente por Jandosoft Engine.", 105, 280, { align: "center" });
  doc.text("© 2026 JANDOSOFT ENTERPRISE - Todos los derechos reservados.", 105, 285, { align: "center" });

  doc.save(`Factura_Jandosoft_${transaction.id || Date.now()}.pdf`);

  try {
    await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userEmail: transaction.userEmail,
        userName: transaction.userName || transaction.userEmail?.split("@")[0] || "Usuario",
        amount: transaction.amount,
        currency: transaction.currency,
        items,
        paymentMethod: transaction.paymentMethod || "Transferencia",
      }),
    });
  } catch (e) {
    console.error("Error saving invoice:", e);
  }
};
