/* eslint-disable @typescript-eslint/no-explicit-any */
export type IntentType =
  | "query_products"
  | "query_services"
  | "query_prices"
  | "query_info"
  | "create_appointment"
  | "cancel_appointment"
  | "reschedule_appointment"
  | "create_order"
  | "update_order"
  | "create_customer"
  | "request_payment"
  | "check_availability"
  | "ask_about_business"
  | "greeting"
  | "farewell"
  | "unknown";

export type TaskStatus =
  | "idle"
  | "planning"
  | "collecting_info"
  | "awaiting_confirmation"
  | "executing"
  | "completed"
  | "failed";

export type DestructiveAction =
  | "delete"
  | "cancel"
  | "remove"
  | "suspend"
  | "deactivate"
  | "destroy";

export interface TaskPlan {
  intent: IntentType;
  confidence: number;
  requiredParams: string[];
  providedParams: Record<string, any>;
  missingParams: string[];
  toolToCall: string | null;
  toolArgs: Record<string, any>;
  needsConfirmation: boolean;
  confirmationMessage: string | null;
  isDestructive: boolean;
  reasoning: string;
}

export interface TaskState {
  id: string;
  status: TaskStatus;
  plan: TaskPlan | null;
  pendingConfirmation: boolean;
  lastAgentQuestion: string | null;
  conversationTopic: string;
  turnCount: number;
  lastToolExecuted: string | null;
  lastToolResult: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentLog {
  timestamp: Date;
  turn: number;
  userInput: string;
  detectedIntent: IntentType;
  confidence: number;
  selectedTool: string | null;
  reasoning: string;
  outcome: "executed" | "asked_for_info" | "asked_confirmation" | "clarified" | "skipped";
  toolResult?: string;
  duration?: number;
}

const AFFIRMATIVE_PATTERNS = /^(sí|si|ok|dale|hazlo|continúa|continua|adelante|yes|sure|go ahead|do it|perfecto|bien|correcto|exacto|así es|ok?|claro|por favor|dale|confirmo|confirmar|adelante|vamos|hágalo|hagalo|procede|proceder)$/i;

const DESTRUCTIVE_KEYWORDS: Record<DestructiveAction, string[]> = {
  delete: ["eliminar", "borrar", "delete", "remove", "suprimir"],
  cancel: ["cancelar", "anular", "cancel", "void"],
  remove: ["remover", "quitar", "retirar", "remove", "take away"],
  suspend: ["suspender", "desactivar temporalmente", "suspend", "pause"],
  deactivate: ["desactivar", "inhabilitar", "deactivate", "disable"],
  destroy: ["destruir", "destroy", "wipe"],
};

const INTENT_KEYWORDS: Record<IntentType, string[]> = {
  query_products: ["producto", "productos", "menu", "menú", "platillo", "plato", "comida", "catalogo", "catálogo", "what do you have", "qué tienen", "qué hay", "show me", "muéstrame", "artículos", "items"],
  query_services: ["servicio", "servicios", "service", "appointment", "cita", "reservar", "booking", "agendar"],
  query_prices: ["precio", "precios", "price", "cost", "costo", "cuánto", "how much", "vale", "cuesta"],
  query_info: ["información", "info", "dirección", "horario", "hours", "location", "dónde", "where", "cuándo", "when", "teléfono", "phone", "contacto", "contact"],
  create_appointment: ["agendar", "citar", "reservar cita", "book appointment", "schedule", "quiero una cita", "necesito agendar", "make appointment", "programar"],
  cancel_appointment: ["cancelar cita", "cancel appointment", "no quiero la cita", "anular cita"],
  reschedule_appointment: ["cambiar cita", "reprogramar", "reschedule", "mover cita", "cambiar fecha"],
  create_order: ["orden", "pedido", "order", "quisiera", "quiero llevar", "pedir", "comprar", "to go", "llevar", "para llevar", "domicilio", "delivery"],
  update_order: ["cambiar pedido", "modify order", "agregar", "quitar del pedido", "add to order"],
  create_customer: ["registrar", "registro", "register", "datos", "information", "mi nombre", "my name", "crear cliente"],
  request_payment: ["pagar", "pago", "pay", "payment", "factura", "bill", "cuenta", "check", "tarjeta", "card", "stripe", "link de pago"],
  check_availability: ["disponible", "available", "hay lugar", "hay espacio", "libre", "free", "horarios disponibles"],
  ask_about_business: ["sobre ustedes", "about you", "qué hacen", "qué ofrecen", "qué es", "what is", "tell me about"],
  greeting: ["hola", "hello", "hi", "buenos días", "buenas tardes", "buenas noches", "hey", "saludos"],
  farewell: ["adiós", "adios", "bye", "hasta luego", "nos vemos", "goodbye", "see you", "chao"],
  unknown: [],
};

export function detectIntent(message: string): { intent: IntentType; confidence: number } {
  const lower = message.toLowerCase().trim();
  let bestIntent: IntentType = "unknown";
  let bestScore = 0;

  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS) as [IntentType, string[]][]) {
    if (intent === "unknown") continue;
    let score = 0;
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        score += keyword.split(" ").length;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestIntent = intent;
    }
  }

  const confidence = bestScore === 0 ? 0 : Math.min(1, 0.3 + bestScore * 0.2);

  return { intent: bestIntent, confidence };
}

