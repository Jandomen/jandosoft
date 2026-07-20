/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Workflow Manager for JandoSoft AI Agent
 *
 * Enforces strict sequential multi-turn flows. One active workflow per conversation.
 *
 * Rules:
 * 1. Only one active workflow per conversation.
 * 2. Each workflow has mandatory steps.
 * 3. While active, agent MUST continue the flow.
 * 4. Affirmative responses ALWAYS confirm the pending step.
 * 5. Only start new workflow when previous is done/cancelled/explicit change.
 * 6. Before responding: check if active workflow → continue from last step.
 * 7. Never go back to start, never re-ask collected data, never change objective.
 */

import type { IntentType } from "./task-planner";

// ── Types ──

export type WorkflowStatus =
  | "idle"
  | "active"
  | "awaiting_input"
  | "awaiting_confirmation"
  | "executing_step"
  | "completed"
  | "cancelled"
  | "failed";

export interface WorkflowStep {
  id: string;
  label: string;
  description: string;
  type: "collect_info" | "confirm" | "execute_tool" | "inform";
  toolRequired: string | null;
  toolArgs: Record<string, any> | null;
  paramsToCollect: string[];
  questionTemplate: string;
  validationPattern: RegExp | null;
  completed: boolean;
  skipped: boolean;
  collectedData: Record<string, any>;
  errorMessage: string | null;
}

export interface WorkflowState {
  id: string;
  type: string;
  description: string;
  status: WorkflowStatus;
  steps: WorkflowStep[];
  currentStepIndex: number;
  completedSteps: number;
  totalSteps: number;
  collectedData: Record<string, any>;
  lastUserMessage: string;
  lastAgentResponse: string | null;
  lastAgentQuestion: string | null;
  turnCount: number;
  maxTurns: number;
  createdAt: number;
  updatedAt: number;
}

export interface WorkflowSnapshot {
  isActive: boolean;
  type: string | null;
  description: string | null;
  progress: number;
  currentStep: string | null;
  currentStepIndex: number;
  totalSteps: number;
  collectedData: Record<string, any>;
  status: WorkflowStatus;
}

export interface WorkflowValidation {
  allowed: boolean;
  reason: string;
  action: "continue" | "block" | "new_workflow" | "cancel";
}

// ── Affirmative patterns ──

const AFFIRMATIVE_PATTERN = /^(sí|si|ok|dale|hazlo|continúa|continua|adelante|yes|sure|go ahead|do it|perfecto|bien|correcto|exacto|así es|claro|por favor|confirmo|confirmar|vamos|hágalo|hagalo|procede|proceder|entendido|de acuerdo)$/i;

// ── Cancel patterns ──

const CANCEL_PATTERN = /^(cancelar|cancel|olvida|olvídalo|olvidalo|para|detente|no quiero|deja|olvida eso|nunca mind|nevermind|stop)$/i;

// ── Topic change patterns ──

