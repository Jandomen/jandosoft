const OPENAI_KEY = process.env.OPENAI_API_KEY;
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;

export async function askBusinessAI({
  message,
  store,
  history,
}: {
  message: string;
  store: any;
  history?: any[];
}): Promise<string> {
  const storeExists = store && store.name;

  const productsList = storeExists ? (store.products || []).map((p: any) =>
    `  - ${p.name} | $${p.price} | Stock: ${p.stock}`
  ).join("\n") : "";
  const customersList = storeExists ? (store.customers || []).map((c: any) =>
    `  - ${c.name} | ${c.email} | ${c.phone}`
  ).join("\n") : "";
  const ordersList = storeExists ? (store.orders || []).map((o: any) =>
    `  - ${o.product} | $${o.amount} | ${o.status}`
  ).join("\n") : "";
  const servicesList = storeExists ? (store.services || []).map((s: any) =>
    `  - ${s.name} | $${s.price} | ${s.desc}`
  ).join("\n") : "";

  const storeConfig = storeExists ? [
    `Nombre: ${store.name || "N/A"}`,
    `Tipo: ${store.type || "N/A"}`,
    `Industria: ${store.industry || "N/A"}`,
    `Descripción: ${store.desc || "Sin descripción"}`,
    `Slug: ${store.slug || "N/A"}`,
    `URL: ${store.slug ? "/s/" + store.slug : "N/A"}`,
    `Tienda pública: ${store.isPublic ? "Sí" : "No"}`,
    `IA pública: ${store.publicAI ? "Sí" : "No"}`,
    `Moneda: ${store.currency || "USD"}`,
    `Stripe: ${store.stripeAccountId ? "Conectado" : "No conectado"}`,
    ``,
    `PRODUCTOS (${store.products?.length || 0}):`,
    productsList || "  (ninguno)",
    ``,
    `CLIENTES (${store.customers?.length || 0}):`,
    customersList || "  (ninguno)",
    ``,
    `ÓRDENES (${store.orders?.length || 0}):`,
    ordersList || "  (ninguna)",
    ``,
    `SERVICIOS (${store.services?.length || 0}):`,
    servicesList || "  (ninguno)",
  ].join("\n") : "No hay información de configuración disponible.";

  const role = storeExists
    ? `Eres el asistente oficial de ${store.name}, un negocio en la plataforma Jandosoft.`
    : "Eres el asistente oficial de Jandosoft, una plataforma para crear y gestionar tiendas en línea.";

  const systemPrompt = `${role}

CONFIGURACIÓN ACTUAL DE LA TIENDA:
${storeConfig}

Eres experto en Jandosoft y puedes dar sugerencias sobre cómo usar sus funciones: configuración de tienda, productos, pagos (Stripe, cripto), integraciones (Telegram, Discord, Slack, WhatsApp, Twilio, redes sociales), automatizaciones, base de conocimiento, campañas de marketing, analíticas, equipo, facturación, planes y builder visual.

Ayuda al usuario como un consultor empresarial usando la configuración actual de su tienda para dar consejos personalizados. Responde en español.`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...(history || []).map((m: any) => ({ role: m.role, content: m.content })),
    { role: "user", content: message },
  ];

  if (OPENAI_KEY) {
    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey: OPENAI_KEY });
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
    });
    return response.choices[0].message.content || "";
  }

  if (OPENROUTER_KEY) {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_KEY}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages,
      }),
    });
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "Error al obtener respuesta de la IA.";
  }

  return "No hay clave de API configurada para el asistente IA. Contacta al administrador.";
}
