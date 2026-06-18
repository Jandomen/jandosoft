import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { withAuth } from "@/lib/api-middleware";
import { connectDB } from "@/lib/mongodb";
import { EmailLog } from "@/lib/models/EmailLog";
import { checkRateLimit } from "@/lib/rate-limiter";

export const POST = withAuth(async (req: NextRequest, auth, body) => {
  const { to } = body;
  if (!to) {
    return NextResponse.json({ error: "Correo destinatario requerido" }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const rateCheck = checkRateLimit(`test-email:${ip}`, 3, 60_000);
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: `Demasiadas pruebas. Espera ${Math.ceil(rateCheck.resetIn / 1000)}s.` }, { status: 429 });
  }

  const testHtml = `
    <div style="font-family:'Inter',sans-serif;max-width:560px;margin:0 auto;padding:40px 24px;background:#0a0a0a;">
      <div style="background:#111;border-radius:24px;border:1px solid #222;padding:36px;text-align:center;">
        <div style="background:#ef4444;width:48px;height:48px;border-radius:14px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
          <span style="color:#fff;font-size:24px;font-weight:900;font-style:italic;">J</span>
        </div>
        <h2 style="font-size:18px;font-weight:900;font-style:italic;color:#fff;margin:0 0 8px;">Correo de Prueba</h2>
        <div style="width:40px;height:3px;background:#ef4444;border-radius:2px;margin:0 auto 16px;"></div>
        <p style="font-size:14px;color:#ccc;line-height:1.7;">Este es un correo de prueba desde Jandosoft.</p>
        <p style="font-size:14px;color:#ccc;line-height:1.7;">Si estás recibiendo esto, la configuración de correo funciona correctamente.</p>
        <p style="font-size:11px;color:#666;margin-top:20px;">Enviado desde: ${auth.email} · Organización: ${auth.organizationId}</p>
      </div>
    </div>
  `;

  const result = await sendEmail({
    to,
    subject: "Correo de Prueba — Jandosoft",
    html: testHtml,
  });

  await connectDB();
  await EmailLog.create({
    to,
    subject: "Correo de Prueba — Jandosoft",
    messageId: result.messageId,
    status: result.success ? "sent" : "failed",
    organizationId: auth.organizationId,
    template: "test",
    error: result.error,
  });

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true, messageId: result.messageId });
});
