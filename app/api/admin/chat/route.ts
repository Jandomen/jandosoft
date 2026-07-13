import OpenAI from "openai";
import { AI_CONFIG, trimContextByTokens, shrinkContext, estimateCost, formatCost } from "@/lib/ai/config";
import { verifyAdminAuth } from "@/lib/admin-middleware";

const openai = new OpenAI({
  baseURL: AI_CONFIG.baseURL,
  apiKey: process.env.OPENROUTER_API_KEY,
});

const ADMIN_INSTRUCTION = `
Eres el Asistente de Administración de Jandosoft Enterprise. Tu rol es ayudar al administrador de la plataforma a gestionar todo el ecosistema.

RESPONDE SIEMPRE EN ESPAÑOL, con tono profesional y ejecutivo.

CAPACIDADES DISPONIBLES:
1. Crear comerciales/anuncios - cuando el admin te pida crear un comercial, DEBES responder con una estructura JSON ejecutable:
   { "action": { "type": "createCommercial", "params": { "title": "...", "imageUrl": "...", "linkUrl": "..." } }, "followUp": "Explicación de lo que se hizo" }
   
2. Suspender/activar empresas - cuando el admin te pida suspender una tienda:
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

async function createCompletion(model: string, messages: any[], maxTokens: number, temperature: number) {
  return await openai.chat.completions.create({
    model,
    messages,
    max_tokens: maxTokens,
    temperature,
  });
}

export async function POST(req: Request) {
  const authResult = await verifyAdminAuth(req);
  if ("error" in authResult) return authResult.error;

  const startTime = Date.now();
  try {
    const body = await req.json();
    const messages = body.messages || [];

    if (!messages.length) {
      return Response.json({ error: "No messages" }, { status: 400 });
    }

    const model = "deepseek/deepseek-chat";
    const maxTokens = AI_CONFIG.maxTokens;
    const temperature = AI_CONFIG.temperature;

    const finalMessages = trimContextByTokens([
      { role: "system", content: ADMIN_INSTRUCTION },
      ...messages,
    ]);

    let completion;
    try {
      completion = await createCompletion(model, finalMessages, maxTokens, temperature);
    } catch (err: any) {
      const isCreditError = err?.status === 402 || err?.code === "insufficient_quota" || err?.code === "insufficient_credits";
      const isTokenLimit = isCreditError && (
        err?.message?.includes("Prompt tokens limit exceeded") ||
        err?.error?.message?.includes("Prompt tokens limit exceeded")
      );

      if (isCreditError) {
        if (isTokenLimit) {
          console.warn("[OpenRouter] Prompt tokens limit — shrinking context and retrying");
          const shrunk = shrinkContext(finalMessages, 0.35);
          try {
            completion = await createCompletion(model, shrunk, 200, 0.7);
          } catch (retryErr: any) {
            console.error("[OpenRouter] Shrunk context also failed:", retryErr?.message || retryErr);
            return Response.json({ text: "El asistente AI está temporalmente indisponible. Intenta de nuevo más tarde." });
          }
        } else {
          console.warn("[OpenRouter] 402 / insufficient credits — retrying with max_tokens=256");
          try {
            completion = await createCompletion(model, finalMessages, 256, 0.7);
          } catch (retryErr: any) {
            console.error("[OpenRouter] Retry also failed:", retryErr?.message || retryErr);
            return Response.json({ text: "El asistente AI está temporalmente indisponible. Intenta de nuevo más tarde." });
          }
        }
      } else {
        throw err;
      }
    }

    const usage = completion.usage;
    const inputTokens = usage?.prompt_tokens || 0;
    const outputTokens = usage?.completion_tokens || 0;
    const duration = Date.now() - startTime;
    const cost = estimateCost(model, inputTokens, outputTokens);

    console.log(
      `[AdminChat] model=${model} max_tokens=${maxTokens} ` +
      `input=${inputTokens} output=${outputTokens} total=${inputTokens + outputTokens} ` +
      `cost=${formatCost(cost)} duration=${duration}ms`
    );

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
    return Response.json({ error: "Error al generar respuesta." }, { status: 500 });
  }
}
