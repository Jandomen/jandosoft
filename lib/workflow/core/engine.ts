/* eslint-disable @typescript-eslint/no-explicit-any */
import { pluginRegistry } from "../registry/plugin-registry";
import type { IWorkflow, TriggerEvent, ExecutionContext, ExecutionResult } from "./types";

/**
 * Evaluates all conditions in a step. Returns true only if ALL conditions are met.
 */
function evaluateStepConditions(context: ExecutionContext): boolean {
  const step = context.workflow.steps[context.stepIndex];
  if (!step || step.conditions.length === 0) return true;

  return step.conditions.every((condition) => {
    const plugin = pluginRegistry.getCondition(condition.type);
    if (!plugin) return false;
    return plugin.evaluate(condition, context);
  });
}

/**
 * Executes all actions in a step sequentially.
 */
async function executeStepActions(context: ExecutionContext): Promise<{ success: boolean; error?: string }[]> {
  const step = context.workflow.steps[context.stepIndex];
  if (!step) return [];

  const results: { success: boolean; error?: string }[] = [];

  for (let i = 0; i < step.actions.length; i++) {
    const action = step.actions[i];
    context.actionIndex = i;

    try {
      const result = await pluginRegistry.executeAction(action, context);
      results.push({
        success: result.success,
        error: result.error,
      });
      if (!result.success) {
        console.error(`[Workflow] Action ${action.type} failed: ${result.error}`);
      }
    } catch (error: any) {
      results.push({ success: false, error: error.message });
      console.error(`[Workflow] Action ${action.type} threw: ${error.message}`);
    }
  }

  return results;
}

/**
 * Main workflow execution function.
 * 1. Check if the trigger matches
 * 2. For each step, evaluate conditions then execute actions
 * 3. Return full execution result
 */
export async function executeWorkflow(
  workflow: IWorkflow,
  event: TriggerEvent,
  store: any
): Promise<ExecutionResult> {
  const startedAt = new Date();

  if (!workflow.enabled) {
    return {
      workflowId: workflow.id,
      workflowName: workflow.name,
      success: false,
      startedAt,
      finishedAt: new Date(),
      steps: [],
      error: "Workflow is disabled",
    };
  }

  // 1. Evaluate trigger against event
  const triggerMatches = pluginRegistry.evaluateTrigger(event, workflow.trigger);
  if (!triggerMatches) {
    return {
      workflowId: workflow.id,
      workflowName: workflow.name,
      success: false,
      startedAt,
      finishedAt: new Date(),
      steps: [],
      error: "Trigger did not match event",
    };
  }

  // 2. Create execution context
  const context: ExecutionContext = {
    workflow,
    event,
    store,
    vars: { ...event.payload },
    stepIndex: 0,
    actionIndex: 0,
  };

  const stepResults: ExecutionResult["steps"] = [];

  // 3. Execute each step
  for (let si = 0; si < workflow.steps.length; si++) {
    context.stepIndex = si;
    const step = workflow.steps[si];

    const conditionsMet = evaluateStepConditions(context);
    if (!conditionsMet) {
      stepResults.push({
        stepId: step.id,
        conditionsMet: false,
        actions: [],
      });
      continue;
    }

    const actionResults = await executeStepActions(context);

    stepResults.push({
      stepId: step.id,
      conditionsMet: true,
      actions: actionResults.map((r, ai) => ({
        actionId: step.actions[ai]?.id || `action_${ai}`,
        success: r.success,
        error: r.error,
      })),
    });

    // If any action failed, we still continue to next step (configurable)
  }

  const finishedAt = new Date();

  return {
    workflowId: workflow.id,
    workflowName: workflow.name,
    success: true,
    startedAt,
    finishedAt,
    steps: stepResults,
  };
}

/**
 * Finds all enabled workflows for a store matching the trigger, and executes them.
 */
export async function executeWorkflowsForEvent(
  event: TriggerEvent,
  store: any
): Promise<ExecutionResult[]> {
  const workflows: IWorkflow[] = store.workflows || [];
  const triggered = workflows.filter(
    (w) => w.enabled && w.trigger.type === event.trigger
  );

  const results: ExecutionResult[] = [];
  for (const wf of triggered) {
    try {
      const result = await executeWorkflow(wf, event, store);

      // Update workflow metadata
      wf.runCount = (wf.runCount || 0) + 1;
      wf.lastRunAt = new Date().toISOString();
      wf.updatedAt = new Date().toISOString();
      await store.save();

      results.push(result);
    } catch (error: any) {
      results.push({
        workflowId: wf.id,
        workflowName: wf.name,
        success: false,
        startedAt: new Date(),
        finishedAt: new Date(),
        steps: [],
        error: error.message,
      });
    }
  }

  return results;
}

/**
 * Registers global reference for condition plugins that need the registry
 */
export function initWorkflowEngine(): void {
  (globalThis as any).__workflowRegistry = pluginRegistry;
}
