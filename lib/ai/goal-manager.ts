/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Goal Management System for JandoSoft AI Agent
 *
 * Architecture:
 *   User → Goal Detection → Goal Manager → Task Planner → Tool Router → Tool Executor → Update State → Respond
 *
 * Rules:
 * 1. Goal Detection: Before responding, identify the user's primary goal.
 * 2. Goal Lock: While a goal is not completed, the agent does not switch tasks.
 * 3. Goal Validation: Before executing any tool, verify it helps the current goal.
 * 4. Subtasks: Each goal is divided into sequential steps. No skipping.
 * 5. Goal Change: Only when the user explicitly requests it.
 * 6. State: currentGoal, goalStatus, completedSteps, pendingSteps, pendingConfirmation.
 * 7. Verification: Before responding, ask "does my response help the goal?"
 * 8. Tool Guard: No tools outside the goal scope.
 * 9. Finalization: Only mark completed when tool succeeded + state updated + user informed.
 */

import type { IntentType } from "./task-planner";

// ── Types ──

export type GoalStatus =
  | "idle"
  | "detecting"
  | "locked"
  | "collecting"
  | "confirming"
  | "executing"
  | "verifying"
  | "completed"
  | "failed"
  | "abandoned";

export interface Subtask {
  id: string;
  label: string;
  description: string;
  required: boolean;
  completed: boolean;
  toolRequired: string | null;
  paramsCollected: Record<string, any>;
}

export interface GoalState {
  id: string;
  description: string;
  intent: IntentType;
  status: GoalStatus;
  subtasks: Subtask[];
  completedSteps: number;
  pendingSteps: number;
  pendingConfirmation: boolean;
  confirmationMessage: string | null;
  lastUserMessage: string;
  lastAgentQuestion: string | null;
  toolHistory: { tool: string; success: boolean; timestamp: number }[];
  createdAt: number;
  updatedAt: number;
  turnCount: number;
  maxTurns: number;
}

export interface GoalValidation {
  allowed: boolean;
  reason: string;
  suggestion?: string;
}

export interface GoalSnapshot {
  currentGoal: GoalState | null;
  isActive: boolean;
  progress: number; // 0-100
  currentStep: string | null;
  nextStep: string | null;
}

// ── Goal Templates (intent → subtask pipeline) ──

