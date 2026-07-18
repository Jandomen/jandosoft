import { pluginRegistry } from "./registry/plugin-registry";
import { initWorkflowEngine } from "./core/engine";
import { ALL_TRIGGERS } from "./triggers/all-triggers";
import { ALL_CONDITIONS } from "./conditions/all-conditions";
import { ALL_ACTIONS } from "./actions/all-actions";

/**
 * Register all built-in workflow plugins and initialize the engine.
 * Call this once at app startup.
 */
export function registerWorkflowPlugins(): void {
  pluginRegistry.register({
    triggers: ALL_TRIGGERS,
    conditions: ALL_CONDITIONS,
    actions: ALL_ACTIONS,
  });

  initWorkflowEngine();

  console.log(`[Workflow] Registered ${ALL_TRIGGERS.length} triggers, ${ALL_CONDITIONS.length} conditions, ${ALL_ACTIONS.length} actions`);
}
