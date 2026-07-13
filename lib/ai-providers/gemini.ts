import type { AIProvider, LLMOptions, LLMResponse } from "./index";

export const geminiProvider: AIProvider = {
  config: null as any,

  async chat(options: LLMOptions, credentials: { apiKey: string; baseUrl: string; model: string }): Promise<LLMResponse> {
    const { apiKey, baseUrl, model } = credentials;

    const systemMsg = options.messages.find(m => m.role === "system");
    const otherMsgs = options.messages.filter(m => m.role !== "system");

    const contents = otherMsgs.map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const body: any = {
      contents,
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.max_tokens ?? 4096,
      },
    };

    if (systemMsg) {
      body.systemInstruction = { parts: [{ text: systemMsg.content }] };
    }

    if (options.tools?.length) {
      body.tools = [{
        functionDeclarations: options.tools.map((t: any) => ({
          name: t.function?.name || t.name,
          description: t.function?.description || t.description || "",
          parameters: t.function?.parameters || t.parameters || { type: "object", properties: {} },
        })),
      }];
    }

    const url = `${baseUrl.replace(/\/$/, "")}/models/${model}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini error (${res.status}): ${err}`);
    }

    const data = await res.json();
    const candidate = data.candidates?.[0];
    const parts = candidate?.content?.parts || [];
    const textPart = parts.find((p: any) => p.text);
    const functionPart = parts.find((p: any) => p.functionCall);

    let toolCalls: any[] | undefined;
    if (functionPart) {
      toolCalls = [{
        id: `call_${Date.now()}`,
        type: "function",
        function: {
          name: functionPart.functionCall.name,
          arguments: JSON.stringify(functionPart.functionCall.args),
        },
      }];
    }

    return {
      content: textPart?.text || "",
      model,
      usage: data.usageMetadata ? {
        prompt_tokens: data.usageMetadata.promptTokenCount || 0,
        completion_tokens: data.usageMetadata.candidatesTokenCount || 0,
        total_tokens: data.usageMetadata.totalTokenCount || 0,
      } : undefined,
      tool_calls: toolCalls,
      finish_reason: candidate?.finishReason === "STOP" ? "stop" : candidate?.finishReason,
    };
  },

  async validateCredentials(apiKey: string, baseUrl: string): Promise<boolean> {
    try {
      const url = `${baseUrl.replace(/\/$/, "")}/models?key=${apiKey}`;
      const res = await fetch(url);
      return res.ok;
    } catch {
      return false;
    }
  },
};