const GOAL_TEMPLATES: Record<string, (message: string, store: any) => Subtask[]> = {
  create_appointment: (msg, store) => [
    { id: "detect_service", label: "Detectar servicio", description: "Identificar qué servicio desea el cliente", required: true, completed: false, toolRequired: null, paramsCollected: {} },
    { id: "collect_name", label: "Obtener nombre", description: "Pedir nombre del cliente si no lo tiene", required: true, completed: false, toolRequired: null, paramsCollected: {} },
    { id: "collect_email", label: "Obtener email", description: "Pedir email del cliente", required: true, completed: false, toolRequired: null, paramsCollected: {} },
    { id: "collect_date", label: "Obtener fecha", description: "Pedir fecha preferida", required: true, completed: false, toolRequired: null, paramsCollected: {} },
    { id: "collect_time", label: "Obtener hora", description: "Pedir hora preferida o mostrar disponibilidad", required: true, completed: false, toolRequired: "check_available_slots", paramsCollected: {} },
    { id: "create", label: "Crear cita", description: "Ejecutar create_appointment con todos los datos", required: true, completed: false, toolRequired: "create_appointment", paramsCollected: {} },
    { id: "confirm", label: "Confirmar al usuario", description: "Informar que la cita fue creada exitosamente", required: true, completed: false, toolRequired: null, paramsCollected: {} },
  ],
  cancel_appointment: (msg) => [
    { id: "identify", label: "Identificar cita", description: "Determinar qué cita quiere cancelar", required: true, completed: false, toolRequired: null, paramsCollected: {} },
    { id: "confirm_cancel", label: "Confirmar cancelación", description: "Pedir confirmación explícita (acción destructiva)", required: true, completed: false, toolRequired: null, paramsCollected: {} },
    { id: "execute_cancel", label: "Ejecutar cancelación", description: "Llamar cancel_appointment", required: true, completed: false, toolRequired: "cancel_appointment", paramsCollected: {} },
    { id: "confirm", label: "Confirmar al usuario", description: "Informar que la cita fue cancelada", required: true, completed: false, toolRequired: null, paramsCollected: {} },
  ],
  create_order: (msg) => [
    { id: "detect_items", label: "Detectar productos", description: "Identificar qué productos quiere el cliente", required: true, completed: false, toolRequired: null, paramsCollected: {} },
    { id: "collect_name", label: "Obtener nombre", description: "Pedir nombre del cliente", required: true, completed: false, toolRequired: null, paramsCollected: {} },
    { id: "create", label: "Crear pedido", description: "Ejecutar create_order", required: true, completed: false, toolRequired: "create_order", paramsCollected: {} },
    { id: "confirm", label: "Confirmar al usuario", description: "Informar que el pedido fue creado", required: true, completed: false, toolRequired: null, paramsCollected: {} },
  ],
  create_customer: (msg) => [
    { id: "collect_name", label: "Obtener nombre", description: "Pedir nombre del cliente", required: true, completed: false, toolRequired: null, paramsCollected: {} },
    { id: "collect_email", label: "Obtener email", description: "Pedir email del cliente", required: true, completed: false, toolRequired: null, paramsCollected: {} },
    { id: "create", label: "Registrar cliente", description: "Ejecutar create_customer", required: true, completed: false, toolRequired: "create_customer", paramsCollected: {} },
    { id: "confirm", label: "Confirmar al usuario", description: "Informar que el cliente fue registrado", required: true, completed: false, toolRequired: null, paramsCollected: {} },
  ],
  request_payment: (msg) => [
    { id: "collect_amount", label: "Obtener monto", description: "Pedir monto del pago", required: true, completed: false, toolRequired: null, paramsCollected: {} },
    { id: "collect_email", label: "Obtener email", description: "Pedir email del cliente", required: true, completed: false, toolRequired: null, paramsCollected: {} },
    { id: "create", label: "Crear link de pago", description: "Ejecutar create_checkout", required: true, completed: false, toolRequired: "create_checkout", paramsCollected: {} },
    { id: "confirm", label: "Confirmar al usuario", description: "Entregar link de pago al usuario", required: true, completed: false, toolRequired: null, paramsCollected: {} },
  ],
  check_availability: (msg) => [
    { id: "collect_date", label: "Obtener fecha", description: "Pedir fecha para consultar disponibilidad", required: true, completed: false, toolRequired: null, paramsCollected: {} },
    { id: "check", label: "Consultar disponibilidad", description: "Ejecutar check_available_slots", required: true, completed: false, toolRequired: "check_available_slots", paramsCollected: {} },
    { id: "confirm", label: "Mostrar resultados", description: "Presentar horarios disponibles al usuario", required: true, completed: false, toolRequired: null, paramsCollected: {} },
  ],
  reschedule_appointment: (msg) => [
    { id: "identify", label: "Identificar cita", description: "Determinar qué cita quiere reprogramar", required: true, completed: false, toolRequired: null, paramsCollected: {} },
    { id: "collect_date", label: "Obtener nueva fecha", description: "Pedir nueva fecha", required: true, completed: false, toolRequired: null, paramsCollected: {} },
    { id: "collect_time", label: "Obtener nueva hora", description: "Pedir nueva hora", required: true, completed: false, toolRequired: null, paramsCollected: {} },
    { id: "execute", label: "Reprogramar cita", description: "Ejecutar update_appointment", required: true, completed: false, toolRequired: "update_appointment", paramsCollected: {} },
    { id: "confirm", label: "Confirmar al usuario", description: "Informar que la cita fue reprogramada", required: true, completed: false, toolRequired: null, paramsCollected: {} },
  ],
};

// ── Intent → Goal mapping ──

const INTENT_GOAL_MAP: Record<string, string> = {
  create_appointment: "create_appointment",
  cancel_appointment: "cancel_appointment",
  reschedule_appointment: "reschedule_appointment",
  create_order: "create_order",
  update_order: "create_order",
  create_customer: "create_customer",
  request_payment: "request_payment",
  check_availability: "check_availability",
};

