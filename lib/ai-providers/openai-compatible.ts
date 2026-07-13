import type { AIProvider, LLMOptions, LLMResponse } from "./index";

export function createOpenAICompatibleProvider(providerId: string): AIProvider {
  return {
    config: null as any,
    async chat(options: LLMOptions, credentials: { apiKey: string; baseUrl: string; model: string }): Promise<LLMResponse> {
      const { apiKey, baseUrl, model } = credentials;
      const url = `${baseUrl.replace(/\/$/, "")}/chat/completions`;

      const body: any = {
        model: model,
        messages: options.messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens ?? 4096,
      };
      if (options.tools?.length) {
        body.tools = options.tools;
        if (options.tool_choice) body.tool_choice = options.tool_choice;
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (apiKey) {
        headers["Authorization"] = `Bearer ${apiKey}`;
      }

      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`AI Provider error (${res.status}): ${err}`);
      }

      const data = await res.json();
      const choice = data.choices?.[0];

      return {
        content: choice?.message?.content || "",
        model: data.model || model,
        usage: data.usage,
        tool_calls: choice?.message?.tool_calls,
        finish_reason: choice?.finish_reason,
      };
    },

    async validateCredentials(apiKey: string, baseUrl: string): Promise<boolean> {
      try {
        const url = `${baseUrl.replace(/\/$/, "")}/models`;
        const headers: Record<string, string> = {};
        if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
        const res = await fetch(url, { headers, method: "GET" });
        return res.ok;
      } catch {
        return false;
      }
    },
  };
}
