/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TriggerPlugin, ConditionPlugin, ActionPlugin, PluginDefinition } from "../core/plugin-interfaces";
import type { TriggerId, ActionId, ConditionType, WorkflowCondition, WorkflowAction, WorkflowTrigger, TriggerEvent, ExecutionContext } from "../core/types";

class PluginRegistryImpl {
  private triggers = new Map<TriggerId, TriggerPlugin>();
  private conditions = new Map<ConditionType, ConditionPlugin>();
  private actions = new Map<ActionId, ActionPlugin>();

  register(plugin: PluginDefinition): void {
    for (const t of plugin.triggers) {
      this.triggers.set(t.id, t);
    }
    for (const c of plugin.conditions) {
      this.conditions.set(c.type, c);
    }
    for (const a of plugin.actions) {
      this.actions.set(a.id, a);
    }
  }

  getTrigger(id: TriggerId): TriggerPlugin | undefined {
    return this.triggers.get(id);
  }

  getAllTriggers(): TriggerPlugin[] {
    return [...this.triggers.values()];
  }

  getCondition(type: ConditionType): ConditionPlugin | undefined {
    return this.conditions.get(type);
  }

  getAllConditions(): ConditionPlugin[] {
    return [...this.conditions.values()];
  }

  getAction(id: ActionId): ActionPlugin | undefined {
    return this.actions.get(id);
  }

  getAllActions(): ActionPlugin[] {
    return [...this.actions.values()];
  }

  evaluateTrigger(event: TriggerEvent, trigger: WorkflowTrigger): boolean {
    const plugin = this.getTrigger(trigger.type);
    if (!plugin) return false;
    if (plugin.evaluate) {
      return plugin.evaluate(event, trigger.config);
    }
    return true;
  }

  evaluateCondition(condition: WorkflowCondition, context: ExecutionContext): boolean {
    const plugin = this.getCondition(condition.type);
    if (!plugin) return false;
    return plugin.evaluate(condition, context);
  }

  async executeAction(action: WorkflowAction, context: ExecutionContext): Promise<{ success: boolean; result?: any; error?: string }> {
    const plugin = this.getAction(action.type);
    if (!plugin) {
      return { success: false, error: `Unknown action type: ${action.type}` };
    }
    return plugin.execute(action, context);
  }
}

export const pluginRegistry = new PluginRegistryImpl();
