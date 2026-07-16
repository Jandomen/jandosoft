import type { ToolDefinition, ToolResult } from "./base";
import { GET_CURRENT_DATETIME_TOOL, executeGetCurrentDateTime } from "@/lib/ai/time";

export const TOOLS: ToolDefinition[] = [GET_CURRENT_DATETIME_TOOL as ToolDefinition];

export async function executeTimeTool(name: string, args: any, store: any, userId: string): Promise<ToolResult> {
  if (name === "getCurrentDateTime") {
    return executeGetCurrentDateTime(args, store);
  }
  return { error: `Unknown time tool: ${name}` };
}
