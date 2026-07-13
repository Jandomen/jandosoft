import type { AIProvider, LLMOptions, LLMResponse } from "./index";

export const anthropicProvider: AIProvider = {
  config: null as any,

  async chat(options: LLMOptions, credentials: { apiKey: string; baseUrl: string; model: string }): Promise<LLMResponse> {
    const { apiKey, baseUrl, model } = credentials;

    const systemMsg = options.messages.find(m => m.role === "system");
    const otherMsgs = options.messages.filter(m => m.role !== "system");

    const messages = otherMsgs.map(m => ({
      role: m.role === "tool" ? "user" : m.role,
      content: m.content,
    }));

    const body: any = {
      model: model,
      max_tokens: options.max_tokens ?? 4096,
      messages,
    };
    if (systemMsg) body.system = systemMsg.content;
    if (options.temperature !== undefined) body.temperature = options.temperature;

    if (options.tools?.length) {
      body.tools = options.tools.map((t: any) => ({
        name: t.function?.name || t.name,
        description: t.function?.description || t.description || "",
        input_schema: t.function?.parameters || t.parameters || { type: "object", properties: {} },
      }));
    }

    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Anthropic error (${res.status}): ${err}`);
    }

    const data = await res.json();
    const textContent = data.content?.find((c: any) => c.type === "text");
    const toolUse = data.content?.find((c: any) => c.type === "tool_use");

    let toolCalls: any[] | undefined;
    if (toolUse) {
      toolCalls = [{
        id: toolUse.id,
        type: "function",
        function: {
          name: toolUse.name,
          arguments: JSON.stringify(toolUse.input),
        },
      }];
    }

    return {
      content: textContent?.text || "",
      model: data.model || model,
      usage: data.usage ? {
        prompt_tokens: data.usage.input_tokens || 0,
        completion_tokens: data.usage.output_tokens || 0,
        total_tokens: (data.usage.input_tokens || 0) + (data.usage.output_tokens || 0),
      } : undefined,
      tool_calls: toolCalls,
      finish_reason: data.stop_reason === "end_turn" ? "stop" : data.stop_reason,
    };
  },

  async validateCredentials(apiKey: string, baseUrl: string): Promise<boolean> {
    try {
      const res = await fetch(`${baseUrl.replace(/\/$/, "")}/v1/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-5-haiku-20241022",
          max_tokens: 10,
          messages: [{ role: "user", content: "hi" }],
        }),
      });
      return res.ok || res.status === 400;
    } catch {
      return false;
    }
  },
};
