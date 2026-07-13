const BASE_URL = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

const BRAND = `
  <div style="text-align:center;margin-bottom:28px;">
    <h1 style="font-family:'Arial Black',Impact,'Helvetica Neue',Arial,sans-serif;font-size:26px;font-weight:900;letter-spacing:6px;text-transform:uppercase;color:#ef4444;margin:0 0 2px;">JANDOSOFT</h1>
    <p style="font-family:'Arial Black',Impact,'Helvetica Neue',Arial,sans-serif;font-size:9px;font-weight:700;color:#666;letter-spacing:4px;text-transform:uppercase;margin:0;">Cloud Business Suite</p>
  </div>
`;

const FOOTER = `
  <div style="margin-top:36px;padding-top:24px;border-top:1px solid #2a2a2a;text-align:center;font-size:11px;color:#666;">
    <p style="margin:0 0 4px;">Jandosoft &copy; ${new Date().getFullYear()} — Todos los derechos reservados</p>
    <p style="margin:0;">Si no solicitaste este correo, ignóralo.</p>
    <p style="margin:8px 0 0;font-size:9px;color:#555;">
      <a href="${BASE_URL}" style="color:#ef4444;text-decoration:none;font-weight:700;">jandosoft.com</a>
    </p>
  </div>
`;

function wrap(title: string, body: string): string {
  return `
    <div style="font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;padding:40px 24px;background:#0a0a0a;">
      ${BRAND}
      <div style="background:#111;border-radius:24px;border:1px solid #222;padding:36px;box-shadow:0 8px 32px rgba(0,0,0,0.3);">
        <h2 style="font-size:20px;font-weight:900;font-style:italic;color:#fff;margin:0 0 12px;">${title}</h2>
        <div style="width:40px;height:3px;background:#ef4444;border-radius:2px;margin-bottom:20px;"></div>
        ${body}
      </div>
      ${FOOTER}
    </div>
  `;
}

export function wrapRaw(title: string, body: string): string {
  return wrap(title, body);
}

export function welcomeEmailHtml(userName: string): string {
  return wrap(
    "¡Bienvenido a Jandosoft!",
    `
      <p style="font-size:14px;color:#ccc;line-height:1.7;margin:0 0 16px;">Hola <strong style="color:#fff;">${userName}</strong>,</p>
      <p style="font-size:14px;color:#ccc;line-height:1.7;margin:0 0 16px;">Tu cuenta ha sido creada exitosamente. Ya puedes empezar a gestionar tu negocio con todas las herramientas que Jandosoft pone a tu disposición.</p>
      <div style="text-align:center;margin:28px 0;">
        <a href="${BASE_URL}/" style="display:inline-block;padding:14px 36px;background:#ef4444;color:#fff;border-radius:14px;font-weight:900;font-size:14px;text-decoration:none;font-style:italic;letter-spacing:0.5px;">IR A MI DASHBOARD</a>
      </div>
    `
  );
}

export function passwordResetEmailHtml(token: string): string {
  const link = `${BASE_URL}/reset-password?token=${token}`;
  return wrap(
    "Restablece tu contraseña",
    `
      <p style="font-size:14px;color:#ccc;line-height:1.7;margin:0 0 16px;">Recibimos una solicitud para restablecer la contraseña de tu cuenta de Jandosoft.</p>
      <p style="font-size:14px;color:#ccc;line-height:1.7;margin:0 0 16px;">Haz clic en el botón de abajo para crear una nueva contraseña:</p>
      <div style="text-align:center;margin:28px 0;">
        <a href="${link}" style="display:inline-block;padding:14px 36px;background:#ef4444;color:#fff;border-radius:14px;font-weight:900;font-size:14px;text-decoration:none;font-style:italic;letter-spacing:0.5px;">RESTABLECER CONTRASEÑA</a>
      </div>
      <p style="font-size:12px;color:#888;line-height:1.5;margin:16px 0;">O copia este enlace en tu navegador:</p>
      <p style="font-size:11px;color:#666;word-break:break-all;background:#1a1a1a;padding:12px;border-radius:12px;font-family:monospace;">${link}</p>
      <p style="font-size:12px;color:#888;line-height:1.5;margin:16px 0;">Este enlace expira en 1 hora. Si no solicitaste este cambio, ignora este mensaje.</p>
    `
  );
}

