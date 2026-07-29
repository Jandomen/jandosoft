import { estimateTokens } from "@/lib/ai/config";

export { estimateTokens, trimContextByTokens, shrinkContext } from "@/lib/ai/config";

export const MAX_CONTEXT_TOKENS = 10000;
export const RECENT_MESSAGE_COUNT = 30;
export const SUMMARIZE_THRESHOLD = 40;

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
