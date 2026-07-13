import type { ToolDefinition, ToolResult } from "./base";

export const TOOLS: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "send_email",
      description: "Send an email. Use content for custom HTML or template for predefined templates (welcome, invoice, etc.)",
      parameters: {
        type: "object",
        properties: {
          to: { type: "string", description: "Recipient email" },
          subject: { type: "string", description: "Email subject" },
          content: { type: "string", description: "Custom HTML content (mutually exclusive with template)" },
          template: { type: "string", enum: ["welcome", "password-reset", "verification", "invoice", "appointment-reminder", "payment-confirmation", "order-confirmation", "new-client", "payment-received", "campaign"], description: "Predefined template name" },
          templateParams: { type: "object", description: "Parameters for the template" },
        },
        required: ["to", "subject"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "send_gmail",
      description: "Send email via Gmail integration",
      parameters: {
        type: "object",
        properties: {
          to: { type: "string", description: "Recipient email" },
          subject: { type: "string", description: "Email subject" },
          body: { type: "string", description: "Email body text" },
        },
        required: ["to", "subject", "body"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "send_messenger",
      description: "Send a message via Facebook Messenger",
      parameters: {
        type: "object",
        properties: {
          recipientId: { type: "string", description: "Messenger recipient ID" },
          message: { type: "string", description: "Message text" },
        },
        required: ["recipientId", "message"],
      },
    },
  },
];

export async function executeEmailTool(name: string, args: any, store: any, userId: string): Promise<ToolResult> {
  const { connectDB } = await import("@/lib/mongodb");

  if (name === "send_email") {
    const { sendEmail } = await import("@/lib/email");
    const { EmailLog } = await import("@/lib/models/EmailLog");
    const {
      welcomeEmailHtml, passwordResetEmailHtml, verificationEmailHtml,
      invoiceEmailHtml, appointmentReminderEmailHtml, paymentConfirmationEmailHtml,
      orderConfirmationEmailHtml, newClientNotificationEmailHtml,
      paymentReceivedNotificationEmailHtml, campaignEmailHtml,
    } = await import("@/lib/email-templates");

    const TEMPLATES: Record<string, (p: any) => string> = {
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

    let html: string;
    if (args.content) {
      html = args.content;
    } else if (args.template && TEMPLATES[args.template]) {
      html = TEMPLATES[args.template](args.templateParams || {});
    } else {
      return { error: "Debes proporcionar content o un template válido" };
    }

    const { User } = await import("@/lib/models/User");
    await connectDB();
    const user = await User.findById(userId);
    const result = await sendEmail({ to: args.to, subject: args.subject, html });
    await EmailLog.create({
      to: args.to, subject: args.subject, messageId: result.messageId,
      status: result.success ? "sent" : "failed",
      organizationId: user?.organizationId || "unknown", error: result.error,
    });

    if (!result.success) return { error: `Error al enviar correo: ${result.error}` };
    return { success: true, message: `Correo enviado a ${args.to}: "${args.subject}"` };
  }

  if (name === "send_gmail") {
    const storeId = store?._id || store?.id;
    if (!storeId) return { error: "No store selected" };
    const { Integration } = await import("@/lib/models/Integration");
    await connectDB();
    const integration = await Integration.findOne({ storeId, platform: "gmail", enabled: true });
    if (!integration) return { error: "Gmail no está configurado o habilitado." };
    const { sendGmail } = await import("@/lib/services/integrations");
    const result = await sendGmail(integration.credentials, args.to, args.subject, args.body);
    if (!result.success) return { error: `Error al enviar por Gmail: ${result.error}` };
    return { success: true, message: `Correo enviado por Gmail a ${args.to}` };
  }

  if (name === "send_messenger") {
    const storeId = store?._id || store?.id;
    if (!storeId) return { error: "No store selected" };
    const { Integration } = await import("@/lib/models/Integration");
    await connectDB();
    const integration = await Integration.findOne({ storeId, platform: "messenger", enabled: true });
    if (!integration) return { error: "Messenger no está configurado o habilitado." };
    const { sendMessenger } = await import("@/lib/services/integrations");
    const result = await sendMessenger(integration.credentials, args.recipientId, args.message);
    if (!result.success) return { error: `Error al enviar por Messenger: ${result.error}` };
    return { success: true, message: `Mensaje enviado por Messenger a ${args.recipientId}` };
  }

  return { error: `Unknown email tool: ${name}` };
}