export function verificationEmailHtml(token: string, userName: string): string {
  const link = `${BASE_URL}/verify-email?token=${token}`;
  return wrap(
    "Verifica tu correo electrónico",
    `
      <p style="font-size:14px;color:#ccc;line-height:1.7;margin:0 0 16px;">Hola <strong style="color:#fff;">${userName}</strong>,</p>
      <p style="font-size:14px;color:#ccc;line-height:1.7;margin:0 0 16px;">Gracias por registrarte en Jandosoft. Para empezar a usar todas las funciones, confirma tu dirección de correo electrónico haciendo clic en el botón de abajo:</p>
      <div style="text-align:center;margin:28px 0;">
        <a href="${link}" style="display:inline-block;padding:14px 36px;background:#ef4444;color:#fff;border-radius:14px;font-weight:900;font-size:14px;text-decoration:none;font-style:italic;letter-spacing:0.5px;">VERIFICAR CORREO</a>
      </div>
      <p style="font-size:12px;color:#888;line-height:1.5;margin:16px 0;">O copia este enlace en tu navegador:</p>
      <p style="font-size:11px;color:#666;word-break:break-all;background:#1a1a1a;padding:12px;border-radius:12px;font-family:monospace;">${link}</p>
      <p style="font-size:12px;color:#888;line-height:1.5;margin:16px 0;">Este enlace expira en 24 horas.</p>
    `
  );
}

export function invoiceEmailHtml(params: {
  invoiceNumber: string;
  userName: string;
  amount: number;
  currency: string;
  items: string[];
  date: string;
}): string {
  const itemsList = params.items.map((item) =>
    `<tr><td style="padding:8px 0;border-bottom:1px solid #222;color:#ccc;font-size:13px;">${item}</td></tr>`
  ).join("");

  return wrap(
    `Factura #${params.invoiceNumber}`,
    `
      <p style="font-size:14px;color:#ccc;line-height:1.7;margin:0 0 16px;">Hola <strong style="color:#fff;">${params.userName}</strong>,</p>
      <p style="font-size:14px;color:#ccc;line-height:1.7;margin:0 0 16px;">Adjuntamos los detalles de tu factura:</p>
      <div style="background:#1a1a1a;border-radius:16px;padding:20px;margin:20px 0;">
        <p style="font-size:11px;color:#888;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">Factura #${params.invoiceNumber}</p>
        <p style="font-size:11px;color:#888;margin:0 0 16px;">${params.date}</p>
        <table style="width:100%;border-collapse:collapse;">
          ${itemsList}
        </table>
        <div style="margin-top:16px;padding-top:16px;border-top:1px solid #222;display:flex;justify-content:space-between;">
          <span style="font-size:14px;color:#fff;font-weight:900;">Total</span>
          <span style="font-size:16px;color:#ef4444;font-weight:900;">${params.currency === "MXN" ? "$" : "$"}${params.amount.toFixed(2)} ${params.currency}</span>
        </div>
      </div>
    `
  );
}

export function appointmentReminderEmailHtml(params: {
  customerName: string;
  serviceName: string;
  date: string;
  time: string;
  notes?: string;
}): string {
  return wrap(
    "Recordatorio de Cita",
    `
      <p style="font-size:14px;color:#ccc;line-height:1.7;margin:0 0 16px;">Hola <strong style="color:#fff;">${params.customerName}</strong>,</p>
      <p style="font-size:14px;color:#ccc;line-height:1.7;margin:0 0 16px;">Este es un recordatorio de tu próxima cita:</p>
      <div style="background:#1a1a1a;border-radius:16px;padding:20px;margin:20px 0;">
        <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
          <span style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;">Servicio</span>
          <span style="font-size:13px;color:#fff;font-weight:700;">${params.serviceName}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
          <span style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;">Fecha</span>
          <span style="font-size:13px;color:#fff;font-weight:700;">${params.date}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
          <span style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;">Hora</span>
          <span style="font-size:13px;color:#fff;font-weight:700;">${params.time}</span>
        </div>
        ${params.notes ? `
        <div style="display:flex;justify-content:space-between;">
          <span style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;">Notas</span>
          <span style="font-size:13px;color:#ccc;">${params.notes}</span>
        </div>
        ` : ""}
      </div>
      <p style="font-size:13px;color:#888;line-height:1.5;margin:16px 0;">Si necesitas reprogramar o cancelar, por favor contáctanos con anticipación.</p>
    `
  );
}

export function paymentConfirmationEmailHtml(params: {
  customerName: string;
  amount: number;
  currency: string;
  description: string;
  date: string;
  storeName: string;
}): string {
  return wrap(
    "Pago Confirmado",
    `
      <p style="font-size:14px;color:#ccc;line-height:1.7;margin:0 0 16px;">Hola <strong style="color:#fff;">${params.customerName}</strong>,</p>
      <p style="font-size:14px;color:#ccc;line-height:1.7;margin:0 0 16px;">Hemos recibido tu pago correctamente. Aquí están los detalles:</p>
      <div style="background:#1a1a1a;border-radius:16px;padding:20px;margin:20px 0;">
        <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
          <span style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;">Empresa</span>
          <span style="font-size:13px;color:#fff;font-weight:700;">${params.storeName}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
          <span style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;">Concepto</span>
          <span style="font-size:13px;color:#fff;font-weight:700;">${params.description}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
          <span style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;">Fecha</span>
          <span style="font-size:13px;color:#fff;font-weight:700;">${params.date}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding-top:16px;border-top:1px solid #222;">
          <span style="font-size:14px;color:#fff;font-weight:900;">Total pagado</span>
          <span style="font-size:18px;color:#ef4444;font-weight:900;">${params.currency === "MXN" ? "$" : "$"}${params.amount.toFixed(2)} ${params.currency}</span>
        </div>
      </div>
      <p style="font-size:13px;color:#888;line-height:1.5;margin:16px 0;">Gracias por tu preferencia. Si tienes alguna duda, no dudes en contactarnos.</p>
    `
  );
}

