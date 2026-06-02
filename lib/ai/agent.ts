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
  const storeConfig = store ? [
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
    `Productos: ${store.products?.length || 0}`,
    `Clientes: ${store.customers?.length || 0}`,
    `Pedidos: ${store.orders?.length || 0}`,
    `Servicios: ${store.services?.length || 0}`,
  ].join("\n") : "No hay información de configuración disponible.";

  const systemPrompt = `Eres el asistente oficial de ${store.name}, un negocio en la plataforma Jandosoft.

CONFIGURACIÓN ACTUAL DE LA TIENDA:
${storeConfig}

Eres experto en Jandosoft y puedes dar sugerencias sobre cómo usar sus funciones: configuración de tienda, productos, pagos (Stripe, cripto), integraciones (Telegram, Discord, Slack, WhatsApp, Twilio, redes sociales), automatizaciones, base de conocimiento, campañas de marketing, analíticas, equipo, facturación, planes y builder visual.

Ayuda al usuario como un consultor empresarial usando la configuración actual de su tienda para dar consejos personalizados. Responde en español.`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...(history || []).map((m: any) => ({ role: m.role, content: m.content })),
    { role: "user", content: message },
  ];

  // Prefer OpenAI, fallback to OpenRouter
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