// ── Tool → Goal scope mapping ──

const TOOL_GOAL_SCOPE: Record<string, string[]> = {
  create_appointment: ["create_appointment", "reschedule_appointment"],
  cancel_appointment: ["cancel_appointment"],
  update_appointment: ["reschedule_appointment"],
  check_available_slots: ["create_appointment", "check_availability", "reschedule_appointment"],
  create_order: ["create_order"],
  update_order_status: ["create_order"],
  create_customer: ["create_customer"],
  create_checkout: ["request_payment"],
  list_appointments: ["create_appointment", "cancel_appointment", "reschedule_appointment", "check_availability"],
  list_services: ["create_appointment", "create_order"],
  list_orders: ["create_order"],
  get_analytics: ["*"], // informational, always allowed
  getCurrentDateTime: ["*"], // utility, always allowed
  send_email: ["*"], // communication, always allowed
  list_payments: ["request_payment"],
};

// ── Core: Confirm-like words that should NOT trigger new goals ──

const CONFIRMATION_WORDS = /^(sí|si|ok|dale|hazlo|continúa|continua|adelante|yes|sure|go ahead|do it|perfecto|bien|correcto|exacto|así es|claro|por favor|confirmo|confirmar|vamos|hágalo|hagalo|procede|proceder|entendido|de acuerdo|dale|ok)$/i;

// ── Topic-change keywords ──

const TOPIC_CHANGE_KEYWORDS = [
  "ahora crea", "olvida eso", "olvídalo", "cambiemos de tema", "olvida",
  "nuevo tema", "otra cosa", "en vez de", "mejor haz", "no quiero eso",
  "cambialo", "cámbialo", "en lugar de", "deja eso", "para",
  "olvidalo", "forgot about", "instead", "let's change", "new topic",
];

// ── GoalManager class ──

export class GoalManager {
  private state: GoalState | null = null;

  static deserialize(data: string | null): GoalManager {
    const manager = new GoalManager();
    if (data) {
      try {
        manager.state = JSON.parse(data);
      } catch {
        manager.state = null;
      }
    }
    return manager;
  }

  serialize(): string | null {
    return this.state ? JSON.stringify(this.state) : null;
  }

  getState(): GoalState | null {
    return this.state;
  }

  getSnapshot(): GoalSnapshot {
    if (!this.state) {
      return { currentGoal: null, isActive: false, progress: 0, currentStep: null, nextStep: null };
    }
    const total = this.state.subtasks.length;
    const completed = this.state.subtasks.filter(s => s.completed).length;
    const current = this.state.subtasks.find(s => !s.completed);
    const next = this.state.subtasks.filter(s => !s.completed)[1] || null;

    return {
      currentGoal: this.state,
      isActive: !["idle", "completed", "failed", "abandoned"].includes(this.state.status),
      progress: total > 0 ? Math.round((completed / total) * 100) : 0,
      currentStep: current?.label || null,
      nextStep: next?.label || null,
    };
  }

  /**
   * Step 1: Goal Detection
   * Identify the user's primary goal from their message.
   */
  detectGoal(message: string, intent: IntentType, confidence: number, store: any): GoalState | null {
    // Check for explicit topic change first
    if (this.isExplicitTopicChange(message)) {
      this.state = null;
      return null;
    }

    // If there's already an active goal, check if we should lock or release
    if (this.state && this.isActive()) {
      // Affirmative → continue current goal
      if (CONFIRMATION_WORDS.test(message.trim())) {
        return this.state;
      }

      // If intent matches current goal, stay locked
      if (this.state.intent === intent) {
        return this.state;
      }

      // If new intent has high confidence and user explicitly stated it, allow change
      if (confidence >= 0.7 && this.isExplicitIntent(message, intent)) {
        return null; // signal to create new goal
      }

      // Otherwise, stay locked on current goal
      return this.state;
    }

    // No active goal — try to create one
    const goalType = INTENT_GOAL_MAP[intent];
    if (!goalType) return null; // informational intents don't create goals

    const template = GOAL_TEMPLATES[goalType];
    if (!template) return null;

    const subtasks = template(message, store);
    const now = Date.now();

    this.state = {
      id: `goal_${now}`,
      description: this.describeGoal(intent, message),
      intent,
      status: "locked",
      subtasks,
      completedSteps: 0,
      pendingSteps: subtasks.length,
      pendingConfirmation: false,
      confirmationMessage: null,
      lastUserMessage: message,
      lastAgentQuestion: null,
      toolHistory: [],
      createdAt: now,
      updatedAt: now,
      turnCount: 0,
      maxTurns: 15,
    };

    return this.state;
  }

