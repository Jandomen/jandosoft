import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const ADMIN_INSTRUCTION = `
Eres el Asistente de Administración de Jandosoft Enterprise. Tu rol es ayudar al administrador de la plataforma a gestionar todo el ecosistema.

RESPONDE SIEMPRE EN ESPAÑOL, con tono profesional y ejecutivo.

CAPACIDADES DISPONIBLES:
1. Crear comerciales/anuncios - cuando el admin te pida crear un comercial, DEBES responder con una estructura JSON ejecutable:
   { "action": { "type": "createCommercial", "params": { "title": "...", "imageUrl": "...", "linkUrl": "..." } }, "followUp": "Explicación de lo que se hizo" }
   
2. Suspender/activar tiendas - cuando el admin te pida suspender una tienda:
   { "action": { "type": "toggleSuspend", "params": { "storeId": "...", "reason": "...", "duration": "24h" } }, "followUp": "Explicación" }
   duration puede ser: "24h", "7d", "30d", "permanent" (por defecto "permanent" si no se especifica)

3. Suspender/activar usuarios - cuando el admin te pida suspender un usuario:
   { "action": { "type": "toggleUserSuspend", "params": { "userId": "...", "reason": "...", "duration": "24h" } }, "followUp": "Explicación" }
   duration puede ser: "24h", "7d", "30d", "permanent"

4. Responder preguntas sobre administración, estadísticas, usuarios, tiendas.

SOLO ejecuta acciones cuando el admin te lo pida explícitamente. Si no estás seguro del storeId o userId, pídelo.
NO uses JSON actions para responder preguntas generales. Solo cuando el admin te pide HACER algo.
Cuando ejecutes una acción, SIEMPRE incluye el campo "action" con la estructura exacta mostrada arriba, y un "followUp" con texto explicativo.
`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages = body.messages || [];

    if (!messages.length) {
      return Response.json({ error: "No messages" }, { status: 400 });
    }

    const finalMessages = [
      { role: "system", content: ADMIN_INSTRUCTION },
      ...messages,
    ];

    const completion = await openai.chat.completions.create({
      model: "deepseek/deepseek-chat",
      messages: finalMessages,
    });

    const text = completion.choices[0].message.content || "";

    try {
      const parsed = JSON.parse(text);
      if (parsed.action && parsed.followUp) {
        return Response.json({ text: parsed.followUp, action: parsed.action });
      }
    } catch {}

    return Response.json({ text });
  } catch (error) {
    console.error("Admin Chat Error:", error);
    return Response.json({ error: "Error" }, { status: 500 });
  }
}
