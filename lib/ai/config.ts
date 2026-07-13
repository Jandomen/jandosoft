export const AI_CONFIG = {
  baseURL: "https://openrouter.ai/api/v1",
  model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
  maxTokens: parseInt(process.env.OPENROUTER_MAX_TOKENS || "512", 10),
  temperature: parseFloat(process.env.OPENROUTER_TEMPERATURE || "0.7"),
  maxHistoryMessages: 5,
  fallbackModel: "openai/gpt-4o-mini",
  agentMaxTokens: 512,
  quickMaxTokens: 256,
  maxContextTokens: 1800,
  summarizationThreshold: 12,
  maxListItems: 10,
};

const PRICING: Record<string, { input: number; output: number }> = {
  "openai/gpt-4o-mini": { input: 0.00015, output: 0.0006 },
  "gpt-4o-mini": { input: 0.00015, output: 0.0006 },
  "openai/gpt-4o": { input: 0.0025, output: 0.01 },
  "gpt-4o": { input: 0.0025, output: 0.01 },
  "gpt-3.5-turbo": { input: 0.0005, output: 0.0015 },
  "deepseek/deepseek-chat": { input: 0.00027, output: 0.0011 },
  "claude-3-haiku": { input: 0.00025, output: 0.00125 },
  "claude-3-sonnet": { input: 0.003, output: 0.015 },
};

export function estimateCost(model: string, inputTokens: number, outputTokens: number): number {
  const rate = PRICING[model] || PRICING["openai/gpt-4o-mini"];
  return (inputTokens / 1000) * rate.input + (outputTokens / 1000) * rate.output;
}

export function formatCost(cost: number): string {
  if (cost < 0.001) return `$${cost.toFixed(6)}`;
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  return `$${cost.toFixed(4)}`;
}

export function logMetrics(model: string, maxTokens: number, inputTokens: number, outputTokens: number, durationMs: number) {
  const cost = estimateCost(model, inputTokens, outputTokens);
  console.log(
    `[AI Metrics] model=${model} max_tokens=${maxTokens} ` +
    `input=${inputTokens} output=${outputTokens} total=${inputTokens + outputTokens} ` +
    `cost=${formatCost(cost)} duration=${durationMs}ms`
  );
}

export function estimateTokens(text: string): number {
  return Math.ceil((text?.length || 0) / 4);
}

export function trimContextByTokens<T extends { role: string; content: string | any[] }>(
  messages: T[],
  maxTokens: number = AI_CONFIG.maxContextTokens
): T[] {
  const system: T[] = [];
  const nonSystem: T[] = [];
  for (const m of messages) {
    if (m.role === "system") system.push(m);
    else nonSystem.push(m);
  }

  const contentOf = (m: T): string =>
    typeof m.content === "string" ? m.content : JSON.stringify(m.content);

  let total = 0;
  for (const m of messages) {
    total += estimateTokens(contentOf(m)) + 4;
  }

  while (total > maxTokens && nonSystem.length > 1) {
    const removed = nonSystem.shift()!;
    total -= estimateTokens(contentOf(removed)) + 4;
  }

  return [...system, ...nonSystem];
}

export function shrinkContext<T extends { role: string; content: string | any[] }>(
  messages: T[],
  factor: number = 0.5
): T[] {
  const halfMax = Math.max(200, Math.floor(AI_CONFIG.maxContextTokens * factor));
  return trimContextByTokens(messages, halfMax);
}

export function trimHistory(messages: any[]): any[] {
  const seen = new Set<string>();
  const unique: any[] = [];

  for (const m of messages) {
    const key = `${m.role}:${m.content}`;
    if (m.role === "system") {
      unique.push(m);
      continue;
    }
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(m);
    }
  }

  const systemMessages = unique.filter((m) => m.role === "system");
  const nonSystem = unique.filter((m) => m.role !== "system");
  const trimmed = nonSystem.slice(-AI_CONFIG.maxHistoryMessages);

  return trimContextByTokens([...systemMessages, ...trimmed]);
}