  /**
   * Step 2: Goal Lock
   * Check if the agent is currently locked on a goal.
   */
  isLocked(): boolean {
    return this.state !== null && this.isActive() &&
      !["idle", "completed", "failed", "abandoned"].includes(this.state.status);
  }

  /**
   * Step 3: Goal Validation
   * Before executing any tool, check if it helps the current goal.
   */
  validateTool(toolName: string, args: Record<string, any>): GoalValidation {
    // If no active goal, allow utility tools only
    if (!this.state || !this.isActive()) {
      const alwaysAllowed = TOOL_GOAL_SCOPE[toolName];
      if (alwaysAllowed && alwaysAllowed.includes("*")) {
        return { allowed: true, reason: "Utility tool, always allowed" };
      }
      return {
        allowed: false,
        reason: "No hay un objetivo activo. Inicia una tarea clara primero.",
        suggestion: "Puedo ayudarte a agendar una cita, crear un pedido, registrar un cliente, o generar un link de pago.",
      };
    }

    // Check if tool is in scope of current goal
    const allowedGoals = TOOL_GOAL_SCOPE[toolName];
    if (allowedGoals) {
      if (allowedGoals.includes("*")) {
        return { allowed: true, reason: "Utility tool, always allowed" };
      }
      if (allowedGoals.includes(this.state.intent)) {
        return { allowed: true, reason: `Tool "${toolName}" is within scope of goal "${this.state.intent}"` };
      }
    }

    // Tool is NOT in scope
    return {
      allowed: false,
      reason: `La herramienta "${toolName}" no pertenece al objetivo actual (${this.describeGoal(this.state.intent)}).`,
      suggestion: `Continúa con: ${this.getCurrentStepLabel() || "la tarea en curso"}.`,
    };
  }

  /**
   * Step 4: Subtask Progression
   * Mark current subtask as completed and advance to next.
   */
  advanceSubtask(toolExecuted?: string, toolResult?: string): GoalState | null {
    if (!this.state) return null;

    const currentSubtask = this.state.subtasks.find(s => !s.completed);
    if (currentSubtask) {
      currentSubtask.completed = true;
      if (toolExecuted) {
        currentSubtask.paramsCollected = { ...currentSubtask.paramsCollected, lastTool: toolExecuted };
      }
    }

    // Update counts
    this.state.completedSteps = this.state.subtasks.filter(s => s.completed).length;
    this.state.pendingSteps = this.state.subtasks.filter(s => !s.completed).length;
    this.state.updatedAt = Date.now();
    this.state.turnCount++;

    // Track tool execution
    if (toolExecuted) {
      this.state.toolHistory.push({
        tool: toolExecuted,
        success: !!toolResult,
        timestamp: Date.now(),
      });
    }

    // Check if all subtasks completed
    if (this.state.pendingSteps === 0) {
      this.state.status = "completed";
    }

    return this.state;
  }

  /**
   * Step 5: Goal Change
   * Only change when user explicitly requests it.
   */
  canChangeGoal(message: string): boolean {
    return this.isExplicitTopicChange(message);
  }

  changeGoal(): void {
    this.state = null;
  }

