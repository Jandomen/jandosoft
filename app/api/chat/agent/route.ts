import { connectDB } from "@/lib/mongodb";
import { Store } from "@/lib/models/Store";
import ChatUsage from "@/lib/models/ChatUsage";
import WidgetConversation from "@/lib/models/WidgetConversation";
import WidgetMessage from "@/lib/models/WidgetMessage";
import { AI_CONFIG } from "@/lib/ai/config";
import { callLLM, executeTool, AGENT_TOOLS } from "@/lib/ai/agent";
import { filterToolsForCustomer, filterToolsByStoreModules, filterCustomerToolsByStoreModules } from "@/lib/ai/tools";
import { getModulesDescription } from "@/lib/ai/modules";
import { searchKnowledgeBase } from "@/lib/utils";
import { Notification } from "@/lib/models/Notification";
import { injectTimeContext, getServerNow } from "@/lib/ai/time";
import {
  processUserMessage,
  generateTaskContext,
  trackAgentResponse,
  serializeTaskState,
  GoalManager,
  WorkflowManager,
  type TrackerDecision,
} from "@/lib/ai/intent-tracker";
import { contextIsolator, requireIsolation, buildCognitiveContext, injectCognitiveContextHeader } from "@/lib/ai/cognitive";
import { MemoryService } from "@/lib/ai/memory";

const GUEST_MAX_MESSAGES = 70;
const STORE_OWN_PROVIDER_MAX_MESSAGES = 70;
const GUEST_RESET_HOURS = 5;

const CUSTOMER_TOOL_NAMES = new Set([
  "create_appointment",
  "cancel_appointment",
  "list_appointments",
  "check_available_slots",
  "list_services",
  "create_customer",
  "create_order",
  "list_orders",
  "update_order_status",
  "create_checkout",
  "get_analytics",
  "list_payments",
  "getCurrentDateTime",
]);

function getToolsForStoreModules(store: any) {
  const modules = store.modules?.length ? store.modules : ["services"];
  const fullTools = filterToolsByStoreModules(AGENT_TOOLS, modules);
  const customerTools = filterCustomerToolsByStoreModules(
    filterToolsForCustomer(AGENT_TOOLS, CUSTOMER_TOOL_NAMES),
    modules
  );
  return { fullTools, customerTools };
}

async function checkUsage(identifier: string, maxMessages: number = GUEST_MAX_MESSAGES): Promise<{
  allowed: boolean;
  remaining: number;
}> {
  await connectDB();
  const now = getServerNow();
  let usage = await ChatUsage.findOne({ email: identifier });

  if (!usage) {
    usage = await ChatUsage.create({
      email: identifier,
      messageCount: 1,
      lastResetAt: now,
    });
    return { allowed: true, remaining: maxMessages - 1 };
  }

  const hoursSinceReset =
    (now.getTime() - new Date(usage.lastResetAt).getTime()) /
    (1000 * 60 * 60);
  if (hoursSinceReset >= GUEST_RESET_HOURS) {
    usage.messageCount = 1;
    usage.lastResetAt = now;
    await usage.save();
    return { allowed: true, remaining: maxMessages - 1 };
  }

  if (usage.messageCount >= maxMessages) {
    return { allowed: false, remaining: 0 };
  }

  usage.messageCount += 1;
  await usage.save();
  return {
    allowed: true,
    remaining: maxMessages - usage.messageCount,
  };
}

/**
 * Log agent decisions for debugging
 */
function logDecision(decision: TrackerDecision, storeId: string, guestId?: string) {
  for (const log of decision.logs) {
    console.log(
      `[Agent:${storeId}:${guestId || "anon"}] ` +
      `Turn ${log.turn} | ` +
      `Intent: ${log.detectedIntent} (${log.confidence.toFixed(2)}) | ` +
      `Tool: ${log.selectedTool || "none"} | ` +
      `Action: ${log.outcome} | ` +
      `Reasoning: ${log.reasoning.substring(0, 150)}`
    );
  }
}

