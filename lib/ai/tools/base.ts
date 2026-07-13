export interface ToolDefinition {
  type: string;
  function: {
    name: string;
    description: string;
    parameters: {
      type: string;
      properties: Record<string, any>;
      required?: string[];
    };
  };
}

export interface ToolResult {
  success?: boolean;
  error?: string;
  message?: string;
  [key: string]: any;
}

export interface DomainModule {
  domain: string;
  keywords: string[];
  tools: ToolDefinition[];
  execute(name: string, args: any, store: any, userId: string): Promise<ToolResult>;
}

export function withTimeout<T>(promise: Promise<T>, ms: number, toolName: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Tool "${toolName}" timed out after ${ms}ms`)), ms)
    ),
  ]);
}
