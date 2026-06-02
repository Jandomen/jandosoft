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
  const systemPrompt = `Eres el asistente oficial de ${store.name}.

Industria: ${store.industry}

Descripción: ${store.desc}

Ayuda al usuario como un consultor empresarial. Responde en español.`;

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
