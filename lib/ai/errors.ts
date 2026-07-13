import { metrics } from "./metrics";

const TOOL_TIMEOUT_MS = 30000;

export class ToolTimeoutError extends Error {
  constructor(toolName: string, ms: number) {
    super(`Tool "${toolName}" timed out after ${ms}ms`);
    this.name = "ToolTimeoutError";
  }
}

export class ToolExecutionError extends Error {
  constructor(toolName: string, message: string) {
    super(`Tool "${toolName}" failed: ${message}`);
    this.name = "ToolExecutionError";
  }
}

export async function withToolTimeout<T>(
  promise: Promise<T>,
  toolName: string,
  timeoutMs: number = TOOL_TIMEOUT_MS
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const result = await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        controller.signal.addEventListener("abort", () => {
          reject(new ToolTimeoutError(toolName, timeoutMs));
        });
      }),
    ]);
    clearTimeout(timeoutId);
    metrics.recordToolDuration(toolName, Date.now());
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof ToolTimeoutError) {
      metrics.recordError("timeout", toolName);
    } else {
      metrics.recordError("execution", toolName);
    }
    throw error;
  }
}

export function safeStringify(obj: any, fallback = "{}"): string {
  try {
    return JSON.stringify(obj);
  } catch {
    return fallback;
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}
