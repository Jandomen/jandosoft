import { DOMAIN_TOOLS, getToolsForDomains, type Domain } from "./domains";
import { withToolTimeout } from "../errors";
import { ToolDefinition, ToolResult } from "./base";
import { metrics } from "../metrics";

export type { Domain } from "./domains";
export { DOMAIN_TOOLS, getToolsForDomains, getDomainForTool } from "./domains";
export { type ToolDefinition, type ToolResult } from "./base";

const TOOL_EXECUTORS = new Map<string, (args: any, store: any, userId: string) => Promise<ToolResult>>();

export function registerToolExecutor(
  name: string,
  executor: (args: any, store: any, userId: string) => Promise<ToolResult>
): void {
  TOOL_EXECUTORS.set(name, executor);
}

export async function executeRegisteredTool(
  toolCall: any,
  store: any,
  userId: string
): Promise<ToolResult> {
  const { name, arguments: rawArgs } = toolCall.function;
  const args = JSON.parse(rawArgs);
  const executor = TOOL_EXECUTORS.get(name);

  if (!executor) {
    return { error: `Unknown tool: ${name}` };
  }

  const startTime = Date.now();
  try {
    const result = await withToolTimeout(
      executor(args, store, userId),
      name,
      30000
    );
    metrics.recordToolDuration(name, startTime);
    return result;
  } catch (error: any) {
    const message = error?.message || String(error);
    metrics.recordError("tool_execution", name);
    return { error: `Error ejecutando ${name}: ${message}` };
  }
}

export function filterToolsByDomain(
  allTools: ToolDefinition[],
  domains: Domain[]
): ToolDefinition[] {
  const allowedNames = new Set(getToolsForDomains(domains));
  return allTools.filter((t) => allowedNames.has(t.function.name));
}

export function filterToolsForCustomer(
  allTools: ToolDefinition[],
  customerToolNames: Set<string>
): ToolDefinition[] {
  return allTools.filter((t) => customerToolNames.has(t.function.name));
}
