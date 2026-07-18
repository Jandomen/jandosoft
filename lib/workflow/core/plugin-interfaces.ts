/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TriggerId, ActionId, ConditionType, WorkflowTrigger, WorkflowCondition, WorkflowAction, TriggerEvent, ExecutionContext } from "./types";

export interface TriggerPlugin {
  id: TriggerId;
  name: string;
  description: string;
  configSchema: Record<string, any>;
  icon?: string;
  /** Evaluate if the event should trigger this workflow */
  evaluate?(event: TriggerEvent, triggerConfig: Record<string, any>): boolean;
  /** For scheduled triggers: return cron expression */
  getCronExpression?(config: Record<string, any>): string | null;
}

export interface ConditionPlugin {
  type: ConditionType;
  name: string;
  description: string;
  configSchema: Record<string, any>;
  icon?: string;
  evaluate(condition: WorkflowCondition, context: ExecutionContext): boolean;
}

export interface ActionPlugin {
  id: ActionId;
  name: string;
  description: string;
  configSchema: Record<string, any>;
  icon?: string;
  requiredFields: string[];
  execute(action: WorkflowAction, context: ExecutionContext): Promise<{ success: boolean; result?: any; error?: string }>;
}

export interface PluginDefinition {
  triggers: TriggerPlugin[];
  conditions: ConditionPlugin[];
  actions: ActionPlugin[];
}
