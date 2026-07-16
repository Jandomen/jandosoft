const OPENAI_KEY = process.env.OPENAI_API_KEY;
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;

import { AI_CONFIG, trimHistory, trimContextByTokens, shrinkContext, logMetrics } from "@/lib/ai/config";
import { detectDomain, getDomainLabel, type Domain } from "@/lib/ai/router";
import { aiCache, cachedStoreData, invalidateStoreCache } from "@/lib/ai/cache";
import { metrics } from "@/lib/ai/metrics";
import { withToolTimeout, getErrorMessage } from "@/lib/ai/errors";
import { filterToolsByDomain, executeRegisteredTool } from "@/lib/ai/tools";
import { registerAllTools, ALL_TOOLS } from "@/lib/ai/tools/registry";
import { buildContext, type ContextRequest } from "@/lib/ai/context-builder";
import { validateInput, detectPromptInjection } from "@/lib/ai/guardrails";
import { getStoreTimezone, getDateComponents } from "@/lib/ai/time";

registerAllTools();

export const AGENT_TOOLS = ALL_TOOLS;

export async function callLLM(messages: any[], tools?: any[], maxTokens?: number, temperature?: number, storeAIProvider?: any) {
  const mt = maxTokens ?? AI_CONFIG.maxTokens;
  const temp = temperature ?? AI_CONFIG.temperature;
  const startTime = Date.now();

  const safeMessages = trimContextByTokens(messages);

  const options: any = {
    model: AI_CONFIG.model,
    messages: safeMessages,
    max_tokens: mt,
    temperature: temp,
  };
  if (tools) options.tools = tools;

  async function attempt(): Promise<any> {
    // 1) Store's custom AI provider
    if (storeAIProvider?.enabled && storeAIProvider?.provider) {
      try {
        const { callWithStoreAIProvider } = await import("@/lib/ai-providers/registry");
        const result = await callWithStoreAIProvider(storeAIProvider, {
          messages: safeMessages,
          model: storeAIProvider.model || AI_CONFIG.model,
          temperature: temp,
          max_tokens: mt,
          tools,
        });
        return {
          choices: [{ message: { content: result.content, tool_calls: result.tool_calls }, finish_reason: result.finish_reason }],
          model: result.model,
          usage: result.usage,
        };
      } catch (e) {
        console.warn("[callLLM] Store AI provider failed, falling back:", (e as Error).message);
      }
    }

    // 2) Platform OpenAI
    if (OPENAI_KEY) {
      const { default: OpenAI } = await import("openai");
      const client = new OpenAI({ apiKey: OPENAI_KEY });
      const openaiModel = options.model.replace("openai/", "");
      return await client.chat.completions.create({
        ...options,
        model: openaiModel,
      });
    }

    // 3) Platform OpenRouter
    if (OPENROUTER_KEY) {
      const res = await fetch(AI_CONFIG.baseURL + "/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENROUTER_KEY}`,
        },
        body: JSON.stringify(options),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        const error: any = new Error(errBody.error?.message || `HTTP ${res.status}`);
        error.status = res.status;
        error.body = errBody;
        throw error;
      }

      return await res.json();
    }

    throw new Error("No API key configured");
  }

  try {
    const result = await attempt();
    const duration = Date.now() - startTime;
    const usage = result.usage || result?.usage;
    const inputTokens = usage?.prompt_tokens || 0;
    const outputTokens = usage?.completion_tokens || 0;
    logMetrics(options.model, mt, inputTokens, outputTokens, duration);
    return result;
  } catch (err: any) {
    const isCreditError = err?.status === 402 || err?.code === "insufficient_quota" || err?.code === "insufficient_credits";
    const isTokenLimit = isCreditError && (
      err?.message?.includes("Prompt tokens limit exceeded") ||
      err?.body?.error?.message?.includes("Prompt tokens limit exceeded")
    );

    if (isCreditError) {
      if (isTokenLimit) {
        console.warn("[Agent] Prompt tokens limit — shrinking context and retrying");
        options.messages = shrinkContext(options.messages, 0.35);
        options.max_tokens = 200;
        try {
          return await attempt();
        } catch (fallbackErr: any) {
          console.error("[Agent] Shrunk context also failed:", fallbackErr?.message || fallbackErr);
          return {
            choices: [{ message: { content: "El asistente AI está temporalmente indisponible. Intenta de nuevo más tarde." } }],
          };
        }
      } else {
        console.warn("[Agent] 402 / insufficient credits — retrying with max_tokens=256, temp=0.7");
        options.max_tokens = 256;
        options.temperature = 0.7;
        try {
          const result = await attempt();
          const duration = Date.now() - startTime;
          const usage = result.usage || result?.usage;
          const inputTokens = usage?.prompt_tokens || 0;
          const outputTokens = usage?.completion_tokens || 0;
          logMetrics(options.model, 256, inputTokens, outputTokens, duration);
          return result;
        } catch (fallbackErr: any) {
          console.error("[Agent] Retry also failed:", fallbackErr?.message || fallbackErr);
          return {
            choices: [{ message: { content: "El asistente AI está temporalmente indisponible. Intenta de nuevo más tarde." } }],
          };
        }
      }
    }
    throw err;
  }
}

export async function executeTool(toolCall: any, store: any, userId: string) {
  const result = await executeRegisteredTool(toolCall, store, userId);
  invalidateStoreCache(String(store?._id || store?.id));
  return result;
}

