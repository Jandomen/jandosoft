export { pluginRegistry } from "./registry/plugin-registry";
export { executeWorkflow, executeWorkflowsForEvent, initWorkflowEngine } from "./core/engine";
export { createTriggerEvent, getScheduledWorkflowEntries } from "./core/scheduler";
export { ALL_TRIGGERS } from "./triggers/all-triggers";
export { ALL_CONDITIONS } from "./conditions/all-conditions";
export { ALL_ACTIONS } from "./actions/all-actions";

export type {
  IWorkflow,
  WorkflowTrigger,
  WorkflowStep,
  WorkflowCondition,
  WorkflowAction,
  TriggerEvent,
  ExecutionContext,
  ExecutionResult,
  TriggerId,
  ActionId,
  ConditionType,
  ComparisonOp,
} from "./core/types";

export type {
  TriggerPlugin,
  ConditionPlugin,
  ActionPlugin,
  PluginDefinition,
} from "./core/plugin-interfaces";
