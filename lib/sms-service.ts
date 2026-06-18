import twilio from "twilio";

const TWILIO_ENABLED = !!process.env.TWILIO_ACCOUNT_SID && !!process.env.TWILIO_AUTH_TOKEN;

export const DAILY_SMS_LIMIT = 100;

export function checkDailySMSLimitReached(sentToday: number): boolean {
  return sentToday >= DAILY_SMS_LIMIT;
}

export async function sendSMS({
  to,
  body,
}: {
  to: string;
  body: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!TWILIO_ENABLED) {
    console.warn("[SMS] Twilio no configurado. Configura TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER en .env");
    return { success: false, error: "Twilio no configurado" };
  }

  try {
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    );

    const message = await client.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER!,
      to,
      body,
    });

    return { success: true, messageId: message.sid };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.error("[SMS] Error al enviar:", error);
    return { success: false, error: message };
  }
}
