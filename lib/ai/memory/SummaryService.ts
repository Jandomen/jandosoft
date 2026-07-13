import OpenAI from "openai";
import { AI_CONFIG } from "@/lib/ai/config";

const openai = new OpenAI({
  baseURL: AI_CONFIG.baseURL,
  apiKey: process.env.OPENROUTER_API_KEY,
});

function flattenMessages(messages: any[]): string {
  return messages
    .map((m) => {
      const role = m.role === "user" ? "Usuario" : "Asistente";
      const content = typeof m.content === "string" ? m.content : JSON.stringify(m.content);
      return `${role}: ${content}`;
    })
    .join("\n");
}

export async function summarizeConversation(
  messages: any[],
  existingSummary?: string
): Promise<string> {
  const conversationText = flattenMessages(messages);

  const existingContext = existingSummary
    ? `\n\nResumen anterior de la conversación:\n${existingSummary}`
    : "";

  const response = await openai.chat.completions.create({
    model: AI_CONFIG.fallbackModel,
    messages: [
      {
        role: "system",
        content: `Eres un sistema de resumen de conversaciones. Genera un resumen CONCISO (2-4 oraciones) que capture exclusivamente:

1. Temas principales discutidos.
2. Decisiones tomadas.
3. Preferencias del usuario (nombre, email, tipo de negocio, etc.).
4. Tareas pendientes o acciones requeridas.
5. Datos relevantes del negocio.

NO incluyas saludos, despedidas ni información trivial.
Responde ÚNICAMENTE el resumen, sin etiquetas ni prefijos.${existingContext}`,
      },
      {
        role: "user",
        content: `Resume la siguiente conversación:\n\n${conversationText}`,
      },
    ],
    max_tokens: 512,
    temperature: 0.3,
  });

  return response.choices[0]?.message?.content?.trim() || "";
}

export async function extractMemoryItems(
  messages: any[],
  currentMemory: { businessInfo: string; goals: string[]; preferences: string[] }
): Promise<{
  newBusinessInfo: string | null;
  newGoals: string[];
  newPreferences: string[];
  newImportantData: { key: string; value: string }[];
}> {
  const conversationText = flattenMessages(messages);

  const currentContext = currentMemory.businessInfo
    ? `\n\nMemoria actual del negocio:\n- Info: ${currentMemory.businessInfo}\n- Objetivos: ${currentMemory.goals.join(", ")}\n- Preferencias: ${currentMemory.preferences.join(", ")}`
    : "";

  const response = await openai.chat.completions.create({
    model: AI_CONFIG.fallbackModel,
    messages: [
      {
        role: "system",
        content: `Eres un sistema de extracción de información. Analiza la conversación y extrae NUEVA información importante que NO exista ya en la memoria actual.

Responde ÚNICAMENTE con un JSON válido sin markdown:
{
  "businessInfo": "nueva información del negocio descubierta (o null si no hay nada nuevo)",
  "goals": ["objetivo1", "objetivo2"],
  "preferences": ["preferencia1"],
  "importantData": [{"key": "dato", "value": "valor"}]
}

Si no hay información nueva, usa arrays vacíos y null.${currentContext}`,
      },
      {
        role: "user",
        content: `Analiza esta conversación y extrae información nueva:\n\n${conversationText}`,
      },
    ],
    max_tokens: 512,
    temperature: 0.2,
    response_format: { type: "json_object" },
  });

  const text = response.choices[0]?.message?.content || "{}";
  try {
    const parsed = JSON.parse(text);
    return {
      newBusinessInfo: parsed.businessInfo || null,
      newGoals: Array.isArray(parsed.goals) ? parsed.goals : [],
      newPreferences: Array.isArray(parsed.preferences) ? parsed.preferences : [],
      newImportantData: Array.isArray(parsed.importantData) ? parsed.importantData : [],
    };
  } catch {
    return { newBusinessInfo: null, newGoals: [], newPreferences: [], newImportantData: [] };
  }
}
