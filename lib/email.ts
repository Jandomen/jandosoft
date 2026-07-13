const SMTP_ENABLED = !!process.env.SMTP_USER;

export const DAILY_EMAIL_LIMIT = 400;

export function checkDailyLimitReached(sentToday: number): boolean {
  return sentToday >= DAILY_EMAIL_LIMIT;
}

export async function sendEmail({
  to, subject, html, attachments,
}: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  storeId?: string;
  attachments?: { filename: string; content: Buffer | Uint8Array }[];
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!SMTP_ENABLED) {
    console.warn(
      "[SMTP] SMTP_USER no configurado. Configura SMTP_HOST, SMTP_USER, SMTP_PASS en .env.local"
    );
    return { success: false, error: "SMTP no configurado" };
  }

  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.default.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailAttachments = attachments?.map((a) => ({
      filename: a.filename,
      content: a.content instanceof Buffer ? a.content : Buffer.from(a.content),
    }));

    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || "Jandosoft"}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      attachments: mailAttachments,
    });

    return { success: true, messageId: info.messageId };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.error("[SMTP] Error al enviar correo:", error);
    return { success: false, error: message };
  }
}