export function isAffirmative(message: string): boolean {
  return AFFIRMATIVE_PATTERNS.test(message.trim());
}

export function isTopicChange(
  currentIntent: IntentType,
  newIntent: IntentType,
  currentTopic: string,
  newMessage: string,
  currentStatus?: TaskStatus,
): boolean {
  // Never consider it a topic change if we're in the middle of collecting info
  if (currentStatus === "collecting_info" || currentStatus === "awaiting_confirmation") {
    return false;
  }
  if (currentIntent === "unknown" || currentIntent === "greeting" || currentIntent === "farewell") return false;
  if (newIntent === "greeting" || newIntent === "farewell") return false;
  if (currentIntent === newIntent) return false;

  const { confidence } = detectIntent(newMessage);
  return confidence > 0.5;
}

export function detectDestructiveAction(message: string, intent: IntentType): DestructiveAction | null {
  const lower = message.toLowerCase();

  if (intent === "cancel_appointment") return "cancel";

  for (const [action, keywords] of Object.entries(DESTRUCTIVE_KEYWORDS) as [DestructiveAction, string[]][]) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) return action;
    }
  }
  return null;
}

export function generateTaskPlan(
  message: string,
  history: any[],
  store: any,
  currentState: TaskState | null
): TaskPlan {
  const { intent, confidence } = detectIntent(message);
  const destructiveAction = detectDestructiveAction(message, intent);
  const affirmative = isAffirmative(message);

  // If it's an affirmation and we have a pending confirmation, remove confirmation flag
  if (affirmative && currentState?.plan && currentState.status === "awaiting_confirmation") {
    return {
      ...currentState.plan,
      needsConfirmation: false,
      confidence: 1,
      reasoning: "User confirmed previous action with affirmative response",
    };
  }

  // If plan exists and we're collecting info, merge new info from the message
  if (currentState?.plan && (currentState.status === "collecting_info" || currentState.status === "executing")) {
    const mergedPlan = mergePlanWithMessage(currentState.plan, message, store);
    return mergedPlan;
  }

  // If it's an affirmation and agent asked a question, reuse current plan
  if (affirmative && currentState?.lastAgentQuestion && currentState?.plan) {
    return {
      ...currentState.plan,
      confidence: 0.8,
      providedParams: { ...currentState.plan.providedParams, affirmative: true },
      reasoning: `Affirmative response to agent question: "${currentState.lastAgentQuestion}"`,
    };
  }

  // Build new plan from scratch
  const plan = buildPlanForIntent(intent, message, store, destructiveAction);
  plan.confidence = confidence;
  return plan;
}