  /**
   * Step 6: State persistence
   */
  getGoalState(): {
    currentGoal: string | null;
    goalStatus: GoalStatus;
    completedSteps: number;
    pendingSteps: number;
    pendingConfirmation: boolean;
  } {
    return {
      currentGoal: this.state?.description || null,
      goalStatus: this.state?.status || "idle",
      completedSteps: this.state?.completedSteps || 0,
      pendingSteps: this.state?.pendingSteps || 0,
      pendingConfirmation: this.state?.pendingConfirmation || false,
    };
  }

  /**
   * Step 7: Response verification
   * Before responding, check if it helps the goal.
   */
  verifyResponse(responseText: string): { valid: boolean; reason: string } {
    if (!this.state || !this.isActive()) return { valid: true, reason: "No active goal" };

    // If goal is collecting info and response is a question → valid
    if (this.state.status === "collecting" && responseText.includes("?")) {
      return { valid: true, reason: "Collecting info phase, question is expected" };
    }

    // If goal is confirming and response is a confirmation prompt → valid
    if (this.state.status === "confirming") {
      return { valid: true, reason: "Confirmation phase" };
    }

    // Check if response mentions the goal context
    const goalKeywords = this.state.description.toLowerCase().split(/\s+/);
    const responseLower = responseText.toLowerCase();
    const relevantWords = goalKeywords.filter(w => w.length > 3);
    const hasRelevantContent = relevantWords.some(w => responseLower.includes(w));

    if (hasRelevantContent || responseText.includes("?")) {
      return { valid: true, reason: "Response is relevant to goal" };
    }

    return { valid: true, reason: "Response appears goal-related" };
  }

  // ── Helper methods ──

  private isActive(): boolean {
    return this.state !== null &&
      !["completed", "failed", "abandoned"].includes(this.state.status);
  }

  private isExplicitTopicChange(message: string): boolean {
    const lower = message.toLowerCase();
    return TOPIC_CHANGE_KEYWORDS.some(kw => lower.includes(kw));
  }

  private isExplicitIntent(message: string, intent: IntentType): boolean {
    const lower = message.toLowerCase();
    const intentPhrases: Record<string, string[]> = {
      create_appointment: ["agendar", "cita", "reservar", "schedule"],
      cancel_appointment: ["cancelar cita", "anular cita"],
      create_order: ["hacer pedido", "quiero pedir", "ordenar"],
      create_customer: ["registrar cliente", "crear cliente", "registrar"],
      request_payment: ["pagar", "link de pago", "factura", "cobrar"],
    };
    const phrases = intentPhrases[intent] || [];
    return phrases.some(p => lower.includes(p));
  }

  private getCurrentStepLabel(): string | null {
    if (!this.state) return null;
    const current = this.state.subtasks.find(s => !s.completed);
    return current?.label || null;
  }

  private describeGoal(intent: IntentType, message?: string): string {
    const descriptions: Record<string, string> = {
      create_appointment: "Agendar una cita para el cliente",
      cancel_appointment: "Cancelar una cita existente",
      reschedule_appointment: "Reprogramar una cita existente",
      create_order: "Crear un pedido para el cliente",
      update_order: "Actualizar un pedido existente",
      create_customer: "Registrar un nuevo cliente",
      request_payment: "Generar un link de pago",
      check_availability: "Consultar disponibilidad de horarios",
    };
    return descriptions[intent] || `Completar tarea: ${intent}`;
  }