export async function askBusinessAI({
  message,
  store,
  history,
}: {
  message: string;
  store: any;
  history?: any[];
}): Promise<string> {
  const domainInfo = detectDomain(message, (history || []).map((h: any) => h.content || ""));
  const ctxReq: ContextRequest = {
    message,
    history: history || [],
    domain: domainInfo.domain,
    secondaryDomains: domainInfo.secondaryDomains,
    isDomainSpecific: domainInfo.domain !== "general" && domainInfo.confidence !== "low",
  };
  const ctx = buildContext(ctxReq, store);

  const messages = trimHistory([
    { role: "system", content: ctx.systemPrompt },
    ...(history || []).map((m: any) => ({ role: m.role, content: m.content })),
    { role: "user", content: message },
  ]);

  const data = await callLLM(messages, undefined, AI_CONFIG.quickMaxTokens, AI_CONFIG.temperature, store?.aiProvider);
  return data.choices?.[0]?.message?.content || "Error al obtener respuesta de la IA.";
}

export async function askBusinessAIWithTools({
  message,
  store,
  history,
  userId,
}: {
  message: string;
  store: any;
  history?: any[];
  userId: string;
}): Promise<{ response: string; actions: any[] }> {
  const startTime = Date.now();
  const domainInfo = detectDomain(message, (history || []).map((h: any) => h.content || ""));
  const isDomainSpecific = domainInfo.domain !== "general" && domainInfo.confidence !== "low";
  const domains: Domain[] = isDomainSpecific
    ? [domainInfo.domain, ...domainInfo.secondaryDomains]
    : ["crm", "booking", "products", "payments", "email", "analytics", "marketing", "admin"];
  const activeTools = isDomainSpecific ? filterToolsByDomain(AGENT_TOOLS, domains) : AGENT_TOOLS;

  const ctxReq: ContextRequest = {
    message,
    history: history || [],
    domain: domainInfo.domain,
    secondaryDomains: domainInfo.secondaryDomains,
    isDomainSpecific,
    domains,
  };
  const ctx = buildContext(ctxReq, store);

  const messages: any[] = trimHistory([
    { role: "system", content: ctx.systemPrompt },
    ...(history || []).map((m: any) => ({ role: m.role, content: m.content })),
    { role: "user", content: message },
  ]);

  const actions: any[] = [];
  let finalResponse = "";

  for (let turn = 0; turn < 5; turn++) {
    const data = await callLLM(messages, activeTools, AI_CONFIG.agentMaxTokens, AI_CONFIG.temperature, store?.aiProvider);
    const choice = data.choices?.[0];
    if (!choice) return { response: "Error al obtener respuesta de la IA.", actions };

    const msg = choice.message;

    if (msg.tool_calls && msg.tool_calls.length > 0) {
      messages.push(msg);
      const appointmentTools = new Set(["create_appointment", "update_appointment", "cancel_appointment"]);
      let modifiedAppointments = false;
      for (const tc of msg.tool_calls) {
        const result = await executeRegisteredTool(tc, store, userId);
        actions.push({ tool: tc.function.name, args: JSON.parse(tc.function.arguments), result });
        invalidateStoreCache(String(store?._id || store?.id));
        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: JSON.stringify(result),
        });
        if (appointmentTools.has(tc.function.name)) modifiedAppointments = true;
      }
      if (modifiedAppointments) {
        try {
          const { connectDB } = await import("@/lib/mongodb");
          const { Appointment: AppointmentModel } = await import("@/lib/models/Appointment");
          await connectDB();
          const storeId = store?._id || store?.id;
          const tz = getStoreTimezone(store);
          const todayStr = getDateComponents(tz).dateISO;
          let refreshedAppointments: any[] = [];
          if (store?._stores?.length) {
            const allStoreIds = store._stores.map((s: any) => s._id);
            refreshedAppointments = await AppointmentModel.find({ storeId: { $in: allStoreIds } })
              .sort({ date: 1, time: 1 }).limit(100).lean();
          } else if (storeId) {
            refreshedAppointments = await AppointmentModel.find({ storeId })
              .sort({ date: 1, time: 1 }).limit(50).lean();
          }
          const todayApps = refreshedAppointments.filter((a: any) => a.date === todayStr);
          const upcomingApps = refreshedAppointments.filter((a: any) => a.date >= todayStr);
          const refreshLines = [
            `📅 CITAS TOTALES (${refreshedAppointments.length}):`,
            refreshedAppointments.map((a: any) =>
              `  - ${a.customerInfo?.name || "Sin nombre"} | ${a.service?.name || "Sin servicio"} | ${a.date} ${a.time} | ${a.status}`
            ).join("\n") || "  (ninguna)",
            ``,
            `📋 AGENDA DE HOY (${todayApps.length}):`,
            todayApps.map((a: any) =>
              `  - ${a.time} ${a.customerInfo?.name || "Sin nombre"} — ${a.service?.name || "Sin servicio"} (${a.status})`
            ).join("\n") || "  (sin citas hoy)",
            ``,
            `⏭️ PRÓXIMAS CITAS (${upcomingApps.length}):`,
            upcomingApps.map((a: any) =>
              `  - ${a.date} ${a.time} — ${a.customerInfo?.name || "Sin nombre"} — ${a.service?.name || "Sin servicio"} (${a.status})`
            ).join("\n") || "  (ninguna)",
          ].join("\n");
          messages.splice(0, 0, { role: "system", content: `[AGENDA ACTUALIZADA — ${todayStr}]:\n${refreshLines}` });
        } catch (e) {
          // refresh failed, continue with stale data
        }
      }
    } else {
      finalResponse = msg.content || "";
      break;
    }
  }

  const duration = Date.now() - startTime;
  const toolsUsed = actions.map((a: any) => a.tool);
  metrics.recordRequest({
    domain: domainInfo.domain,
    durationMs: duration,
    inputTokens: 0,
    outputTokens: 0,
    toolsUsed,
  });

  return { response: finalResponse || "Acción completada.", actions };
}