function mergePlanWithMessage(plan: TaskPlan, message: string, store: any): TaskPlan {
  const mergedProvided = { ...plan.providedParams };
  const lower = message.toLowerCase();

  // Extract customer name
  const namePatterns = [
    /(?:mi nombre es |me llamo |soy |name is |i am |i'm )(.+?)(?:\.|,|$| y )/i,
    /(.+?)(?:\s*(?:,|\.|$))(?=.*@|\s*a\s+las|\s*\d{1,2}:)/,
  ];
  for (const pattern of namePatterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim();
      if (name.length > 2 && name.length < 50 && !name.includes("@") && !/^\d/.test(name)) {
        mergedProvided.customerName = name;
        break;
      }
    }
  }

  // Extract email
  const emailMatch = message.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (emailMatch) {
    mergedProvided.customerEmail = emailMatch[1];
  }

  // Extract date
  const datePatterns = [
    /(\d{1,2})\s*de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s*de\s*(\d{4})/i,
    /(\d{1,2})[-/](\d{1,2})[-/](\d{4})/,
    /(\d{4})[-/](\d{1,2})[-/](\d{1,2})/,
    /(\d{1,2})\s*de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i,
  ];
  for (const pattern of datePatterns) {
    const match = message.match(pattern);
    if (match) {
      mergedProvided.date = match[0];
      break;
    }
  }

  // Extract service name from products/services if store is available
  if (store) {
    const allServices = [...(store.services || []), ...(store.products || [])];
    for (const s of allServices) {
      if (lower.includes(s.name?.toLowerCase() || "")) {
        mergedProvided.serviceName = s.name;
        mergedProvided.serviceId = s._id || s.id;
        break;
      }
    }
  }

  // Extract comments or additional info from the message
  const extractionPatterns: Record<string, RegExp> = {
    description: /(?:consulta|asesoría|orientación|sobre|acerca de|tema:?|motivo:?)\s*(.+?)(?:\.|,|$)/i,
  };
  for (const [key, pat] of Object.entries(extractionPatterns)) {
    const match = message.match(pat);
    if (match && match[1]) {
      mergedProvided[key] = match[1].trim();
    }
  }

  // Recalculate missing params
  const newMissing = plan.requiredParams.filter((p) => {
    if (mergedProvided[p]) return false;
    if (p === "customerName" && mergedProvided.customerName) return false;
    if (p === "customerEmail" && mergedProvided.customerEmail) return false;
    if (p === "date" && mergedProvided.date) return false;
    if (p === "serviceId" && mergedProvided.serviceId) return false;
    return true;
  });

  const allParamsFilled = newMissing.length === 0;

  return {
    ...plan,
    providedParams: mergedProvided,
    missingParams: newMissing,
    toolArgs: allParamsFilled ? { ...mergedProvided, intent: plan.intent } : plan.toolArgs,
    needsConfirmation: allParamsFilled ? false : plan.needsConfirmation,
  };
}

