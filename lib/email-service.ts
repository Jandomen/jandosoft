import { connectDB } from "@/lib/mongodb";
import { EmailLog } from "@/lib/models/EmailLog";
import { sendEmail } from "@/lib/email";
import {
  welcomeEmailHtml,
  passwordResetEmailHtml,
  invoiceEmailHtml,
  appointmentReminderEmailHtml,
  paymentConfirmationEmailHtml,
  orderConfirmationEmailHtml,
  newClientNotificationEmailHtml,
  paymentReceivedNotificationEmailHtml,
  campaignEmailHtml,
} from "@/lib/email-templates";

interface EmailBase {
  to: string;
  storeId?: string;
  organizationId?: string;
}

async function logEmail(params: {
  to: string;
  subject: string;
  messageId?: string;
  status: "sent" | "failed";
  storeId?: string;
  organizationId?: string;
  template?: string;
  error?: string;
}) {
  try {
    await connectDB();
    await EmailLog.create({
      to: params.to,
      subject: params.subject,
      messageId: params.messageId,
      status: params.status,
      storeId: params.storeId || undefined,
      organizationId: params.organizationId || undefined,
      template: params.template,
      error: params.error,
    });
  } catch (err) {
    console.error("[EmailLog] Error saving log:", err);
  }
}

export async function sendWelcomeEmail(params: EmailBase & { userName: string }) {
  const subject = "¡Bienvenido a Jandosoft!";
  const html = welcomeEmailHtml(params.userName);
  const result = await sendEmail({ to: params.to, subject, html, storeId: params.storeId });
  await logEmail({
    to: params.to, subject, messageId: result.messageId,
    status: result.success ? "sent" : "failed",
    storeId: params.storeId, organizationId: params.organizationId,
    template: "welcome", error: result.error,
  });
  return result;
}

export async function sendPasswordResetEmail(params: EmailBase & { token: string }) {
  const subject = "Restablece tu contraseña — Jandosoft";
  const html = passwordResetEmailHtml(params.token);
  const result = await sendEmail({ to: params.to, subject, html, storeId: params.storeId });
  await logEmail({
    to: params.to, subject, messageId: result.messageId,
    status: result.success ? "sent" : "failed",
    storeId: params.storeId, organizationId: params.organizationId,
    template: "password-reset", error: result.error,
  });
  return result;
}

export async function sendInvoiceEmail(params: EmailBase & {
  invoiceNumber: string;
  userName: string;
  amount: number;
  currency: string;
  items: string[];
  date: string;
}) {
  const subject = `Factura #${params.invoiceNumber} — Jandosoft`;
  const html = invoiceEmailHtml({
    invoiceNumber: params.invoiceNumber,
    userName: params.userName,
    amount: params.amount,
    currency: params.currency,
    items: params.items,
    date: params.date,
  });
  const result = await sendEmail({ to: params.to, subject, html, storeId: params.storeId });
  await logEmail({
    to: params.to, subject, messageId: result.messageId,
    status: result.success ? "sent" : "failed",
    storeId: params.storeId, organizationId: params.organizationId,
    template: "invoice", error: result.error,
  });
  return result;
}

export async function sendAppointmentReminderEmail(params: EmailBase & {
  customerName: string;
  serviceName: string;
  date: string;
  time: string;
  notes?: string;
}) {
  const subject = `Recordatorio: ${params.serviceName} — ${params.date}`;
  const html = appointmentReminderEmailHtml({
    customerName: params.customerName,
    serviceName: params.serviceName,
    date: params.date,
    time: params.time,
    notes: params.notes,
  });
  const result = await sendEmail({ to: params.to, subject, html, storeId: params.storeId });
  await logEmail({
    to: params.to, subject, messageId: result.messageId,
    status: result.success ? "sent" : "failed",
    storeId: params.storeId, organizationId: params.organizationId,
    template: "appointment-reminder", error: result.error,
  });
  return result;
}

export async function sendPaymentConfirmationEmail(params: EmailBase & {
  customerName: string;
  amount: number;
  currency: string;
  description: string;
  date: string;
  storeName: string;
}) {
  const subject = `Pago Confirmado — ${params.storeName}`;
  const html = paymentConfirmationEmailHtml({
    customerName: params.customerName,
    amount: params.amount,
    currency: params.currency,
    description: params.description,
    date: params.date,
    storeName: params.storeName,
  });
  const result = await sendEmail({ to: params.to, subject, html, storeId: params.storeId });
  await logEmail({
    to: params.to, subject, messageId: result.messageId,
    status: result.success ? "sent" : "failed",
    storeId: params.storeId, organizationId: params.organizationId,
    template: "payment-confirmation", error: result.error,
  });
  return result;
}

export async function sendOrderConfirmationEmail(params: EmailBase & {
  customerName: string;
  orderId: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  currency: string;
  storeName: string;
}) {
  const subject = `Pedido Confirmado #${params.orderId} — ${params.storeName}`;
  const html = orderConfirmationEmailHtml({
    customerName: params.customerName,
    orderId: params.orderId,
    items: params.items,
    total: params.total,
    currency: params.currency,
    storeName: params.storeName,
  });
  const result = await sendEmail({ to: params.to, subject, html, storeId: params.storeId });
  await logEmail({
    to: params.to, subject, messageId: result.messageId,
    status: result.success ? "sent" : "failed",
    storeId: params.storeId, organizationId: params.organizationId,
    template: "order-confirmation", error: result.error,
  });
  return result;
}

export async function sendNewClientNotificationEmail(params: EmailBase & {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  storeName: string;
}) {
  const subject = `Nuevo Cliente — ${params.storeName}`;
  const html = newClientNotificationEmailHtml({
    clientName: params.clientName,
    clientEmail: params.clientEmail,
    clientPhone: params.clientPhone,
    storeName: params.storeName,
  });
  const result = await sendEmail({ to: params.to, subject, html, storeId: params.storeId });
  await logEmail({
    to: params.to, subject, messageId: result.messageId,
    status: result.success ? "sent" : "failed",
    storeId: params.storeId, organizationId: params.organizationId,
    template: "new-client-notification", error: result.error,
  });
  return result;
}

export async function sendPaymentReceivedNotificationEmail(params: EmailBase & {
  storeName: string;
  customerName: string;
  amount: number;
  currency: string;
  date: string;
}) {
  const subject = `Pago Recibido — ${params.storeName}`;
  const html = paymentReceivedNotificationEmailHtml({
    storeName: params.storeName,
    customerName: params.customerName,
    amount: params.amount,
    currency: params.currency,
    date: params.date,
  });
  const result = await sendEmail({ to: params.to, subject, html, storeId: params.storeId });
  await logEmail({
    to: params.to, subject, messageId: result.messageId,
    status: result.success ? "sent" : "failed",
    storeId: params.storeId, organizationId: params.organizationId,
    template: "payment-received", error: result.error,
  });
  return result;
}

export async function sendCampaignEmail(params: EmailBase & {
  subject: string;
  content: string;
  storeName: string;
}) {
  const html = campaignEmailHtml({ content: params.content, storeName: params.storeName });
  const result = await sendEmail({ to: params.to, subject: params.subject, html, storeId: params.storeId });
  await logEmail({
    to: params.to, subject: params.subject, messageId: result.messageId,
    status: result.success ? "sent" : "failed",
    storeId: params.storeId, organizationId: params.organizationId,
    template: "campaign", error: result.error,
  });
  return result;
}