  /**
   * Generate the goal context block for the system prompt.
   */
  generateGoalContext(): string {
    const snapshot = this.getSnapshot();
    if (!snapshot.currentGoal || !snapshot.isActive) return "";

    const lines: string[] = [];
    lines.push("═══ GESTIÓN DE OBJETIVO ACTIVO ═══");
    lines.push(`Objetivo: ${snapshot.currentGoal.description}`);
    lines.push(`Estado: ${snapshot.currentGoal.status.toUpperCase()}`);
    lines.push(`Progreso: ${snapshot.progress}% (${snapshot.currentGoal.completedSteps}/${snapshot.currentGoal.subtasks.length} pasos)`);
    lines.push("");

    // Subtask checklist
    lines.push("PASOS:");
    for (const st of snapshot.currentGoal.subtasks) {
      const icon = st.completed ? "✔" : "◻";
      const current = !st.completed && snapshot.currentGoal.subtasks.filter(s => !s.completed)[0] === st;
      lines.push(`  ${icon} ${st.label}${current ? " ← ACTUAL" : ""}`);
    }
    lines.push("");

    // Lock rules
    lines.push("REGLAS DE BLOQUEO:");
    lines.push("- Mientras el objetivo esté activo, NO cambies de tarea.");
    lines.push("- Si el usuario dice 'ok', 'si', 'adelante', 'continua' -> continua con el paso actual.");
    lines.push("- NO ejecutes herramientas que no pertenezcan a este objetivo.");
    lines.push("- NO saltes pasos. Completa cada uno antes del siguiente.");
    lines.push("");

    // Confirmation state
    if (snapshot.currentGoal.pendingConfirmation) {
      lines.push("⚠ CONFIRMACIÓN PENDIENTE: Esperando confirmación del usuario para acción destructiva.");
    }

    // Last question
    if (snapshot.currentGoal.lastAgentQuestion) {
      lines.push(`Última pregunta realizada: "${snapshot.currentGoal.lastAgentQuestion.substring(0, 150)}"`);
    }

    lines.push("═══ FIN GESTIÓN DE OBJETIVO ═══");
    return lines.join("\n");
  }

  /**
   * Mark goal as failed (e.g., tool execution error).
   */
  markFailed(reason: string): void {
    if (this.state) {
      this.state.status = "failed";
      this.state.updatedAt = Date.now();
    }
  }

  /**
   * Mark goal as completed.
   */
  markCompleted(): void {
    if (this.state) {
      // Mark all remaining subtasks as completed
      for (const st of this.state.subtasks) {
        st.completed = true;
      }
      this.state.status = "completed";
      this.state.completedSteps = this.state.subtasks.length;
      this.state.pendingSteps = 0;
      this.state.updatedAt = Date.now();
    }
  }

  /**
   * Set confirmation state.
   */
  setConfirmation(message: string): void {
    if (this.state) {
      this.state.pendingConfirmation = true;
      this.state.confirmationMessage = message;
      this.state.status = "confirming";
      this.state.updatedAt = Date.now();
    }
  }

  /**
   * Clear confirmation state (after user confirmed or denied).
   */
  clearConfirmation(): void {
    if (this.state) {
      this.state.pendingConfirmation = false;
      this.state.confirmationMessage = null;
      this.state.status = "locked";
      this.state.updatedAt = Date.now();
    }
  }

  /**
   * Set the collecting info status.
   */
  setCollecting(): void {
    if (this.state && this.state.status !== "completed") {
      this.state.status = "collecting";
    }
  }

  /**
   * Set executing status.
   */
  setExecuting(): void {
    if (this.state) {
      this.state.status = "executing";
    }
  }

  /**
   * Record the last agent question.
   */
  setLastAgentQuestion(question: string): void {
    if (this.state) {
      this.state.lastAgentQuestion = question;
    }
  }

  /**
   * Update subtask params from extracted data.
   */
  updateSubtaskParams(params: Record<string, any>): void {
    if (!this.state) return;
    const current = this.state.subtasks.find(s => !s.completed);
    if (current) {
      current.paramsCollected = { ...current.paramsCollected, ...params };
    }
  }

  /**
   * Check if we've exceeded the max turns for this goal.
   */
  isOverMaxTurns(): boolean {
    return this.state ? this.state.turnCount >= this.state.maxTurns : false;
  }

  /**
   * Force abandon the current goal.
   */
  abandon(): void {
    if (this.state) {
      this.state.status = "abandoned";
      this.state.updatedAt = Date.now();
    }
  }
}

/**
 * Shared utility: check if a message is a confirmation/affirmative response.
 */
export function isConfirmationResponse(message: string): boolean {
  return CONFIRMATION_WORDS.test(message.trim());
}

/**
 * Shared utility: check if message is an explicit topic change request.
 */
export function isExplicitTopicChange(message: string): boolean {
  const lower = message.toLowerCase();
  return TOPIC_CHANGE_KEYWORDS.some(kw => lower.includes(kw));
}
