/* eslint-disable @typescript-eslint/no-explicit-any */

export type TriggerId =
  | "new_customer"
  | "new_order"
  | "new_appointment"
  | "payment_received"
  | "payment_failed"
  | "new_form_submission"
  | "customer_inactive"
  | "customer_birthday"
  | "low_stock"
  | "subscription_created"
  | "subscription_canceled"
  | "webhook_received"
  | "scheduled";

export type ConditionType =
  | "if"
  | "and"
  | "or"
  | "comparison"
  | "date_compare"
  | "range"
  | "text_compare"
  | "variable_check";

export type ComparisonOp = "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "contains" | "starts_with" | "ends_with" | "in" | "not_in";

export type ActionId =
  | "create_customer"
  | "create_order"
  | "create_appointment"
  | "create_invoice"
  | "send_email"
  | "send_whatsapp"
  | "send_sms"
  | "send_push"
  | "create_task"
  | "wait"
  | "execute_ai"
  | "execute_webhook"
  | "http_request"
  | "update_record"
  | "delete_record";

export interface WorkflowCondition {
  id: string;
  type: ConditionType;
  field?: string;
  operator?: ComparisonOp;
  value?: any;
  conditions?: WorkflowCondition[];
}

export interface WorkflowAction {
  id: string;
  type: ActionId;
  config: Record<string, any>;
  label?: string;
}

export interface WorkflowStep {
  id: string;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  label?: string;
  position?: { x: number; y: number };
}

export interface WorkflowTrigger {
  id: string;
  type: TriggerId;
  config: Record<string, any>;
  label?: string;
}

export interface IWorkflow {
  id: number;
  name: string;
  description?: string;
  enabled: boolean;
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
  createdAt: string;
  updatedAt?: string;
  runCount?: number;
  lastRunAt?: string;
}

export interface TriggerEvent {
  trigger: TriggerId;
  storeId: string;
  payload: Record<string, any>;
  timestamp: Date;
}

export interface ExecutionContext {
  workflow: IWorkflow;
  event: TriggerEvent;
  store: any;
  vars: Record<string, any>;
  stepIndex: number;
  actionIndex: number;
}

export interface ExecutionResult {
  workflowId: number;
  workflowName: string;
  success: boolean;
  startedAt: Date;
  finishedAt: Date;
  steps: {
    stepId: string;
    conditionsMet: boolean;
    actions: {
      actionId: string;
      success: boolean;
      result?: any;
      error?: string;
    }[];
  }[];
  error?: string;
}
