import { connectDB } from "@/lib/mongodb";
import { Store } from "@/lib/models/Store";
import ChatUsage from "@/lib/models/ChatUsage";
import { AI_CONFIG, trimHistory } from "@/lib/ai/config";
import { callLLM, executeTool, AGENT_TOOLS } from "@/lib/ai/agent";
import { filterToolsForCustomer } from "@/lib/ai/tools";
import { searchKnowledgeBase } from "@/lib/utils";
import { MemoryService } from "@/lib/ai/memory";

const GUEST_MAX_MESSAGES = 10;
const GUEST_RESET_HOURS = 6;

const CUSTOMER_TOOL_NAMES = new Set([
  "create_appointment",
  "cancel_appointment",
  "list_appointments",
  "list_services",
  "create_customer",
  "create_order",
  "list_orders",
  "create_checkout",
]);

const CUSTOMER_TOOLS = filterToolsForCustomer(AGENT_TOOLS, CUSTOMER_TOOL_NAMES);

async function checkUsage(identifier: string): Promise<{
  allowed: boolean;
  remaining: number;
}> {
  await connectDB();
  const now = new Date();
  let usage = await ChatUsage.findOne({ email: identifier });

  if (!usage) {
    usage = await ChatUsage.create({
      email: identifier,
      messageCount: 1,
      lastResetAt: now,
    });
    return { allowed: true, remaining: GUEST_MAX_MESSAGES - 1 };
  }

  const hoursSinceReset =
    (now.getTime() - new Date(usage.lastResetAt).getTime()) /
    (1000 * 60 * 60);
  if (hoursSinceReset >= GUEST_RESET_HOURS) {
    usage.messageCount = 1;
    usage.lastResetAt = now;
    await usage.save();
    return { allowed: true, remaining: GUEST_MAX_MESSAGES - 1 };
  }

  if (usage.messageCount >= GUEST_MAX_MESSAGES) {
    return { allowed: false, remaining: 0 };
  }

  usage.messageCount += 1;
  await usage.save();
  return {
    allowed: true,
    remaining: GUEST_MAX_MESSAGES - usage.messageCount,
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { storeId, message, history, guestId } = body;

    if (!storeId || !message) {
      return Response.json(
        { error: "storeId and message are required" },
        { status: 400 }
      );
    }

    const identifier = guestId ? `guest:${storeId}:${guestId}` : `guest:${storeId}:${Date.now()}`;
    const { allowed, remaining } = await checkUsage(identifier);
    if (!allowed) {
      return Response.json(
        {
          error: `Has alcanzado el límite de ${GUEST_MAX_MESSAGES} mensajes por hora.`,
          remaining: 0,
        },
        { status: 429 }
      );
    }

    await connectDB();
    const store = await Store.findById(storeId).lean();
    if (!store) {
      return Response.json({ error: "Store not found" }, { status: 404 });
    }

    const MAX_LIST = AI_CONFIG.maxListItems;
    const allProducts = (store as any).products || [];
    const productsList = allProducts.length
      ? allProducts.slice(0, MAX_LIST).map((p: any) => `  - ${p.name} | $${p.price}${p.stock ? ` | Stock: ${p.stock}` : ""}`).join("\n") +
        (allProducts.length > MAX_LIST ? `\n  ... y ${allProducts.length - MAX_LIST} productos más.` : "")
      : "  (sin productos)";

    const allServices = (store as any).services || [];
    const servicesList = allServices.length
      ? allServices.slice(0, MAX_LIST).map((s: any) => `  - ${s.name} | $${s.price} | ${s.desc || ""}`).join("\n") +
        (allServices.length > MAX_LIST ? `\n  ... y ${allServices.length - MAX_LIST} servicios más.` : "")
      : "  (sin servicios)";

    const kbEntries = (store as any).knowledgebase || [];
    const matchedKb = searchKnowledgeBase(message, kbEntries, 5);
    const kbList = matchedKb.length
      ? matchedKb
          .map((k: any) => `  - [${k.category || "General"}] ${k.question ? k.question + " → " : ""}${k.title}: ${k.content}`)
          .join("\n")
      : "  (sin información adicional)";

    const now = new Date();
    const dateStr = now.toLocaleDateString("es-MX", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const timeStr = now.toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const systemPrompt = `FECHA OFICIAL DE HOY (USAR ESTA, NO INVENTAR): ${dateStr}. HORA ACTUAL: ${timeStr}.

ATENCIÓN: La fecha de hoy es ${dateStr}. No inventes ni uses otra fecha. Si te preguntan qué día es hoy, responde exactamente "${dateStr}".

Eres el asistente virtual de ${(store as any).name}, un negocio en la plataforma Jandosoft.

INFORMACIÓN DE LA EMPRESA:
- Nombre: ${(store as any).name}
- Industria: ${(store as any).industry || "N/A"}
- Tipo: ${(store as any).type || "N/A"}

PRODUCTOS:
${productsList}

SERVICIOS:
${servicesList}

BASE DE CONOCIMIENTO (Preguntas frecuentes, políticas y respuestas del negocio):
${kbList}

Eres un asistente amable y profesional para los clientes de esta empresa. Tu objetivo es:

1. Ayudar a los clientes a conocer los productos y servicios disponibles.
2. Agendar citas cuando el cliente lo solicite (usa create_appointment).
3. Recibir pedidos de los clientes (usa create_order).
4. Registrar la información del cliente cuando la proporcione (usa create_customer).
5. Generar links de pago si el cliente quiere comprar algo y la empresa tiene Stripe (usa create_checkout).
6. Consultar citas y pedidos disponibles.

IMPORTANTE — CREAR CITAS: Solo necesitas el nombre del cliente, fecha y hora. Si el cliente dice "mañana", "próximo lunes", "hoy", interpreta la fecha implícita y CREA la cita sin pedir más datos. Usa sentido común.

IMPORTANTE — CREAR PEDIDOS: Cuando un cliente quiera comprar un producto, usa create_order con el nombre del producto y el monto. Si el cliente da su nombre, inclúyelo.

IMPORTANTE — LINKS DE PAGO: Si el cliente quiere pagar y la empresa tiene Stripe configurado, usa create_checkout con el email del cliente. Si no tiene Stripe, indícalo amablemente.

Responde siempre en español, de forma amable y profesional. Si no puedes hacer algo, explica por qué y ofrece alternativas.`;

    const messages: any[] = trimHistory([
      { role: "system", content: systemPrompt },
      ...(history || []).map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
      { role: "user", content: message },
    ]);

    const actions: any[] = [];
    let finalResponse = "";

    for (let turn = 0; turn < 5; turn++) {
      const data = await callLLM(
        messages,
        CUSTOMER_TOOLS,
        AI_CONFIG.agentMaxTokens,
        AI_CONFIG.temperature
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
        messages.push(msg);
        for (const tc of msg.tool_calls) {
          const result = await executeTool(tc, store, guestId || "guest");
          actions.push({
            tool: tc.function.name,
            args: JSON.parse(tc.function.arguments),
            result,
          });
          messages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: JSON.stringify(result),
          });
        }
      } else {
        finalResponse = msg.content || "";
        break;
      }
    }

    return Response.json({
      text: finalResponse || "Acción completada.",
      actions,
      remaining,
    });
  } catch (error: any) {
    const isCreditError = error?.status === 402 || error?.code === "insufficient_quota" || error?.code === "insufficient_credits";
    if (isCreditError) {
      console.error("[Agent Route] Credit error:", error?.message || error);
      return Response.json({
        text: "El asistente AI está temporalmente indisponible. Intenta de nuevo más tarde.",
      });
    }
    console.error("Chat Agent API 500:", error?.message || error);
    return Response.json(
      { error: "Error al generar respuesta. Intenta de nuevo." },
      { status: 500 }
    );
  }
}