function buildPlanForIntent(
  intent: IntentType,
  message: string,
  store: any,
  destructiveAction: DestructiveAction | null
): TaskPlan {
  const base: TaskPlan = {
    intent,
    confidence: 0,
    requiredParams: [],
    providedParams: {},
    missingParams: [],
    toolToCall: null,
    toolArgs: {},
    needsConfirmation: false,
    confirmationMessage: null,
    isDestructive: !!destructiveAction,
    reasoning: "",
  };

  switch (intent) {
    case "query_products":
      return {
        ...base,
        toolToCall: null,
        reasoning: "Query products — information already available in system context. No tool needed.",
      };

    case "query_services":
      return {
        ...base,
        toolToCall: null,
        reasoning: "Query services — information already available in system context. No tool needed.",
      };

    case "query_prices":
      return {
        ...base,
        toolToCall: null,
        reasoning: "Price query — prices are in product/service context. No tool needed.",
      };

    case "create_appointment":
      return {
        ...base,
        requiredParams: ["customerName", "customerEmail", "date", "time", "serviceId"],
        toolToCall: "create_appointment",
        reasoning: "User wants to schedule an appointment. Need to collect all required parameters before calling tool.",
      };

    case "cancel_appointment":
      return {
        ...base,
        isDestructive: true,
        needsConfirmation: true,
        requiredParams: ["appointmentId"],
        toolToCall: "cancel_appointment",
        confirmationMessage: "¿Estás seguro de que quieres cancelar esta cita? Esta acción no se puede deshacer.",
        reasoning: "Destructive action: cancel appointment. Requires explicit confirmation.",
      };

    case "reschedule_appointment":
      return {
        ...base,
        requiredParams: ["appointmentId", "date", "time"],
        toolToCall: "reschedule_appointment",
        reasoning: "User wants to reschedule an appointment. Need appointment ID and new date/time.",
      };

    case "create_order":
      return {
        ...base,
        requiredParams: ["items", "orderType"],
        toolToCall: "create_order",
        reasoning: "User wants to place an order. Need to collect items and order type.",
      };

    case "create_customer":
      return {
        ...base,
        requiredParams: ["name", "email"],
        toolToCall: "create_customer",
        reasoning: "Register new customer. Need name and optionally email/phone.",
      };

    case "request_payment":
      return {
        ...base,
        requiredParams: ["amount", "description"],
        toolToCall: "create_checkout",
        reasoning: "Generate payment link. Need amount and description.",
      };

    case "check_availability":
      return {
        ...base,
        requiredParams: ["date"],
        toolToCall: "check_available_slots",
        reasoning: "Check appointment availability. Need the date.",
      };

    case "greeting":
      return {
        ...base,
        reasoning: "Greeting detected. Respond warmly and ask how to help.",
      };

    case "farewell":
      return {
        ...base,
        reasoning: "Farewell detected. Say goodbye politely.",
      };

    case "unknown":
      return {
        ...base,
        reasoning: "Could not determine intent. Ask for clarification without assuming.",
      };

    default:
      return {
        ...base,
        reasoning: `Intent "${intent}" detected. Evaluate context.`,
      };
  }
}

export function createTaskState(plan: TaskPlan): TaskState {
  return {
    id: `task_${Date.now()}`,
    status: plan.needsConfirmation
      ? "awaiting_confirmation"
      : plan.missingParams.length > 0
      ? "collecting_info"
      : plan.toolToCall
      ? "executing"
      : "planning",
    plan,
    pendingConfirmation: plan.needsConfirmation,
    lastAgentQuestion: null,
    conversationTopic: plan.intent,
    turnCount: 0,
    lastToolExecuted: null,
    lastToolResult: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function updateTaskState(state: TaskState, agentResponse: string, toolExecuted?: string, toolResult?: string): TaskState {
  const updated = { ...state, updatedAt: new Date(), turnCount: state.turnCount + 1 };

  if (toolExecuted) {
    updated.status = "completed";
    updated.lastToolExecuted = toolExecuted;
    updated.lastToolResult = toolResult || null;
    updated.plan = null;
  }

  const questionPatterns = /[¿?](?:\s|$)/;
  if (questionPatterns.test(agentResponse)) {
    updated.lastAgentQuestion = agentResponse;
    if (updated.status === "executing") {
      updated.status = "collecting_info";
    }
  }

  return updated;
}

export function serializeTaskState(state: TaskState | null): string | null {
  if (!state) return null;
  return JSON.stringify({
    id: state.id,
    status: state.status,
    intent: state.plan?.intent || null,
    pendingConfirmation: state.pendingConfirmation,
    lastAgentQuestion: state.lastAgentQuestion,
    conversationTopic: state.conversationTopic,
    turnCount: state.turnCount,
    lastToolExecuted: state.lastToolExecuted,
  });
}

export function deserializeTaskState(data: string | null): TaskState | null {
  if (!data) return null;
  try {
    const parsed = JSON.parse(data);
    return {
      ...parsed,
      plan: null,
      lastToolResult: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  } catch {
    return null;
  }
}