export function orderConfirmationEmailHtml(params: {
  customerName: string;
  orderId: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  currency: string;
  storeName: string;
}): string {
  const itemsList = params.items.map((item) =>
    `<tr>
      <td style="padding:8px 0;border-bottom:1px solid #222;color:#ccc;font-size:13px;">${item.name} x${item.quantity}</td>
      <td style="padding:8px 0;border-bottom:1px solid #222;color:#ccc;font-size:13px;text-align:right;">${params.currency === "MXN" ? "$" : "$"}${(item.price * item.quantity).toFixed(2)}</td>
    </tr>`
  ).join("");

  return wrap(
    "Pedido Confirmado",
    `
      <p style="font-size:14px;color:#ccc;line-height:1.7;margin:0 0 16px;">Hola <strong style="color:#fff;">${params.customerName}</strong>,</p>
      <p style="font-size:14px;color:#ccc;line-height:1.7;margin:0 0 16px;">Tu pedido ha sido confirmado. Aquí están los detalles:</p>
      <div style="background:#1a1a1a;border-radius:16px;padding:20px;margin:20px 0;">
        <p style="font-size:11px;color:#888;margin:0 0 4px;text-transform:uppercase;letter-spacing:1px;">${params.storeName}</p>
        <p style="font-size:10px;color:#666;margin:0 0 16px;">Pedido #${params.orderId}</p>
        <table style="width:100%;border-collapse:collapse;">
          ${itemsList}
        </table>
        <div style="margin-top:16px;padding-top:16px;border-top:1px solid #222;display:flex;justify-content:space-between;">
          <span style="font-size:14px;color:#fff;font-weight:900;">Total</span>
          <span style="font-size:16px;color:#ef4444;font-weight:900;">${params.currency === "MXN" ? "$" : "$"}${params.total.toFixed(2)} ${params.currency}</span>
        </div>
      </div>
    `
  );
}

export function newClientNotificationEmailHtml(params: {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  storeName: string;
}): string {
  return wrap(
    "Nuevo Cliente Registrado",
    `
      <p style="font-size:14px;color:#ccc;line-height:1.7;margin:0 0 16px;">Se ha registrado un nuevo cliente en tu empresa <strong style="color:#fff;">${params.storeName}</strong>:</p>
      <div style="background:#1a1a1a;border-radius:16px;padding:20px;margin:20px 0;">
        <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
          <span style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;">Nombre</span>
          <span style="font-size:13px;color:#fff;font-weight:700;">${params.clientName}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
          <span style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;">Email</span>
          <span style="font-size:13px;color:#fff;font-weight:700;">${params.clientEmail}</span>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;">Teléfono</span>
          <span style="font-size:13px;color:#fff;font-weight:700;">${params.clientPhone || "No proporcionado"}</span>
        </div>
      </div>
    `
  );
}

export function paymentReceivedNotificationEmailHtml(params: {
  storeName: string;
  customerName: string;
  amount: number;
  currency: string;
  date: string;
}): string {
  return wrap(
    "Pago Recibido",
    `
      <p style="font-size:14px;color:#ccc;line-height:1.7;margin:0 0 16px;">Has recibido un nuevo pago en tu empresa <strong style="color:#fff;">${params.storeName}</strong>:</p>
      <div style="background:#1a1a1a;border-radius:16px;padding:20px;margin:20px 0;">
        <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
          <span style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;">Cliente</span>
          <span style="font-size:13px;color:#fff;font-weight:700;">${params.customerName}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
          <span style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;">Fecha</span>
          <span style="font-size:13px;color:#fff;font-weight:700;">${params.date}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding-top:16px;border-top:1px solid #222;">
          <span style="font-size:14px;color:#fff;font-weight:900;">Monto recibido</span>
          <span style="font-size:18px;color:#ef4444;font-weight:900;">${params.currency === "MXN" ? "$" : "$"}${params.amount.toFixed(2)} ${params.currency}</span>
        </div>
      </div>
    `
  );
}

export function campaignEmailHtml(params: {
  content: string;
  storeName: string;
}): string {
  return wrap(
    params.storeName,
    `
      <div style="font-size:14px;color:#ccc;line-height:1.7;">
        ${params.content}
      </div>
    `
  );
}
