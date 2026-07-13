import { NextRequest, NextResponse } from "next/server";
import { sendCampaignEmail } from "@/lib/email-service";
import { sendWhatsAppBusiness } from "@/lib/services/integrations";
import { connectDB } from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  try {
    const { storeId, customerIds, subject, message, channel = "email" } = await req.json();

    if (!storeId || !customerIds?.length || !message) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }
    if (channel === "email" && !subject) {
      return NextResponse.json({ error: "El asunto es obligatorio para email" }, { status: 400 });
    }

    await connectDB();
    const { Customer } = await import("@/lib/models/Customer");
    const { Store } = await import("@/lib/models/Store");
    const { Integration } = await import("@/lib/models/Integration");

    const store = await Store.findById(storeId);
    if (!store) return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });

    const storeName = store.name || store.businessName || "Mi tienda";

    // Get WhatsApp Business credentials if needed
    let whatsappCreds: Record<string, string> | null = null;
    if (channel === "whatsapp" || channel === "both") {
      const integration = await Integration.findOne({ storeId, platform: "whatsapp_business", active: true });
      if (integration?.credentials) {
        whatsappCreds = integration.credentials as Record<string, string>;
      }
    }

    const customers = await Customer.find({ _id: { $in: customerIds }, storeId });
    if (!customers.length) {
      return NextResponse.json({ error: "No se encontraron leads" }, { status: 404 });
    }

    const results = [];
    for (const c of customers) {
      if (channel === "whatsapp") {
        if (!c.phone) {
          results.push({ name: c.name, status: "skipped", reason: "Sin teléfono" });
          continue;
        }
        if (!whatsappCreds) {
          results.push({ name: c.name, status: "skipped", reason: "WhatsApp no configurado" });
          continue;
        }
        const result = await sendWhatsAppBusiness(whatsappCreds, c.phone, message);
        results.push({
          name: c.name,
          phone: c.phone,
          status: result.success ? "sent" : "failed",
          error: result.error,
        });
      } else if (channel === "both") {
        const emailResult = c.email
          ? await sendCampaignEmail({ to: c.email, subject: subject || "Promoción", content: message, storeId, storeName })
          : null;
        const waResult = c.phone && whatsappCreds
          ? await sendWhatsAppBusiness(whatsappCreds, c.phone, message)
          : null;
        const statuses: string[] = [];
        if (emailResult?.success) statuses.push("email");
        if (waResult?.success) statuses.push("whatsapp");
        results.push({
          name: c.name,
          email: c.email,
          phone: c.phone,
          status: statuses.length > 0 ? statuses.join("+") : "failed",
          errors: [
            emailResult && !emailResult.success ? emailResult.error : null,
            waResult && !waResult.success ? waResult.error : null,
          ].filter(Boolean),
        });
      } else {
        // email only (default)
        if (!c.email) {
          results.push({ name: c.name, status: "skipped", reason: "Sin email" });
          continue;
        }
        const result = await sendCampaignEmail({
          to: c.email,
          subject,
          content: message,
          storeId,
          storeName,
        });
        results.push({
          name: c.name,
          email: c.email,
          status: result.success ? "sent" : "failed",
          error: result.error,
        });
      }
    }

    const sent = results.filter(r => r.status === "sent" || r.status.includes("email") || r.status.includes("whatsapp")).length;
    const failed = results.filter(r => r.status === "failed").length;
    const skipped = results.filter(r => r.status === "skipped").length;

    let summary = `Promoción enviada: ${sent} enviados`;
    if (failed) summary += `, ${failed} fallaron`;
    if (skipped) summary += `, ${skipped} omitidos`;
    if (channel === "both") summary += ` (email + WhatsApp)`;
    else if (channel === "whatsapp") summary += ` (WhatsApp)`;
    else summary += ` (email)`;

    return NextResponse.json({ success: true, message: summary, results });
  } catch (error: any) {
    console.error("promotions/send error:", error);
    return NextResponse.json({ error: error.message || "Error al enviar promociones" }, { status: 500 });
  }
}
