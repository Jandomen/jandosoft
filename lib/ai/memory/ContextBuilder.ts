import { trimContextByTokens, countContextTokens, MAX_CONTEXT_TOKENS } from "./TokenCounter";

export interface BuildContextParams {
  systemPrompt: string;
  globalMemory?: {
    businessInfo?: string;
    goals?: string[];
    preferences?: string[];
    importantData?: { key: string; value: string }[];
  } | null;
  summary?: string | null;
  recentMessages: { role: string; content: string | any[] }[];
  ragResults?: string;
}

export function buildContext(params: BuildContextParams): { role: string; content: string | any[] }[] {
  const { systemPrompt, globalMemory, summary, recentMessages, ragResults } = params;

  const messages: { role: string; content: string | any[] }[] = [];

  messages.push({ role: "system", content: systemPrompt });

  if (globalMemory) {
    const memoryParts: string[] = ["[MEMORIA GLOBAL DEL NEGOCIO]"];
    if (globalMemory.businessInfo) {
      memoryParts.push(`Información: ${globalMemory.businessInfo}`);
    }
    if (globalMemory.goals?.length) {
      memoryParts.push(`Objetivos: ${globalMemory.goals.join(", ")}`);
    }
    if (globalMemory.preferences?.length) {
      memoryParts.push(`Preferencias: ${globalMemory.preferences.join(", ")}`);
    }
    if (globalMemory.importantData?.length) {
      memoryParts.push(
        "Datos importantes:",
        ...globalMemory.importantData.map((d) => `  - ${d.key}: ${d.value}`)
      );
    }
    if (memoryParts.length > 1) {
      messages.push({ role: "system", content: memoryParts.join("\n") });
    }
  }

  if (summary) {
    messages.push({
      role: "system",
      content: `[RESUMEN DE CONVERSACIÓN ANTERIOR]: ${summary}`,
    });
  }

  if (ragResults) {
    messages.push({
      role: "system",
      content: `[INFORMACIÓN DE LA BASE DE CONOCIMIENTO]:\n${ragResults}`,
    });
  }

  for (const msg of recentMessages) {
    messages.push({ role: msg.role, content: msg.content });
  }

  const trimmed = trimContextByTokens(messages);

  const totalTokens = countContextTokens(trimmed);
  if (totalTokens > MAX_CONTEXT_TOKENS * 0.8) {
    console.warn(`[ContextBuilder] Context near limit: ~${totalTokens} estimated tokens`);
  }

  return trimmed;
}