export async function POST(req: Request) {
  const startTime = Date.now();

  try {
    const body = await req.json();
    const { storeId, message, guestId, taskState: clientTaskState } = body;

    if (!storeId || !message) {
      return Response.json(
        { error: "storeId and message are required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Validate storeId format and load store
    const isValidObjectId = /^[a-fA-F0-9]{24}$/.test(String(storeId));
    if (!isValidObjectId) {
      console.warn(`[Agent:CONTAMINATION] Invalid storeId format: ${storeId}`);
      return Response.json({ error: "Invalid store identifier" }, { status: 400 });
    }

    const store = await Store.findById(storeId).lean();
    if (!store) {
      console.warn(`[Agent:CONTAMINATION] Store not found: ${storeId}`);
      return Response.json({ error: "Store not found" }, { status: 404 });
    }

    // ── Cognitive Context Isolation ──
    const isolateResult = contextIsolator.isolateFromDb(store, storeId);
    const snapshot = requireIsolation(isolateResult, `Agent:${storeId}`);

    const cognitiveCtx = buildCognitiveContext({
      message,
      storeId: isolateResult.storeId,
      snapshot,
      guestId: guestId || undefined,
    });

    console.log(`[Cognitive] Context built for store ${storeId}: ${snapshot.name} | ${snapshot.plan}`);
    // ────────────────────────────────

    const hasOwnAI = !!(store as any).aiProvider?.enabled && (store as any).aiProvider?.provider;
    const effectiveMaxMessages = hasOwnAI ? STORE_OWN_PROVIDER_MAX_MESSAGES : GUEST_MAX_MESSAGES;

    const identifier = guestId ? `guest:${storeId}:${guestId}` : `guest:${storeId}:${Date.now()}`;
    const { allowed, remaining } = await checkUsage(identifier, effectiveMaxMessages);
    if (!allowed) {
      return Response.json(
        {
          error: `Has agotado tus mensajes por ahora. Vuelve en unas horas para seguir conversando.`,
          remaining: 0,
          limitReached: true,
        },
        { status: 429 }
      );
    }

    // ── 0. Reconstruct history from DB (never trust client-sent history) ──
    const actualGuestId = guestId || "anonymous";

    // Load or create the conversation
    const conversation = await WidgetConversation.findOneAndUpdate(
      { storeId: store._id, guestId: actualGuestId },
      { lastMessage: message },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Fetch REAL message history from DB, scoped to this store's conversation
    const dbMessages = await WidgetMessage.find({ conversationId: conversation._id })
      .sort({ createdAt: 1 })
      .limit(50)
      .lean();

    const serverHistory = dbMessages.map((m: any) => ({
      role: m.role,
      content: m.content,
    }));

    // Persist the new user message
    await WidgetMessage.create({
      conversationId: conversation._id,
      role: "user",
      content: message,
    }).catch((e) => console.error("Error saving widget message:", e));

    // Load or create persistent task state for this conversation
    const taskStateStr = (conversation as any).taskState || clientTaskState || null;
    const goalStateStr = (conversation as any).goalState || null;
    const workflowStateStr = (conversation as any).workflowState || null;

    // ── 1. Process intent with Task Planner + Goal Manager + Workflow Manager ──
    const decision = processUserMessage(
      message,
      serverHistory,
      store,
      taskStateStr,
      goalStateStr,
      workflowStateStr
    );

    logDecision(decision, String(storeId), guestId);

    // ── Extract GoalManager and WorkflowManager from decision ──
    const goalManager = decision.goalManager;
    const workflowManager = decision.workflowManager;


    // Helper to persist assistant message + taskState + goalState + workflowState
    const persistResponse = async (text: string, taskStateSerialized: string | null, goalStateSerialized: string | null = null, workflowStateSerialized: string | null = null) => {
      try {
        await WidgetMessage.create({ conversationId: conversation._id, role: "assistant", content: text });
        const update: Record<string, any> = {};
        if (taskStateSerialized) update.taskState = taskStateSerialized;
        if (goalStateSerialized) update.goalState = goalStateSerialized;
        if (workflowStateSerialized) update.workflowState = workflowStateSerialized;
        if (Object.keys(update).length > 0) {
          await WidgetConversation.findByIdAndUpdate(conversation._id, update);
        }
      } catch (e) {
        console.error("Error saving assistant response:", e);
      }
    };

    if (decision.action === "ask_confirmation" && decision.responsePrefix) {
      const updatedState = trackAgentResponse(decision.taskState, decision.responsePrefix);
      const serializedGoal = goalManager?.serialize() || null;
      const serializedWf = workflowManager?.serialize() || null;
      persistResponse(decision.responsePrefix, serializeTaskState(updatedState), serializedGoal, serializedWf);
      return Response.json({
        text: decision.responsePrefix,
        actions: [],
        remaining,
        provider: hasOwnAI ? store.aiProvider.provider : "platform",
        taskState: serializeTaskState(updatedState),
        goalState: serializedGoal,
        workflowState: serializedWf,
        intent: decision.plan?.intent || "unknown",
        logs: decision.logs.map(l => ({
          intent: l.detectedIntent,
          confidence: l.confidence,
          tool: l.selectedTool,
          outcome: l.outcome,
          reasoning: l.reasoning,
        })),
      });
    }

    // ── 3. Handle clarification (affirmative without context) ──
    if (decision.action === "clarify") {
      const clarifyText = "¿En qué puedo ayudarte? Puedo mostrarte nuestros productos, agendar una cita, hacer un pedido o cualquier otra cosa.";
      const serializedGoal = goalManager?.serialize() || null;
      const serializedWf = workflowManager?.serialize() || null;
      persistResponse(clarifyText, serializeTaskState(decision.taskState), serializedGoal, serializedWf);
      return Response.json({
        text: clarifyText,
        actions: [],
        remaining,
        provider: hasOwnAI ? store.aiProvider.provider : "platform",
        taskState: serializeTaskState(decision.taskState),
        goalState: serializedGoal,
        workflowState: serializedWf,
        intent: "unknown",
        logs: decision.logs.map(l => ({
          intent: l.detectedIntent,
          confidence: l.confidence,
          tool: l.selectedTool,
          outcome: l.outcome,
          reasoning: l.reasoning,
        })),
      });
    }

    // ── 4. Build system prompt with task context ──
    const MAX_LIST = AI_CONFIG.maxListItems;
    const allProducts = (store as any).products || [];
    const storeCurrency = (store as any).currency || "USD";
    const currencySymbol = storeCurrency === "EUR" ? "€" : storeCurrency === "GBP" ? "£" : storeCurrency === "MXN" ? "MX$" : storeCurrency === "COP" ? "COL$" : storeCurrency === "ARS" ? "AR$" : storeCurrency === "BRL" ? "R$" : storeCurrency === "JPY" ? "¥" : storeCurrency === "CNY" ? "¥" : "$";
    const productsList = allProducts.length
      ? allProducts.slice(0, MAX_LIST).map((p: any) => `  - ${p.name} | ${currencySymbol}${p.price}${p.desc ? ` | ${p.desc}` : ""}${p.ingredients ? ` | Ingredientes: ${p.ingredients}` : ""}${p.calories ? ` | ${p.calories} cal` : ""}${p.stock !== undefined ? ` | Stock: ${p.stock}` : ""}`).join("\n") +
        (allProducts.length > MAX_LIST ? `\n  ... y ${allProducts.length - MAX_LIST} productos más.` : "")
      : "  (sin productos)";

    const allServices = (store as any).services || [];
    const servicesList = allServices.length
      ? allServices.slice(0, MAX_LIST).map((s: any) => `  - ${s.name} | ${currencySymbol}${s.price} | ${s.desc || ""} | Duración: ${s.duration || 60}min`).join("\n") +
        (allServices.length > MAX_LIST ? `\n  ... y ${allServices.length - MAX_LIST} servicios más.` : "")
      : "  (sin servicios)";

    const kbEntries = (store as any).knowledgebase || [];
    const matchedKb = searchKnowledgeBase(message, kbEntries, 5);
    const kbList = matchedKb.length
      ? matchedKb.map((k: any) => `  - [${k.category || "General"}] ${k.question ? k.question + " → " : ""}${k.title}: ${k.content}`).join("\n")
      : "  (sin información adicional)";

    const paymentIntegrations = (store as any).paymentIntegrations || [];
    const activePayments = paymentIntegrations.filter((p: any) => p.enabled);
    const paymentMethodsList = activePayments.length
      ? activePayments.map((p: any) => {
          const labels: Record<string, string> = {
            stripe: "Tarjeta de crédito/débito (Stripe)", paypal: "PayPal",
            mercadopago: "Mercado Pago (tarjeta, transferencia, QR, cuotas)",
            nowpayments: "Criptomonedas (Bitcoin, Ethereum, USDT y 150+)",
            square: "Square (tarjeta, POS)", razorpay: "Razorpay (UPI, wallets, tarjetas)",
            paystack: "Paystack (tarjeta, transferencia, mobile money)",
            flutterwave: "Flutterwave (tarjeta, transferencia, mobile money)",
            mollie: "Mollie (iDEAL, Bancontact, tarjetas)", paddle: "Paddle (tarjeta, SaaS billing)",
            klarna: "Klarna (Buy Now Pay Later, cuotas sin interés)",
            dlocal: "dLocal (transferencias locales LATAM)",
          };
          return `  - ${labels[p.provider] || p.provider}${p.isDefault ? " [PREDETERMINADO]" : ""}`;
        }).join("\n")
      : "  (sin métodos de pago configurados — la tienda no acepta pagos aún)";

    const integrations = (store as any).integrations || [];
    const activeMessaging = integrations.filter((i: any) => i.enabled && ["telegram", "discord", "slack", "whatsapp", "whatsapp_business", "messenger", "viber", "line", "wechat", "signal", "kakaotalk", "zalo", "microsoft_teams", "rocket_chat", "mattermost", "matrix", "intercom", "zendesk", "livechat", "chatwoot", "helpscout", "hubspot_chat"].includes(i.platform));
    const messagingList = activeMessaging.length
      ? activeMessaging.map((i: any) => {
          const labels: Record<string, string> = {
            telegram: "Telegram", discord: "Discord", slack: "Slack",
            whatsapp: "WhatsApp (vía Twilio)", whatsapp_business: "WhatsApp Business API",
            messenger: "Facebook Messenger", viber: "Viber", line: "LINE",
            wechat: "WeChat", signal: "Signal", kakaotalk: "KakaoTalk", zalo: "Zalo",
            microsoft_teams: "Microsoft Teams", rocket_chat: "Rocket.Chat",
            mattermost: "Mattermost", matrix: "Matrix/Element",
            intercom: "Intercom", zendesk: "Zendesk", livechat: "LiveChat",
            chatwoot: "Chatwoot", helpscout: "Help Scout", hubspot_chat: "HubSpot Chat",
          };
          return `  - ${labels[i.platform] || i.platform}`;
        }).join("\n")
      : "  (sin canales de mensajería conectados)";

    const activeEmail = integrations.filter((i: any) => i.enabled && ["gmail", "sendgrid", "mailchimp", "mailgun", "resend", "amazon_ses", "brevo", "smtp"].includes(i.platform));
    const emailList = activeEmail.length
      ? activeEmail.map((i: any) => {
          const labels: Record<string, string> = {
            gmail: "Gmail", sendgrid: "SendGrid", mailchimp: "Mailchimp",
            mailgun: "Mailgun", resend: "Resend", amazon_ses: "Amazon SES",
            brevo: "Brevo", smtp: "SMTP Genérico",
          };
          return `  - ${labels[i.platform] || i.platform}`;
        }).join("\n")
      : "";

    const aiProvider = (store as any).aiProvider;
    const aiInfo = aiProvider?.enabled
      ? `  - Proveedor: ${aiProvider.provider} | Modelo: ${aiProvider.model || "default"}`
      : "  (usando IA de la plataforma)";

    // ── Centralized time context from server ──
    const timeContext = injectTimeContext(store);

    // ── Generate task context for system prompt ──
    const taskContext = generateTaskContext(decision.taskState, goalManager, workflowManager);

    const cognitiveHeader = injectCognitiveContextHeader(cognitiveCtx);
    const storeModules = (store as any).modules?.length ? (store as any).modules : ["services"];
    const modulesDesc = getModulesDescription(storeModules);

    const systemPrompt = `${cognitiveHeader}

${timeContext}

Eres el asistente virtual de ${(store as any).name}, un negocio en la plataforma Jandosoft.

═══════════════════════════════════════════════
REGLAS DE COMPORTAMIENTO OBLIGATORIAS (14 REGLAS):
═══════════════════════════════════════════════

1. CONTEXTO ACTIVO: Mantén SIEMPRE la última intención del usuario activa hasta que la tarea termine o el usuario cambie claramente de tema. NO cambies de tarea automáticamente.

2. VERIFICACIÓN DE INTENCIÓN: ANTES de ejecutar cualquier herramienta, identifica EXACTAMENTE qué quiere hacer el usuario. Si no estás seguro, pregunta para confirmar.

3. NO ASUMAS INFORMACIÓN: Nunca asumas datos que el usuario no proporcionó. Si el usuario dice "quiero una cita", NO asumes el servicio, la fecha ni la hora.

4. PREGUNTA SOLO LO FALTANTE: Si falta un dato obligatorio, pregunta ÚNICAMENTE por ese dato específico. No mezcles múltiples preguntas.

5. UNA TAREA A LA VEZ: No cambies de tarea automáticamente. Ejecuta una herramienta por cada intención clara, salvo que el usuario pida varias acciones explícitamente.

6. CONFIRMACIÓN PARA ACCIONES DESTRUCTIVAS: NUNCA ejecutes acciones destructivas (cancelar, eliminar, borrar, suspender) sin confirmación explícita del usuario. Primero pregunta: "¿Estás seguro de que quieres [acción]?"

7. LIMPIEZA DESPUÉS DE EJECUTAR: Después de ejecutar una herramienta exitosamente, confirma al usuario qué se hizo y ESPERA nuevas instrucciones. No asumas la siguiente acción.

8. RESPUESTAS AFIRMATIVAS: Si el usuario responde "sí", "ok", "hazlo", "continúa", "adelante" o similar, esa respuesta se aplica ÚNICAMENTE a la ÚLTIMA pregunta que TÚ hiciste. NUNCA la apliques a conversaciones anteriores.

9. CAMBIO DE TEMA: Si el usuario cambia completamente de tema, cancela la tarea anterior silenciosamente y comienza la nueva. No menciones la tarea anterior a menos que el usuario lo pida.

10. COHERENCIA ANTERIOR A VELOCIDAD: Prioriza la coherencia del contexto sobre ejecutar herramientas rápidamente. Es mejor preguntar una vez más que ejecutar algo incorrecto.

11. NO EJECUTES MÚLTIPLES HERRAMIENTAS: Si necesitas ejecutar más de una herramienta, ejecítalas UNA POR UNA y confirma cada resultado antes de continuar.

12. DATOS EN CONTEXTO: Toda la información de productos, servicios y precios ya está en este prompt. NO uses herramientas para consultar datos que ya tienes. Solo usa herramientas para CREAR, ACTUALIZAR o CANCELAR.

13. FORMATO DE RESPUESTA: Responde de forma concisa y clara. Usa listas cuando sea apropiado. Si generas un link de pago, asegúrate de que sea Clicable.

14. SI NO PUEDES ALGO: Si no puedes realizar una acción solicitada, explica por qué brevemente y ofrece una alternativa concreta.

═══════════════════════════════════════════════
INFORMACIÓN DEL NEGOCIO:
═══════════════════════════════════════════════
- Nombre: ${(store as any).name}
- Industria: ${(store as any).industry || "N/A"}
- Tipo: ${(store as any).type || "N/A"}

MÓDULOS ACTIVOS (solo puedes usar herramientas de estos módulos):
${modulesDesc}

PRODUCTOS:
${productsList}

SERVICIOS:
${servicesList}

MÉTODOS DE PAGO DISPONIBLES:
${paymentMethodsList}

CANALES DE MENSAJERÍA CONECTADOS:
${messagingList}
${emailList ? `\nPROVEEDORES DE CORREO:\n${emailList}` : ""}

PROVEEDOR DE IA: ${aiInfo}
MONEDA: ${storeCurrency}

BASE DE CONOCIMIENTO:
${kbList}

═══════════════════════════════════════════════
INSTRUCCIONES ESPECÍFICAS:
═══════════════════════════════════════════════

AGENDAR CITAS (create_appointment):
- Datos requeridos: email del cliente, nombre, fecha, hora, servicio.
- SIEMPRE usa la fecha/hora del servidor (arriba) como referencia. NUNCA inventes fechas.
- Si el cliente dice "hoy", usa la fecha actual del servidor.
- Si dice "mañana", suma 1 día a la fecha del servidor.
- Si dice "próximo lunes", calcula la fecha correcta desde la fecha del servidor.
- Primero pide email y nombre. Si el servicio es claro, no preguntes por él.
- Ejemplo: "Perfecto, para agendar tu cita necesito tu email y nombre."

GENERAR LINK DE PAGO (create_checkout):
- Datos requeridos: email del cliente, monto, descripción.
- Si el cliente quiere comprar algo, pide su email si no lo tienes.
- Cuando recibas el resultado, responde con el link Clicable.
- Si hay error, informa y sugiere contactar al dueño.

CREAR PEDIDO (create_order):
- Datos requeridos: nombre del producto, monto.
- Si el cliente da su nombre, inclúyelo.

MÉTODOS DE PAGO: Solo menciona los que aparecen arriba. Si no hay ninguno, indica que la tienda aún no acepta pagos.

CONFIRMACIÓN DE ACCIONES: Antes de cancelar o eliminar algo, SIEMPRE pregunta: "¿Estás seguro?" y espera confirmación.

CAMBIAR IDIOMA: Si el usuario te pide cambiar el idioma del chat, usa updateAgentConfig con el campo "lang". Idiomas válidos: es, en, fr, zh, hi, ko, ja, it, pt, ru. El cambio se aplica al widget de chat de la tienda.

FECHAS Y HORARIOS: Usa SIEMPRE la fecha/hora del servidor como referencia. Para calcular fechas relativas ("mañana", "próximo lunes", "la próxima semana"), parte de la fecha actual del servidor. Si necesitas verificar la fecha/hora, usa la herramienta getCurrentDateTime.

Responde SIEMPRE en español, de forma amable y profesional. Si no puedes hacer algo, explica brevemente y ofrece alternativas.

${taskContext}`;

    // ── 5. Build messages array with memory + summarization ──
    const memoryService = new MemoryService(`widget:${store._id}`);
    const allHistory = [
      ...serverHistory,
      { role: "user", content: message },
    ];
    const { messages } = await memoryService.buildOptimizedContext({
      systemPrompt,
      allMessages: allHistory,
    });
    // Widen type so tool-calling loop can push tool messages with tool_call_id
    const msgs: any[] = messages as any[];

    // ── 6. Execute tool directly if planner determined it ──
    const actions: any[] = [];
    let finalResponse = "";
    let toolExecuted = "";
    let toolResultStr = "";
    const { fullTools, customerTools } = getToolsForStoreModules(store);

    // If the planner determined a tool should be executed directly (no missing params, no confirmation needed)
    if (decision.action === "execute_tool" && decision.toolToExecute) {
      const { name, args } = decision.toolToExecute;

      // ── TOOL GUARD: Validate tool against current goal and workflow ──
      if (goalManager) {
        const validation = goalManager.validateTool(name, args);
        if (!validation.allowed) {
          console.log(`[GoalGuard] BLOCKED direct tool ${name}: ${validation.reason}`);
          const blockedText = `${validation.reason}${validation.suggestion ? `\n\n${validation.suggestion}` : ""}`;
          const serializedGoal = goalManager.serialize();
          const serializedWf = workflowManager?.serialize() || null;
          persistResponse(blockedText, serializeTaskState(decision.taskState), serializedGoal, serializedWf);
          return Response.json({
            text: blockedText,
            actions: [],
            remaining,
            provider: hasOwnAI ? store.aiProvider.provider : "platform",
            taskState: serializeTaskState(decision.taskState),
            goalState: serializedGoal,
            workflowState: serializedWf,
            intent: decision.plan?.intent || "unknown",
            logs: decision.logs.map(l => ({
              intent: l.detectedIntent,
              confidence: l.confidence,
              tool: l.selectedTool,
              outcome: l.outcome,
              reasoning: l.reasoning,
            })),
          });
        }
      }

      // ── WORKFLOW GUARD: Validate tool against active workflow ──
      if (workflowManager?.isActive()) {
        const wfValidation = workflowManager.validateTool(name);
        if (!wfValidation.allowed) {
          console.log(`[WorkflowGuard] BLOCKED direct tool ${name}: ${wfValidation.reason}`);
          const blockedText = wfValidation.reason;
          const serializedWf = workflowManager.serialize();
          persistResponse(blockedText, serializeTaskState(decision.taskState), goalManager?.serialize() || null, serializedWf);
          return Response.json({
            text: blockedText,
            actions: [],
            remaining,
            provider: hasOwnAI ? store.aiProvider.provider : "platform",
            taskState: serializeTaskState(decision.taskState),
            goalState: goalManager?.serialize() || null,
            workflowState: serializedWf,
            intent: decision.plan?.intent || "unknown",
            logs: decision.logs.map(l => ({
              intent: l.detectedIntent,
              confidence: l.confidence,
              tool: l.selectedTool,
              outcome: l.outcome,
              reasoning: l.reasoning,
            })),
          });
        }
      }

      // Create a synthetic tool call for execution
      const syntheticToolCall = {
        id: `tc_${Date.now()}`,
        function: { name, arguments: JSON.stringify(args) },
      };

      const result = await executeTool(syntheticToolCall as any, store, guestId || "guest");
      toolExecuted = name;
      toolResultStr = JSON.stringify(result);
      actions.push({ tool: name, args, result });

      // ── GOAL STATE: Advance subtask on success ──
      if (goalManager && result?.success !== false) {
        goalManager.advanceSubtask(name, toolResultStr);
      }

      // ── WORKFLOW STATE: Notify workflow of tool execution ──
      if (workflowManager?.isActive()) {
        workflowManager.onToolExecuted(name, result);
      }

      // Send notification for significant actions
      if (result?.success && store?.ownerId) {
        try {
          if (name === "create_appointment") {
            await Notification.create({ type: "appointment", title: "Nueva cita agendada", message: `${args.customerName || "Cliente"} - ${args.date} ${args.time} - ${args.serviceName || "Servicio"}`, userId: String(store.ownerId), storeId: String(store._id), link: "/dashboard" });
          } else if (name === "create_order") {
            await Notification.create({ type: "order", title: "Nuevo pedido recibido", message: `${args.customerName || "Cliente"} - $${args.total || args.amount || 0}`, userId: String(store.ownerId), storeId: String(store._id), link: "/dashboard" });
          } else if (name === "create_customer") {
            await Notification.create({ type: "customer", title: "Nuevo cliente registrado", message: `${args.name || args.customerName || "Cliente"} - ${args.email || ""}`, userId: String(store.ownerId), storeId: String(store._id), link: "/dashboard" });
          }
        } catch (e) { console.error("Notification creation failed:", e); }
      }

      // Add tool result and ask LLM to format a response
      msgs.push({
        role: "system",
        content: `La herramienta "${name}" fue ejecutada exitosamente con resultado: ${toolResultStr}. Ahora responde al usuario confirmando qué se hizo, de forma breve y clara. NO vuelvas a ejecutar ninguna herramienta.`,
      });
    }

    // ── 7. Tool-calling loop (with max 4 additional turns) ──
    for (let turn = 0; turn < 4; turn++) {
      const data = await callLLM(
        msgs,
        customerTools,
        AI_CONFIG.agentMaxTokens,
        AI_CONFIG.temperature,
        store?.aiProvider
      );
      const choice = data.choices?.[0];
      if (!choice) {
        return Response.json({
          text: "Error al obtener respuesta de la IA.",
          remaining,
        });
      }

      const msg = choice.message;

      if (msg.tool_calls && msg.tool_calls.length > 0) {
        // Only execute ONE tool per turn (Rule 7)
        const tc = msg.tool_calls[0];
        msgs.push(msg);

        // ── TOOL GUARD: Validate LLM tool call against current goal ──
        if (goalManager) {
          let llmToolArgs: Record<string, any> = {};
          try { llmToolArgs = JSON.parse(tc.function.arguments); } catch {}
          const validation = goalManager.validateTool(tc.function.name, llmToolArgs);
          if (!validation.allowed) {
            console.log(`[GoalGuard] BLOCKED LLM tool ${tc.function.name}: ${validation.reason}`);
            msgs.push({
              role: "tool",
              tool_call_id: tc.id,
              content: JSON.stringify({ success: false, error: validation.reason, suggestion: validation.suggestion }),
            });
            continue;
          }
        }

        // ── WORKFLOW GUARD: Validate LLM tool call against active workflow ──
        if (workflowManager?.isActive()) {
          const wfValidation = workflowManager.validateTool(tc.function.name);
          if (!wfValidation.allowed) {
            console.log(`[WorkflowGuard] BLOCKED LLM tool ${tc.function.name}: ${wfValidation.reason}`);
            msgs.push({
              role: "tool",
              tool_call_id: tc.id,
              content: JSON.stringify({ success: false, error: wfValidation.reason }),
            });
            continue;
          }
        }

        const result = await executeTool(tc, store, guestId || "guest");
        toolExecuted = tc.function.name;
        toolResultStr = JSON.stringify(result);
        actions.push({
          tool: tc.function.name,
          args: JSON.parse(tc.function.arguments),
          result,
        });

        // Send notification
        if (result?.success && store?.ownerId) {
          const args = JSON.parse(tc.function.arguments);
          try {
            if (tc.function.name === "create_appointment") {
              await Notification.create({ type: "appointment", title: "Nueva cita agendada", message: `${args.customerName || "Cliente"} - ${args.date} ${args.time} - ${args.serviceName || "Servicio"}`, userId: String(store.ownerId), storeId: String(store._id), link: "/dashboard" });
            } else if (tc.function.name === "create_order") {
              await Notification.create({ type: "order", title: "Nuevo pedido recibido", message: `${args.customerName || "Cliente"} - $${args.total || args.amount || 0}`, userId: String(store.ownerId), storeId: String(store._id), link: "/dashboard" });
            } else if (tc.function.name === "create_customer") {
              await Notification.create({ type: "customer", title: "Nuevo cliente registrado", message: `${args.name || args.customerName || "Cliente"} - ${args.email || ""}`, userId: String(store.ownerId), storeId: String(store._id), link: "/dashboard" });
            }
          } catch (e) { console.error("Notification creation failed:", e); }
        }

        // ── WORKFLOW STATE: Notify workflow of LLM tool execution ──
        if (workflowManager?.isActive()) {
          workflowManager.onToolExecuted(tc.function.name, result);
        }

        msgs.push({
          role: "tool",
          tool_call_id: tc.id,
          content: JSON.stringify(result),
        });
      } else {
        finalResponse = msg.content || "";
        break;
      }
    }

    // ── 8. Update task state after execution ──
    const updatedState = trackAgentResponse(
      decision.taskState,
      finalResponse,
      toolExecuted,
      toolResultStr
    );

    // ── 9. Finalize goal if all subtasks complete ──
    if (goalManager && goalManager.getState()?.status === "completed") {
      goalManager.markCompleted();
    }

    // ── 10. Finalize workflow if completed ──
    if (workflowManager && workflowManager.getState()?.status === "completed") {
      // Workflow already marked complete by processMessage
    }

    // ── 11. Log execution metrics ──
    const duration = Date.now() - startTime;
    const goalSnapshot = goalManager?.getSnapshot();
    console.log(
      `[Agent:${storeId}] Completed in ${duration}ms | ` +
      `Tool: ${toolExecuted || "none"} | ` +
      `Actions: ${actions.length} | ` +
      `Response length: ${finalResponse.length}` +
      (goalSnapshot?.isActive ? ` | Goal: ${goalSnapshot.progress}%` : "")
    );

    const serializedTaskState = serializeTaskState(updatedState);
    const serializedGoal = goalManager?.serialize() || null;
    const serializedWf = workflowManager?.serialize() || null;
    persistResponse(finalResponse || "Acción completada.", serializedTaskState, serializedGoal, serializedWf);

    const usedProvider = hasOwnAI ? store.aiProvider.provider : "platform";

    return Response.json({
      text: finalResponse || "Acción completada.",
      actions,
      remaining,
      provider: usedProvider,
      taskState: serializedTaskState,
      goalState: serializedGoal,
      workflowState: serializedWf,
      intent: decision.plan?.intent || "unknown",
      logs: decision.logs.map(l => ({
        intent: l.detectedIntent,
        confidence: l.confidence,
        tool: l.selectedTool,
        outcome: l.outcome,
        reasoning: l.reasoning,
      })),
    });
  } catch (error: any) {
    const isCreditError = error?.status === 402 || error?.code === "insufficient_quota" || error?.code === "insufficient_credits";
    if (isCreditError) {
      console.error("[Agent Route] Credit error:", error?.message || error);
      return Response.json({
        text: "El asistente AI está temporalmente indisponible. Intenta de nuevo más tarde.",
      });
    }
    const isProviderError = error?.status >= 500 || error?.message?.includes("Provider") || error?.message?.includes("provider");
    if (isProviderError) {
      console.error("[Agent Route] Provider error:", error?.status, error?.message || error);
      return Response.json({
        text: "Estoy un poco lento ahora mismo. Dame un momento y vuelve a escribirme.",
      });
    }
    const isRateLimit = error?.status === 429 || error?.error?.code === "rate_limit_exceeded";
    const isTimeout = error?.code === "ETIMEDOUT" || error?.code === "ECONNRESET" || error?.message?.includes("timeout");
    let errorMsg: string;
    if (isRateLimit) {
      errorMsg = "Demasiadas consultas al mismo tiempo. Espera unos segundos e intenta de nuevo.";
    } else if (isTimeout) {
      errorMsg = "Mi respuesta está tardando más de lo normal. Intenta escribirme de nuevo en unos momentos.";
    } else {
      errorMsg = "No pude procesar tu mensaje ahora mismo. Por favor, intenta de nuevo.";
    }
    console.error("Chat Agent API 500:", error?.message || error);
    return Response.json(
      { error: errorMsg },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { storeId, guestId } = await req.json();
    if (!storeId || !guestId) {
      return Response.json({ error: "storeId and guestId required" }, { status: 400 });
    }

    await connectDB();
    const store = await Store.findById(storeId).lean();
    if (!store) return Response.json({ error: "Store not found" }, { status: 404 });

    const conversation = await WidgetConversation.findOne({ storeId: store._id, guestId });
    if (conversation) {
      await WidgetMessage.deleteMany({ conversationId: conversation._id });
      await WidgetConversation.deleteOne({ _id: conversation._id });
    }

    const ConversationMemory = (await import("@/lib/models/ConversationMemory")).default;
    const ConversationSummary = (await import("@/lib/models/ConversationSummary")).default;
    await ConversationMemory.deleteOne({ storeId: `widget:${store._id}` });
    await ConversationSummary.deleteMany({ storeId: `widget:${store._id}` });

    return Response.json({ success: true, message: "Conversación y memoria eliminadas" });
  } catch (error: any) {
    console.error("Chat Agent DELETE error:", error?.message || error);
    return Response.json({ error: "Error al limpiar conversación" }, { status: 500 });
  }
}