const TOPIC_CHANGE_PATTERN = /^(ahora|nuevo|otra cosa|cambiemos|en vez de|mejor|deja eso|en lugar de|new topic|instead|let's change)/i;

// ── Workflow Templates ──

function buildCampaignCreationWorkflow(store: any): WorkflowStep[] {
  const services = (store?.services || []).map((s: any) => s.name).join(", ");
  return [
    {
      id: "select_channel",
      label: "Seleccionar canal",
      description: "Determinar el canal de envío (email, sms, whatsapp)",
      type: "collect_info",
      toolRequired: null,
      toolArgs: null,
      paramsToCollect: ["channel"],
      questionTemplate: "¿Por qué canal quieres enviar la campaña? Puedo usar **email**, **SMS** o **WhatsApp**.",
      validationPattern: /^(email|sms|whatsapp|correo|mensaje|whats)$/i,
      completed: false,
      skipped: false,
      collectedData: {},
      errorMessage: null,
    },
    {
      id: "select_audience",
      label: "Seleccionar audiencia",
      description: "Determinar a quién va dirigida la campaña",
      type: "collect_info",
      toolRequired: null,
      toolArgs: null,
      paramsToCollect: ["audience"],
      questionTemplate: "¿A quién va dirigida la campaña? Puedes decir: **todos los clientes**, **clientes nuevos**, **clientes frecuentes**, **VIP**, o un segmento específico.",
      validationPattern: null,
      completed: false,
      skipped: false,
      collectedData: {},
      errorMessage: null,
    },
    {
      id: "get_subject",
      label: "Obtener asunto",
      description: "Pedir el asunto/título de la campaña",
      type: "collect_info",
      toolRequired: null,
      toolArgs: null,
      paramsToCollect: ["subject"],
      questionTemplate: "¿Cuál es el **asunto** o título de la campaña? (Ejemplo: 'Oferta especial de fin de semana')",
      validationPattern: null,
      completed: false,
      skipped: false,
      collectedData: {},
      errorMessage: null,
    },
    {
      id: "get_content",
      label: "Obtener contenido",
      description: "Pedir el contenido/mensaje de la campaña",
      type: "collect_info",
      toolRequired: null,
      toolArgs: null,
      paramsToCollect: ["content"],
      questionTemplate: "Ahora escribe el **contenido** del mensaje que quieres enviar a tus clientes.",
      validationPattern: null,
      completed: false,
      skipped: false,
      collectedData: {},
      errorMessage: null,
    },
    {
      id: "confirm_campaign",
      label: "Confirmar campaña",
      description: "Mostrar resumen y pedir confirmación antes de enviar",
      type: "confirm",
      toolRequired: null,
      toolArgs: null,
      paramsToCollect: [],
      questionTemplate: "",
      validationPattern: null,
      completed: false,
      skipped: false,
      collectedData: {},
      errorMessage: null,
    },
    {
      id: "send_campaign",
      label: "Enviar campaña",
      description: "Ejecutar el envío de la campaña",
      type: "execute_tool",
      toolRequired: "send_campaign",
      toolArgs: null,
      paramsToCollect: [],
      questionTemplate: "",
      validationPattern: null,
      completed: false,
      skipped: false,
      collectedData: {},
      errorMessage: null,
    },
    {
      id: "inform_result",
      label: "Informar resultado",
      description: "Confirmar al usuario que la campaña fue enviada",
      type: "inform",
      toolRequired: null,
      toolArgs: null,
      paramsToCollect: [],
      questionTemplate: "",
      validationPattern: null,
      completed: false,
      skipped: false,
      collectedData: {},
      errorMessage: null,
    },
  ];
}

function buildAppointmentWorkflow(store: any): WorkflowStep[] {
  return [
    {
      id: "get_service",
      label: "Obtener servicio",
      description: "Detectar o pedir el servicio",
      type: "collect_info",
      toolRequired: null,
      toolArgs: null,
      paramsToCollect: ["serviceName"],
      questionTemplate: "¿Qué servicio te interesa? Nuestros servicios son: **{services}**.",
      validationPattern: null,
      completed: false,
      skipped: false,
      collectedData: {},
      errorMessage: null,
    },
    {
      id: "get_name",
      label: "Obtener nombre",
      description: "Pedir nombre del cliente",
      type: "collect_info",
      toolRequired: null,
      toolArgs: null,
      paramsToCollect: ["customerName"],
      questionTemplate: "¿Cuál es tu **nombre** completo?",
      validationPattern: null,
      completed: false,
      skipped: false,
      collectedData: {},
      errorMessage: null,
    },
    {
      id: "get_email",
      label: "Obtener email",
      description: "Pedir email del cliente",
      type: "collect_info",
      toolRequired: null,
      toolArgs: null,
      paramsToCollect: ["customerEmail"],
      questionTemplate: "¿Cuál es tu **correo electrónico**?",
      validationPattern: /@/,
      completed: false,
      skipped: false,
      collectedData: {},
      errorMessage: "El correo no parece válido. Por favor ingresa un correo como: ejemplo@correo.com",
    },
    {
      id: "get_date",
      label: "Obtener fecha",
      description: "Pedir fecha preferida",
      type: "collect_info",
      toolRequired: null,
      toolArgs: null,
      paramsToCollect: ["date"],
      questionTemplate: "¿Qué **fecha** prefieres? (Puedes decir 'hoy', 'mañana', o una fecha específica)",
      validationPattern: null,
      completed: false,
      skipped: false,
      collectedData: {},
      errorMessage: null,
    },
    {
      id: "get_time",
      label: "Obtener hora",
      description: "Pedir hora preferida",
      type: "collect_info",
      toolRequired: null,
      toolArgs: null,
      paramsToCollect: ["time"],
      questionTemplate: "¿A qué **hora** prefieres tu cita?",
      validationPattern: null,
      completed: false,
      skipped: false,
      collectedData: {},
      errorMessage: null,
    },
    {
      id: "confirm_appointment",
      label: "Confirmar cita",
      description: "Mostrar resumen y pedir confirmación",
      type: "confirm",
      toolRequired: null,
      toolArgs: null,
      paramsToCollect: [],
      questionTemplate: "",
      validationPattern: null,
      completed: false,
      skipped: false,
      collectedData: {},
      errorMessage: null,
    },
    {
      id: "create_appointment",
      label: "Crear cita",
      description: "Ejecutar create_appointment",
      type: "execute_tool",
      toolRequired: "create_appointment",
      toolArgs: null,
      paramsToCollect: [],
      questionTemplate: "",
      validationPattern: null,
      completed: false,
      skipped: false,
      collectedData: {},
      errorMessage: null,
    },
    {
      id: "inform_result",
      label: "Informar resultado",
      description: "Confirmar al usuario que la cita fue creada",
      type: "inform",
      toolRequired: null,
      toolArgs: null,
      paramsToCollect: [],
      questionTemplate: "",
      validationPattern: null,
      completed: false,
      skipped: false,
      collectedData: {},
      errorMessage: null,
    },
  ];
}

function buildOrderWorkflow(store: any): WorkflowStep[] {
  return [
    {
      id: "get_items",
      label: "Obtener productos",
      description: "Identificar qué productos quiere el cliente",
      type: "collect_info",
      toolRequired: null,
      toolArgs: null,
      paramsToCollect: ["items"],
      questionTemplate: "¿Qué productos te gustaría ordenar?",
      validationPattern: null,
      completed: false,
      skipped: false,
      collectedData: {},
      errorMessage: null,
    },
    {
      id: "get_name",
      label: "Obtener nombre",
      description: "Pedir nombre del cliente",
      type: "collect_info",
      toolRequired: null,
      toolArgs: null,
      paramsToCollect: ["customerName"],
      questionTemplate: "¿Cuál es tu **nombre**?",
      validationPattern: null,
      completed: false,
      skipped: false,
      collectedData: {},
      errorMessage: null,
    },
    {
      id: "confirm_order",
      label: "Confirmar pedido",
      description: "Mostrar resumen y pedir confirmación",
      type: "confirm",
      toolRequired: null,
      toolArgs: null,
      paramsToCollect: [],
      questionTemplate: "",
      validationPattern: null,
      completed: false,
      skipped: false,
      collectedData: {},
      errorMessage: null,
    },
    {
      id: "create_order",
      label: "Crear pedido",
      description: "Ejecutar create_order",
      type: "execute_tool",
      toolRequired: "create_order",
      toolArgs: null,
      paramsToCollect: [],
      questionTemplate: "",
      validationPattern: null,
      completed: false,
      skipped: false,
      collectedData: {},
      errorMessage: null,
    },
    {
      id: "inform_result",
      label: "Informar resultado",
      description: "Confirmar al usuario que el pedido fue creado",
      type: "inform",
      toolRequired: null,
      toolArgs: null,
      paramsToCollect: [],
      questionTemplate: "",
      validationPattern: null,
      completed: false,
      skipped: false,
      collectedData: {},
      errorMessage: null,
    },
  ];
}

function buildInvoiceWorkflow(store: any): WorkflowStep[] {
  return [
    {
      id: "get_items",
      label: "Obtener conceptos",
      description: "Identificar qué conceptos incluir en la factura",
      type: "collect_info",
      toolRequired: null,
      toolArgs: null,
      paramsToCollect: ["items"],
      questionTemplate: "¿Qué conceptos incluir en la factura? Describe los productos o servicios.",
      validationPattern: null,
      completed: false,
      skipped: false,
      collectedData: {},
      errorMessage: null,
    },
    {
      id: "get_amount",
      label: "Obtener monto",
      description: "Pedir monto total",
      type: "collect_info",
      toolRequired: null,
      toolArgs: null,
      paramsToCollect: ["amount"],
      questionTemplate: "¿Cuál es el **monto total**?",
      validationPattern: /\d/,
      completed: false,
      skipped: false,
      collectedData: {},
      errorMessage: "Necesito un monto numérico. Por ejemplo: 500, 1500, etc.",
    },
    {
      id: "get_client_email",
      label: "Obtener email del cliente",
      description: "Pedir email para enviar la factura",
      type: "collect_info",
      toolRequired: null,
      toolArgs: null,
      paramsToCollect: ["clientEmail"],
      questionTemplate: "¿A qué **correo** envío la factura?",
      validationPattern: /@/,
      completed: false,
      skipped: false,
      collectedData: {},
      errorMessage: "El correo no parece válido. Por favor ingresa un correo como: ejemplo@correo.com",
    },
    {
      id: "confirm_invoice",
      label: "Confirmar factura",
      description: "Mostrar resumen y pedir confirmación",
      type: "confirm",
      toolRequired: null,
      toolArgs: null,
      paramsToCollect: [],
      questionTemplate: "",
      validationPattern: null,
      completed: false,
      skipped: false,
      collectedData: {},
      errorMessage: null,
    },
    {
      id: "create_invoice",
      label: "Crear factura",
      description: "Ejecutar create_invoice + send_invoice_email",
      type: "execute_tool",
      toolRequired: "create_invoice",
      toolArgs: null,
      paramsToCollect: [],
      questionTemplate: "",
      validationPattern: null,
      completed: false,
      skipped: false,
      collectedData: {},
      errorMessage: null,
    },
    {
      id: "inform_result",
      label: "Informar resultado",
      description: "Confirmar al usuario que la factura fue enviada",
      type: "inform",
      toolRequired: null,
      toolArgs: null,
      paramsToCollect: [],
      questionTemplate: "",
      validationPattern: null,
      completed: false,
      skipped: false,
      collectedData: {},
      errorMessage: null,
    },
  ];
}

function buildPaymentWorkflow(store: any): WorkflowStep[] {
  return [
    {
      id: "get_amount",
      label: "Obtener monto",
      description: "Pedir monto del pago",
      type: "collect_info",
      toolRequired: null,
      toolArgs: null,
      paramsToCollect: ["amount"],
      questionTemplate: "¿Cuál es el **monto** a cobrar?",
      validationPattern: /\d/,
      completed: false,
      skipped: false,
      collectedData: {},
      errorMessage: "Necesito un monto numérico. Por ejemplo: 500, 1500, etc.",
    },
    {
      id: "get_description",
      label: "Obtener descripción",
      description: "Pedir descripción del pago",
      type: "collect_info",
      toolRequired: null,
      toolArgs: null,
      paramsToCollect: ["description"],
      questionTemplate: "¿Cuál es la **descripción** del pago? (Ejemplo: 'Compra de producto X')",
      validationPattern: null,
      completed: false,
      skipped: false,
      collectedData: {},
      errorMessage: null,
    },
    {
      id: "get_email",
      label: "Obtener email",
      description: "Pedir email del cliente",
      type: "collect_info",
      toolRequired: null,
      toolArgs: null,
      paramsToCollect: ["customerEmail"],
      questionTemplate: "¿A qué **correo** envío el link de pago?",
      validationPattern: /@/,
      completed: false,
      skipped: false,
      collectedData: {},
      errorMessage: "El correo no parece válido.",
    },
    {
      id: "confirm_payment",
      label: "Confirmar pago",
      description: "Mostrar resumen y pedir confirmación",
      type: "confirm",
      toolRequired: null,
      toolArgs: null,
      paramsToCollect: [],
      questionTemplate: "",
      validationPattern: null,
      completed: false,
      skipped: false,
      collectedData: {},
      errorMessage: null,
    },
    {
      id: "create_checkout",
      label: "Crear link de pago",
      description: "Ejecutar create_checkout",
      type: "execute_tool",
      toolRequired: "create_checkout",
      toolArgs: null,
      paramsToCollect: [],
      questionTemplate: "",
      validationPattern: null,
      completed: false,
      skipped: false,
      collectedData: {},
      errorMessage: null,
    },
    {
      id: "inform_result",
      label: "Informar resultado",
      description: "Entregar link de pago al usuario",
      type: "inform",
      toolRequired: null,
      toolArgs: null,
      paramsToCollect: [],
      questionTemplate: "",
      validationPattern: null,
      completed: false,
      skipped: false,
      collectedData: {},
      errorMessage: null,
    },
  ];
}

function buildCustomerRegistrationWorkflow(store: any): WorkflowStep[] {
  return [
    {
      id: "get_name",
      label: "Obtener nombre",
      description: "Pedir nombre del cliente",
      type: "collect_info",
      toolRequired: null,
      toolArgs: null,
      paramsToCollect: ["name"],
      questionTemplate: "¿Cuál es el **nombre** completo del cliente?",
      validationPattern: null,
      completed: false,
      skipped: false,
      collectedData: {},
      errorMessage: null,
    },
    {
      id: "get_email",
      label: "Obtener email",
      description: "Pedir email del cliente",
      type: "collect_info",
      toolRequired: null,
      toolArgs: null,
      paramsToCollect: ["email"],
      questionTemplate: "¿Cuál es su **correo electrónico**?",
      validationPattern: /@/,
      completed: false,
      skipped: false,
      collectedData: {},
      errorMessage: "El correo no parece válido.",
    },
    {
      id: "get_phone",
      label: "Obtener teléfono",
      description: "Pedir teléfono (opcional)",
      type: "collect_info",
      toolRequired: null,
      toolArgs: null,
      paramsToCollect: ["phone"],
      questionTemplate: "¿Cuál es su **teléfono**? (Opcional, puedes escribir 'saltar')",
      validationPattern: null,
      completed: false,
      skipped: false,
      collectedData: {},
      errorMessage: null,
    },
    {
      id: "confirm_registration",
      label: "Confirmar registro",
      description: "Mostrar resumen y pedir confirmación",
      type: "confirm",
      toolRequired: null,
      toolArgs: null,
      paramsToCollect: [],
      questionTemplate: "",
      validationPattern: null,
      completed: false,
      skipped: false,
      collectedData: {},
      errorMessage: null,
    },
    {
      id: "create_customer",
      label: "Registrar cliente",
      description: "Ejecutar create_customer",
      type: "execute_tool",
      toolRequired: "create_customer",
      toolArgs: null,
      paramsToCollect: [],
      questionTemplate: "",
      validationPattern: null,
      completed: false,
      skipped: false,
      collectedData: {},
      errorMessage: null,
    },
    {
      id: "inform_result",
      label: "Informar resultado",
      description: "Confirmar al usuario que el cliente fue registrado",
      type: "inform",
      toolRequired: null,
      toolArgs: null,
      paramsToCollect: [],
      questionTemplate: "",
      validationPattern: null,
      completed: false,
      skipped: false,
      collectedData: {},
      errorMessage: null,
    },
  ];
}

function buildAvailabilityWorkflow(store: any): WorkflowStep[] {
  return [
    {
      id: "get_date",
      label: "Obtener fecha",
      description: "Pedir fecha para consultar disponibilidad",
      type: "collect_info",
      toolRequired: null,
      toolArgs: null,
      paramsToCollect: ["date"],
      questionTemplate: "¿Para qué **fecha** quieres consultar disponibilidad?",
      validationPattern: null,
      completed: false,
      skipped: false,
      collectedData: {},
      errorMessage: null,
    },
    {
      id: "check_slots",
      label: "Consultar disponibilidad",
      description: "Ejecutar check_available_slots",
      type: "execute_tool",
      toolRequired: "check_available_slots",
      toolArgs: null,
      paramsToCollect: [],
      questionTemplate: "",
      validationPattern: null,
      completed: false,
      skipped: false,
      collectedData: {},
      errorMessage: null,
    },
    {
      id: "inform_result",
      label: "Mostrar resultados",
      description: "Presentar horarios disponibles al usuario",
      type: "inform",
      toolRequired: null,
      toolArgs: null,
      paramsToCollect: [],
      questionTemplate: "",
      validationPattern: null,
      completed: false,
      skipped: false,
      collectedData: {},
      errorMessage: null,
    },
  ];
}

// ── Intent → Workflow mapping ──

const INTENT_WORKFLOW_MAP: Record<string, string> = {
  create_appointment: "appointment",
  cancel_appointment: "cancel_appointment",
  create_order: "order",
  create_customer: "customer_registration",
  request_payment: "payment",
  check_availability: "availability",
};

// Explicit trigger phrases that START a workflow
const WORKFLOW_TRIGGERS: Record<string, string[]> = {
  campaign: ["crear campaña", "enviar campaña", "nueva campaña", "campaign", "send campaign", "create campaign"],
  appointment: ["agendar cita", "reservar cita", "quiero una cita", "necesito agendar", "book appointment", "schedule appointment"],
  order: ["hacer pedido", "quiero pedir", "crear pedido", "ordenar", "make order", "place order"],
  customer_registration: ["registrar cliente", "crear cliente", "registrar", "register customer"],
  payment: ["cobrar", "generar link de pago", "crear link de pago", "facturar", "generate payment", "create checkout"],
  availability: ["ver disponibilidad", "consultar horarios", "hay espacio", "check availability"],
};

// ── Tool → Workflow scope ──

const TOOL_WORKFLOW_SCOPE: Record<string, string[]> = {
  create_appointment: ["appointment", "cancel_appointment"],
  cancel_appointment: ["cancel_appointment"],
  update_appointment: ["appointment"],
  check_available_slots: ["appointment", "availability"],
  create_order: ["order"],
  update_order_status: ["order"],
  create_customer: ["customer_registration"],
  create_checkout: ["payment"],
  create_invoice: ["invoice"],
  send_invoice_email: ["invoice"],
  send_campaign: ["campaign"],
  list_appointments: ["appointment", "cancel_appointment", "availability"],
  list_services: ["appointment", "order"],
  list_orders: ["order"],
  get_analytics: ["*"],
  getCurrentDateTime: ["*"],
  send_email: ["*"],
};

// ── WorkflowManager class ──

export class WorkflowManager {
  private state: WorkflowState | null = null;

  static deserialize(data: string | null): WorkflowManager {
    const manager = new WorkflowManager();
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

  getState(): WorkflowState | null {
    return this.state;
  }

  getSnapshot(): WorkflowSnapshot {
    if (!this.state) {
      return { isActive: false, type: null, description: null, progress: 0, currentStep: null, currentStepIndex: 0, totalSteps: 0, collectedData: {}, status: "idle" };
    }
    const completed = this.state.steps.filter(s => s.completed).length;
    const total = this.state.steps.length;
    const current = this.state.steps[this.state.currentStepIndex];

    return {
      isActive: !["idle", "completed", "cancelled", "failed"].includes(this.state.status),
      type: this.state.type,
      description: this.state.description,
      progress: total > 0 ? Math.round((completed / total) * 100) : 0,
      currentStep: current?.label || null,
      currentStepIndex: this.state.currentStepIndex,
      totalSteps: total,
      collectedData: this.state.collectedData,
      status: this.state.status,
    };
  }

  // ── Core: Check if a workflow is active ──

  isActive(): boolean {
    return this.state !== null && !["idle", "completed", "cancelled", "failed"].includes(this.state.status);
  }

  // ── Core: Validate if tool is allowed in current workflow ──

  validateTool(toolName: string): WorkflowValidation {
    if (!this.state || !this.isActive()) {
      return { allowed: true, reason: "No active workflow", action: "continue" };
    }

    // Utility tools always allowed
    const alwaysAllowed = TOOL_WORKFLOW_SCOPE[toolName];
    if (alwaysAllowed && alwaysAllowed.includes("*")) {
      return { allowed: true, reason: "Utility tool", action: "continue" };
    }

    // Check if tool belongs to current workflow
    if (alwaysAllowed && alwaysAllowed.includes(this.state.type)) {
      return { allowed: true, reason: `Tool "${toolName}" is in scope of workflow "${this.state.type}"`, action: "continue" };
    }

    // Tool NOT in scope
    return {
      allowed: false,
      reason: `La herramienta "${toolName}" no pertenece al flujo activo (${this.state.description}).`,
      action: "block",
    };
  }

  // ── Core: Process user message within workflow ──

  processMessage(userMessage: string): {
    action: "continue_collecting" | "advance_step" | "confirm_step" | "execute_step" | "cancel" | "no_workflow";
    question: string | null;
    toolToExecute: { name: string; args: Record<string, any> } | null;
    summary: string | null;
  } {
    if (!this.state || !this.isActive()) {
      return { action: "no_workflow", question: null, toolToExecute: null, summary: null };
    }

    const msg = userMessage.trim();
    const step = this.state.steps[this.state.currentStepIndex];

    // Check for cancel
    if (CANCEL_PATTERN.test(msg)) {
      this.state.status = "cancelled";
      this.state.updatedAt = Date.now();
      return { action: "cancel", question: null, toolToExecute: null, summary: "Flujo cancelado." };
    }

    // Check for explicit topic change
    if (this.state.turnCount > 0 && TOPIC_CHANGE_PATTERN.test(msg)) {
      this.state.status = "cancelled";
      this.state.updatedAt = Date.now();
      return { action: "cancel", question: null, toolToExecute: null, summary: "Flujo cancelado por cambio de tema." };
    }

    this.state.turnCount++;
    this.state.lastUserMessage = msg;
    this.state.updatedAt = Date.now();

    // ── Handle step types ──

    if (step.type === "collect_info") {
      // Check for skip
      const isSkip = /^(saltar|skip|no tengo|nah|no tengo|ommitir|omitir)$/i.test(msg);

      if (isSkip && step.paramsToCollect.length > 0) {
        // Skip this step
        step.completed = true;
        step.skipped = true;
        this.advanceToNextStep();
        const nextStep = this.state.steps[this.state.currentStepIndex];
        return {
          action: "advance_step",
          question: this.buildQuestion(nextStep),
          toolToExecute: null,
          summary: null,
        };
      }

      // Validate input
      if (step.validationPattern && !step.validationPattern.test(msg) && !isSkip) {
        return {
          action: "continue_collecting",
          question: step.errorMessage || "Por favor ingresa un valor válido.",
          toolToExecute: null,
          summary: null,
        };
      }

      // Collect data
      for (const param of step.paramsToCollect) {
        step.collectedData[param] = msg;
        this.state.collectedData[param] = msg;
      }
      step.completed = true;
      this.advanceToNextStep();

      const nextStep = this.state.steps[this.state.currentStepIndex];
      return {
        action: "advance_step",
        question: this.buildQuestion(nextStep),
        toolToExecute: null,
        summary: null,
      };
    }

    if (step.type === "confirm") {
      // Affirmative → confirm
      if (AFFIRMATIVE_PATTERN.test(msg)) {
        step.completed = true;
        this.advanceToNextStep();
        const nextStep = this.state.steps[this.state.currentStepIndex];

        if (nextStep.type === "execute_tool") {
          const toolArgs = this.buildToolArgs(nextStep);
          return {
            action: "execute_step",
            question: null,
            toolToExecute: { name: nextStep.toolRequired!, args: toolArgs },
            summary: null,
          };
        }

        return {
          action: "advance_step",
          question: this.buildQuestion(nextStep),
          toolToExecute: null,
          summary: null,
        };
      }

      // Negative → go back to collect info
      if (/^(no|nop|nope|cancelar|volver|regresar)$/i.test(msg)) {
        // Find last collect_info step that wasn't completed
        for (let i = this.state.currentStepIndex - 1; i >= 0; i--) {
          if (this.state.steps[i].type === "collect_info" && !this.state.steps[i].skipped) {
            this.state.steps[i].completed = false;
            this.state.currentStepIndex = i;
            this.state.steps[this.state.currentStepIndex].completed = false;
            return {
              action: "continue_collecting",
              question: this.buildQuestion(this.state.steps[i]),
              toolToExecute: null,
              summary: null,
            };
          }
        }
      }

      // User is providing new info instead of confirming → treat as answer to confirmation
      return {
        action: "continue_collecting",
        question: `¿Confirmas con los datos actuales? Responde **sí** para confirmar o **no** para corregir.`,
        toolToExecute: null,
        summary: null,
      };
    }

    if (step.type === "execute_tool") {
      const toolArgs = this.buildToolArgs(step);
      return {
        action: "execute_step",
        question: null,
        toolToExecute: { name: step.toolRequired!, args: toolArgs },
        summary: null,
      };
    }

    if (step.type === "inform") {
      step.completed = true;
      this.state.status = "completed";
      this.state.updatedAt = Date.now();
      return {
        action: "no_workflow",
        question: null,
        toolToExecute: null,
        summary: null,
      };
    }

    return { action: "no_workflow", question: null, toolToExecute: null, summary: null };
  }

  // ── Core: Mark tool execution completed ──

  onToolExecuted(toolName: string, result: any): void {
    if (!this.state) return;

    const step = this.state.steps[this.state.currentStepIndex];
    if (step && step.toolRequired === toolName) {
      step.completed = true;
      this.advanceToNextStep();
    }
  }

  // ── Core: Start a new workflow ──

  startWorkflow(type: string, store: any, initialData?: Record<string, any>): WorkflowState | null {
    // Only start if no active workflow
    if (this.isActive()) return null;

    let steps: WorkflowStep[];
    let description: string;

    switch (type) {
      case "campaign":
        steps = buildCampaignCreationWorkflow(store);
        description = "Crear y enviar una campaña";
        break;
      case "appointment":
        steps = buildAppointmentWorkflow(store);
        description = "Agendar una cita";
        break;
      case "order":
        steps = buildOrderWorkflow(store);
        description = "Crear un pedido";
        break;
      case "customer_registration":
        steps = buildCustomerRegistrationWorkflow(store);
        description = "Registrar un nuevo cliente";
        break;
      case "payment":
        steps = buildPaymentWorkflow(store);
        description = "Generar un link de pago";
        break;
      case "availability":
        steps = buildAvailabilityWorkflow(store);
        description = "Consultar disponibilidad";
        break;
      default:
        return null;
    }

    const now = Date.now();
    this.state = {
      id: `wf_${now}`,
      type,
      description,
      status: "active",
      steps,
      currentStepIndex: 0,
      completedSteps: 0,
      totalSteps: steps.length,
      collectedData: initialData || {},
      lastUserMessage: "",
      lastAgentResponse: null,
      lastAgentQuestion: null,
      turnCount: 0,
      maxTurns: 20,
      createdAt: now,
      updatedAt: now,
    };

    // Apply initial data to steps
    if (initialData) {
      for (const step of this.state.steps) {
        if (step.type === "collect_info") {
          for (const param of step.paramsToCollect) {
            if (initialData[param]) {
              step.collectedData[param] = initialData[param];
              step.completed = true;
            }
          }
        }
      }
      // Advance past completed steps
      while (this.state.currentStepIndex < this.state.steps.length && this.state.steps[this.state.currentStepIndex].completed) {
        this.state.currentStepIndex++;
      }
      if (this.state.currentStepIndex >= this.state.steps.length) {
        this.state.status = "completed";
      }
    }

    return this.state;
  }

  // ── Core: Cancel workflow ──

  cancel(): void {
    if (this.state) {
      this.state.status = "cancelled";
      this.state.updatedAt = Date.now();
    }
  }

  // ── Core: Check if user is trying to start a new workflow ──

  detectWorkflowIntent(message: string): string | null {
    const lower = message.toLowerCase();
    for (const [type, triggers] of Object.entries(WORKFLOW_TRIGGERS)) {
      for (const trigger of triggers) {
        if (lower.includes(trigger)) return type;
      }
    }
    return null;
  }

  // ── Core: Check if message is an explicit topic change ──

  isExplicitTopicChange(message: string): boolean {
    return TOPIC_CHANGE_PATTERN.test(message.trim());
  }

  // ── Core: Check if message is a confirmation ──

  isConfirmation(message: string): boolean {
    return AFFIRMATIVE_PATTERN.test(message.trim());
  }

  // ── Core: Check if message is a cancel ──

  isCancel(message: string): boolean {
    return CANCEL_PATTERN.test(message.trim());
  }

  // ── Generate context for system prompt ──

  generateWorkflowContext(): string {
    const snapshot = this.getSnapshot();
    if (!snapshot.isActive || !this.state) return "";

    const lines: string[] = [];
    lines.push("═══ WORKFLOW ACTIVO (FLUJO OBLIGATORIO) ═══");
    lines.push(`Flujo: ${snapshot.description}`);
    lines.push(`Estado: ${snapshot.status.toUpperCase()}`);
    lines.push(`Progreso: ${snapshot.progress}% (${this.state.steps.filter(s => s.completed).length}/${snapshot.totalSteps} pasos)`);
    lines.push("");

    // Step checklist
    lines.push("PASOS DEL FLUJO:");
    for (let i = 0; i < this.state.steps.length; i++) {
      const st = this.state.steps[i];
      const icon = st.completed ? (st.skipped ? "⊘" : "✔") : i === this.state.currentStepIndex ? "▶" : "◻";
      const tag = i === this.state.currentStepIndex ? " ← PASO ACTUAL" : "";
      lines.push(`  ${icon} ${st.label}${tag}`);
    }
    lines.push("");

    // MANDATORY RULES
    lines.push("REGLAS OBLIGATORIAS DEL WORKFLOW:");
    lines.push("1. Mientras exista un workflow activo, DEBES continuar exactamente desde el último paso.");
    lines.push("2. NUNCA vuelvas al inicio. NUNCA preguntes datos que ya fueron proporcionados.");
    lines.push("3. Si el usuario dice 'sí', 'ok', 'adelante', 'perfecto' → confirma el paso pendiente.");
    lines.push("4. NO interpretes respuestas afirmativas como nuevas peticiones.");
    lines.push("5. NO cambies de objetivo mientras el workflow esté activo.");
    lines.push("6. NO ejecutes herramientas que no pertenezcan a este workflow.");
    lines.push("7. Solo inicia un nuevo workflow cuando el anterior termine, se cancele, o el usuario lo indique explícitamente.");
    lines.push("");

    // Current step detail
    const currentStep = this.state.steps[this.state.currentStepIndex];
    if (currentStep) {
      lines.push(`PASO ACTUAL: ${currentStep.label}`);
      if (currentStep.type === "confirm") {
        lines.push("Tipo: CONFIRMACIÓN — El usuario debe confirmar con 'sí' o 'no'.");
        lines.push(`Datos recopilados: ${JSON.stringify(this.state.collectedData)}`);
      }
    }

    // Collected data
    if (Object.keys(this.state.collectedData).length > 0) {
      lines.push("");
      lines.push(`DATOS YA RECOPILADOS (NO volver a preguntar):`);
      for (const [key, value] of Object.entries(this.state.collectedData)) {
        lines.push(`  - ${key}: ${value}`);
      }
    }

    lines.push("═══ FIN WORKFLOW ═══");
    return lines.join("\n");
  }

  // ── Private helpers ──

  private advanceToNextStep(): void {
    if (!this.state) return;

    this.state.completedSteps = this.state.steps.filter(s => s.completed).length;

    // Skip any already-completed steps
    while (this.state.currentStepIndex < this.state.steps.length && this.state.steps[this.state.currentStepIndex].completed) {
      this.state.currentStepIndex++;
    }

    // Check if all steps completed
    if (this.state.currentStepIndex >= this.state.steps.length) {
      this.state.status = "completed";
    }
  }

  private buildQuestion(step: WorkflowStep): string {
    let question = step.questionTemplate;

    // Replace {services} placeholder
    if (question.includes("{services}")) {
      // This would need store context — for now leave it
      question = question.replace("{services}", "los servicios disponibles");
    }

    return question;
  }

  private buildToolArgs(step: WorkflowStep): Record<string, any> {
    const args: Record<string, any> = { ...this.state!.collectedData };

    if (step.toolRequired === "create_appointment") {
      // Map collected data to tool args
      args.customerName = args.customerName || args.name;
      args.customerEmail = args.customerEmail || args.email;
      args.date = args.date;
      args.time = args.time;
      args.serviceName = args.serviceName || args.service;
    }

    if (step.toolRequired === "create_order") {
      args.customerName = args.customerName || args.name;
      args.items = args.items;
    }

    if (step.toolRequired === "create_customer") {
      args.name = args.name;
      args.email = args.email;
      args.phone = args.phone || "";
    }

    if (step.toolRequired === "create_checkout") {
      args.amount = parseFloat(args.amount) || 0;
      args.description = args.description || "Pago";
      args.customerEmail = args.customerEmail || args.email;
    }

    if (step.toolRequired === "create_invoice") {
      args.amount = parseFloat(args.amount) || 0;
      args.description = args.description || args.items;
      args.clientEmail = args.clientEmail || args.email;
    }

    if (step.toolRequired === "check_available_slots") {
      args.date = args.date;
    }

    return args;
  }
}
