import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { connectDB } from "@/lib/mongodb";
import { EmailLog } from "@/lib/models/EmailLog";
import { withAuth } from "@/lib/api-middleware";
import { checkRateLimit } from "@/lib/rate-limiter";
import {
  welcomeEmailHtml,
  passwordResetEmailHtml,
  verificationEmailHtml,
  invoiceEmailHtml,
  appointmentReminderEmailHtml,
  paymentConfirmationEmailHtml,
  orderConfirmationEmailHtml,
  newClientNotificationEmailHtml,
  paymentReceivedNotificationEmailHtml,
  campaignEmailHtml,
} from "@/lib/email-templates";

const TEMPLATES: Record<string, (params: any) => string> = {
  welcome: (p) => welcomeEmailHtml(p.userName),
  "password-reset": (p) => passwordResetEmailHtml(p.token),
  verification: (p) => verificationEmailHtml(p.token, p.userName),
  invoice: (p) => invoiceEmailHtml(p),
  "appointment-reminder": (p) => appointmentReminderEmailHtml(p),
  "payment-confirmation": (p) => paymentConfirmationEmailHtml(p),
  "order-confirmation": (p) => orderConfirmationEmailHtml(p),
  "new-client": (p) => newClientNotificationEmailHtml(p),
  "payment-received": (p) => paymentReceivedNotificationEmailHtml(p),
  campaign: (p) => campaignEmailHtml(p),
};

export const POST = withAuth(async (req: NextRequest, auth, body) => {
  const { to, subject, content, template, templateParams } = body;

  if (!to || !subject) {
    return NextResponse.json({ error: "Faltan campos requeridos: to, subject" }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const rateCheck = checkRateLimit(`email-send:${auth.userId}:${ip}`, 20, 60_000);
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: `Demasiados correos. Espera ${Math.ceil(rateCheck.resetIn / 1000)}s.` }, { status: 429 });
  }

  let html: string;
  if (content) {
    html = content;
  } else if (template && TEMPLATES[template]) {
    html = TEMPLATES[template](templateParams || {});
  } else {
    return NextResponse.json({ error: "Debes proporcionar content o un template válido" }, { status: 400 });
  }

  const result = await sendEmail({ to, subject, html });

  await connectDB();
  await EmailLog.create({
    to,
    subject,
    messageId: result.messageId,
    status: result.success ? "sent" : "failed",
    organizationId: auth.organizationId,
    template: template || "custom",
    error: result.error,
  });

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true, messageId: result.messageId });
});
