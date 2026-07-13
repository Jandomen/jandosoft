import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Communication } from "@/lib/models/Communication";
import { Customer } from "@/lib/models/Customer";
import { Store } from "@/lib/models/Store";
import { getAuthFromHeaders, verifyToken } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { sendSMS } from "@/lib/sms-service";
import { sendWhatsAppBusiness } from "@/lib/services/integrations";

async function getAuth(req: NextRequest) {
  const fromHeaders = getAuthFromHeaders(req);
  if (fromHeaders) return fromHeaders;
  const token = req.cookies.get("jandosession")?.value;
  if (token) return verifyToken(token);
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuth(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId");
    const customerId = searchParams.get("customerId");
    const type = searchParams.get("type");

    if (!storeId) return NextResponse.json({ error: "storeId requerido" }, { status: 400 });

    await connectDB();

    let filter: any = { storeId };
    if (customerId) filter.customerId = customerId;
    if (type) filter.type = type;

    const communications = await Communication.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({ communications });
  } catch (error) {
    console.error("GET /api/communications error:", error);
    return NextResponse.json({ error: "Error al obtener comunicaciones" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuth(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await req.json();
    const { storeId, customerId, type, subject, body: messageBody } = body;

    if (!storeId || !customerId || !type) {
      return NextResponse.json({ error: "storeId, customerId y type son requeridos" }, { status: 400 });
    }

    await connectDB();

    const customer = await Customer.findById(customerId).lean() as any;
    if (!customer) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });

    let status: "sent" | "failed" = "sent";
    let externalId = "";
    let to = "";

    if (type === "email") {
      to = customer.email || "";
      if (!to) return NextResponse.json({ error: "El cliente no tiene correo electrónico" }, { status: 400 });
      const emailResult = await sendEmail({
        to,
        subject: subject || "Mensaje de Jandosoft",
        html: messageBody || "",
      });
      if (!emailResult.success) status = "failed";
      externalId = emailResult.messageId || "";
    }

    if (type === "sms") {
      to = customer.phone || "";
      if (!to) return NextResponse.json({ error: "El cliente no tiene número de teléfono" }, { status: 400 });
      const smsResult = await sendSMS({ to, body: messageBody || "" });
      if (!smsResult.success) status = "failed";
      externalId = smsResult.messageId || "";
    }

    if (type === "whatsapp") {
      to = customer.phone || "";
      if (!to) return NextResponse.json({ error: "El cliente no tiene número de teléfono" }, { status: 400 });
      const store = await Store.findById(storeId).lean() as any;
      const whatsappIntegration = store?.integrations?.find((i: any) => i.platform === "whatsapp_business" && i.enabled);
      if (!whatsappIntegration) {
        return NextResponse.json({ error: "WhatsApp Business no está configurado. Configúralo desde Integraciones." }, { status: 400 });
      }
      const waResult = await sendWhatsAppBusiness(whatsappIntegration.credentials, to, messageBody || "");
      if (!waResult.success) status = "failed";
    }

    const communication = await Communication.create({
      storeId,
      customerId,
      type,
      direction: "sent",
      subject: subject || "",
      body: messageBody || "",
      to,
      status,
      externalId,
    });

    return NextResponse.json({ communication }, { status: 201 });
  } catch (error) {
    console.error("POST /api/communications error:", error);
    return NextResponse.json({ error: "Error al enviar comunicación" }, { status: 500 });
  }
}
