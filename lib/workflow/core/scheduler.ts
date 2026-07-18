/* eslint-disable @typescript-eslint/no-explicit-any */
import { pluginRegistry } from "../registry/plugin-registry";
import { executeWorkflow } from "./engine";
import type { IWorkflow, TriggerEvent } from "./types";

/**
 * Evaluates scheduled workflows: those with a "scheduled" trigger or
 * triggers that implement getCronExpression.
 *
 * Returns an array of cron entries: { cron, handler }
 */
export function getScheduledWorkflowEntries(stores: any[]): { cron: string; handler: () => Promise<void> }[] {
  const entries: { cron: string; handler: () => Promise<void> }[] = [];
  const seen = new Set<string>();

  for (const store of stores) {
    const workflows: IWorkflow[] = store.workflows || [];
    for (const wf of workflows) {
      if (!wf.enabled) continue;

      const triggerPlugin = pluginRegistry.getTrigger(wf.trigger.type);
      if (!triggerPlugin) continue;

      // Triggers that implement getCronExpression (e.g., customer_inactive, customer_birthday)
      if (triggerPlugin.getCronExpression) {
        const cron = triggerPlugin.getCronExpression(wf.trigger.config);
        if (cron) {
          const key = `${cron}:${store._id}`;
          if (!seen.has(key)) {
            seen.add(key);
            entries.push({
              cron,
              handler: async () => {
                await evaluateScheduledTrigger(store, wf);
              },
            });
          }
        }
      }
    }
  }

  return entries;
}

async function evaluateScheduledTrigger(store: any, workflow: IWorkflow): Promise<void> {
  const triggerPlugin = pluginRegistry.getTrigger(workflow.trigger.type);
  if (!triggerPlugin) return;

  let events: TriggerEvent[] = [];

  switch (workflow.trigger.type) {
    case "customer_inactive": {
      const daysInactive = workflow.trigger.config.daysInactive || 30;
      const cutoff = new Date(Date.now() - daysInactive * 86400000);
      const customers = store.customers || [];
      for (const c of customers) {
        const lastOrder = (store.orders || [])
          .filter((o: any) => o.customerEmail === c.email)
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
        const lastActive = lastOrder ? new Date(lastOrder.createdAt) : new Date(c.createdAt || 0);
        if (lastActive < cutoff) {
          events.push({
            trigger: "customer_inactive",
            storeId: store._id.toString(),
            payload: { customerName: c.name, customerEmail: c.email, daysInactive },
            timestamp: new Date(),
          });
        }
      }
      break;
    }

    case "customer_birthday": {
      const today = new Date();
      const todayStr = `${today.getMonth() + 1}-${today.getDate()}`;
      const customers = store.customers || [];
      for (const c of customers) {
        if (c.birthDate || c.birthday) {
          const bd = new Date(c.birthDate || c.birthday);
          const bdStr = `${bd.getMonth() + 1}-${bd.getDate()}`;
          if (bdStr === todayStr) {
            events.push({
              trigger: "customer_birthday",
              storeId: store._id.toString(),
              payload: { customerName: c.name, customerEmail: c.email },
              timestamp: new Date(),
            });
          }
        }
      }
      break;
    }

    default:
      break;
  }

  for (const event of events) {
    try {
      await executeWorkflow(workflow, event, store);
    } catch (error: any) {
      console.error(`[Workflow Scheduler] Error in workflow ${workflow.id}:`, error.message);
    }
  }
}

/**
 * Generates trigger events for a store on demand (used after creating a record).
 */
export function createTriggerEvent(
  trigger: TriggerEvent["trigger"],
  storeId: string,
  payload: Record<string, any>
): TriggerEvent {
  return {
    trigger,
    storeId,
    payload,
    timestamp: new Date(),
  };
}
