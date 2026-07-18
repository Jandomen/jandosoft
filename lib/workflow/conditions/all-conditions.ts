/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ConditionPlugin } from "../core/plugin-interfaces";
import type { ExecutionContext } from "../core/types";

function resolveValue(fieldPath: string | undefined, context: ExecutionContext): any {
  if (!fieldPath) return undefined;
  const payload = context.event.payload;
  const vars = context.vars;
  if (fieldPath.startsWith("payload.")) {
    const key = fieldPath.slice(8);
    return key.split(".").reduce((obj: any, k) => obj?.[k], payload);
  }
  if (fieldPath.startsWith("var.")) {
    const key = fieldPath.slice(4);
    return key.split(".").reduce((obj: any, k) => obj?.[k], vars);
  }
  return undefined;
}

function compareValues(a: any, operator: string, b: any): boolean {
  switch (operator) {
    case "eq": return a === b;
    case "neq": return a !== b;
    case "gt": return Number(a) > Number(b);
    case "gte": return Number(a) >= Number(b);
    case "lt": return Number(a) < Number(b);
    case "lte": return Number(a) <= Number(b);
    case "contains": return String(a).toLowerCase().includes(String(b).toLowerCase());
    case "starts_with": return String(a).toLowerCase().startsWith(String(b).toLowerCase());
    case "ends_with": return String(a).toLowerCase().endsWith(String(b).toLowerCase());
    case "in": return Array.isArray(b) && b.includes(a);
    case "not_in": return Array.isArray(b) && !b.includes(a);
    default: return false;
  }
}

export const ALL_CONDITIONS: ConditionPlugin[] = [
  {
    type: "comparison",
    name: "Comparación",
    description: "Compara un valor contra otro usando un operador",
    icon: "Equal",
    configSchema: {
      field: { type: "string", description: "Campo a evaluar (ej: payload.amount)" },
      operator: {
        type: "string",
        enum: ["eq", "neq", "gt", "gte", "lt", "lte", "contains", "starts_with", "ends_with", "in", "not_in"],
      },
      value: { type: "any" },
    },
    evaluate(condition, context) {
      const a = resolveValue(condition.field, context);
      return compareValues(a, condition.operator || "eq", condition.value);
    },
  },
  {
    type: "and",
    name: "Y",
    description: "Todas las condiciones deben cumplirse",
    icon: "GitMerge",
    configSchema: {
      conditions: { type: "array" },
    },
    evaluate(condition, context) {
      if (!condition.conditions || condition.conditions.length === 0) return true;
      return condition.conditions.every((c) => {
        const plugin = context.workflow.steps[context.stepIndex]?.conditions.find(() => true);
        if (!plugin) return false;
        const p = (globalThis as any).__workflowRegistry?.getCondition(c.type);
        return p ? p.evaluate(c, context) : false;
      });
    },
  },
  {
    type: "or",
    name: "O",
    description: "Al menos una condición debe cumplirse",
    icon: "GitBranch",
    configSchema: {
      conditions: { type: "array" },
    },
    evaluate(condition, context) {
      if (!condition.conditions || condition.conditions.length === 0) return true;
      return condition.conditions.some((c) => {
        const p = (globalThis as any).__workflowRegistry?.getCondition(c.type);
        return p ? p.evaluate(c, context) : false;
      });
    },
  },
  {
    type: "if",
    name: "Si",
    description: "Condición simple: si se cumple, se ejecutan las acciones",
    icon: "Split",
    configSchema: {
      field: { type: "string" },
      operator: { type: "string" },
      value: { type: "any" },
    },
    evaluate(condition, context) {
      const a = resolveValue(condition.field, context);
      return compareValues(a, condition.operator || "eq", condition.value);
    },
  },
  {
    type: "date_compare",
    name: "Comparar Fecha",
    description: "Compara una fecha contra otra o contra hoy",
    icon: "CalendarRange",
    configSchema: {
      field: { type: "string", description: "Campo de fecha (ej: payload.date)" },
      operator: {
        type: "string",
        enum: ["eq", "neq", "gt", "gte", "lt", "lte"],
      },
      value: { type: "string", description: "Fecha fija o 'today', '+Xd', '-Xd'" },
    },
    evaluate(condition, context) {
      const raw = resolveValue(condition.field, context);
      if (!raw) return false;
      const a = new Date(raw).getTime();
      let b: number;
      if (condition.value === "today") {
        b = new Date().setHours(0, 0, 0, 0);
      } else if (typeof condition.value === "string" && condition.value.startsWith("+")) {
        const days = parseInt(condition.value.slice(1), 10);
        b = new Date(Date.now() + days * 86400000).setHours(0, 0, 0, 0);
      } else if (typeof condition.value === "string" && condition.value.startsWith("-")) {
        const days = parseInt(condition.value.slice(1), 10);
        b = new Date(Date.now() - days * 86400000).setHours(0, 0, 0, 0);
      } else {
        b = new Date(condition.value).getTime();
      }
      return compareValues(a, condition.operator || "eq", b);
    },
  },
  {
    type: "range",
    name: "Rango",
    description: "Verifica si un valor está dentro de un rango numérico",
    icon: "ArrowLeftRight",
    configSchema: {
      field: { type: "string" },
      min: { type: "number" },
      max: { type: "number" },
    },
    evaluate(condition, context) {
      const val = Number(resolveValue(condition.field, context));
      const min = condition.value?.min ?? condition.value?.min ?? 0;
      const max = condition.value?.max ?? condition.value?.max ?? Infinity;
      return val >= min && val <= max;
    },
  },
  {
    type: "text_compare",
    name: "Comparar Texto",
    description: "Compara texto usando operadores de string",
    icon: "Type",
    configSchema: {
      field: { type: "string" },
      operator: {
        type: "string",
        enum: ["contains", "starts_with", "ends_with", "eq", "neq"],
      },
      value: { type: "string" },
    },
    evaluate(condition, context) {
      const a = String(resolveValue(condition.field, context) || "");
      return compareValues(a, condition.operator || "eq", condition.value);
    },
  },
  {
    type: "variable_check",
    name: "Variable",
    description: "Verifica el valor de una variable interna del workflow",
    icon: "Variable",
    configSchema: {
      variable: { type: "string" },
      operator: { type: "string" },
      value: { type: "any" },
    },
    evaluate(condition, context) {
      const a = resolveValue(`var.${condition.value}`, context);
      return compareValues(a, condition.operator || "eq", condition.value);
    },
  },
];
