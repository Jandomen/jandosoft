export const MAX_CONTEXT_TOKENS = 1800;
export const RECENT_MESSAGE_COUNT = 15;
export const SUMMARIZE_THRESHOLD = 20;

export function estimateTokens(text: string): number {
  return Math.ceil((text?.length || 0) / 4);
}

export function countContextTokens<T extends { role: string; content: string | any[] }>(
  messages: T[]
): number {
  let total = 0;
  for (const m of messages) {
    const content = typeof m.content === "string" ? m.content : JSON.stringify(m.content);
    total += estimateTokens(content) + 4;
  }
  return total;
}

export function trimContextByTokens<T extends { role: string; content: string | any[] }>(
  messages: T[],
  maxTokens: number = MAX_CONTEXT_TOKENS
): T[] {
  const system: T[] = [];
  const nonSystem: T[] = [];
  for (const m of messages) {
    if (m.role === "system") system.push(m);
    else nonSystem.push(m);
  }

  let total = countContextTokens(messages);

  while (total > maxTokens && nonSystem.length > 1) {
    const removed = nonSystem.shift()!;
    total -= estimateTokens(
      typeof removed.content === "string" ? removed.content : JSON.stringify(removed.content)
    ) + 4;
  }

  return [...system, ...nonSystem];
}

export function shrinkContext<T extends { role: string; content: string | any[] }>(
  messages: T[],
  factor: number = 0.5
): T[] {
  const halfMax = Math.max(200, Math.floor(MAX_CONTEXT_TOKENS * factor));
  return trimContextByTokens(messages, halfMax);
}
