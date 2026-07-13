import type { AIProvider, LLMOptions, LLMResponse, StoreAIProvider } from "./index";
import { AI_PROVIDERS } from "./index";
import { createOpenAICompatibleProvider } from "./openai-compatible";
import { anthropicProvider } from "./anthropic";
import { geminiProvider } from "./gemini";

const nativeProviders: Record<string, AIProvider> = {
  anthropic: anthropicProvider,
  gemini: geminiProvider,
};

const openAICompatibleIds = ["openai", "openrouter", "ollama", "groq", "deepseek", "custom"];

function getProvider(id: string): AIProvider {
  if (nativeProviders[id]) return nativeProviders[id];
  if (openAICompatibleIds.includes(id)) return createOpenAICompatibleProvider(id);
  throw new Error(`Unknown AI provider: ${id}`);
}

export async function callWithStoreAIProvider(
  storeAIProvider: StoreAIProvider | null | undefined,
  options: LLMOptions
): Promise<LLMResponse> {
  if (!storeAIProvider || !storeAIProvider.enabled) {
    throw new Error("No custom AI provider configured");
  }

  const provider = getProvider(storeAIProvider.provider);
  return provider.chat(options, {
    apiKey: storeAIProvider.apiKey,
    baseUrl: storeAIProvider.baseUrl,
    model: storeAIProvider.model,
  });
}

export async function validateAIProvider(providerId: string, apiKey: string, baseUrl: string): Promise<boolean> {
  try {
    const provider = getProvider(providerId);
    return provider.validateCredentials(apiKey, baseUrl);
  } catch {
    return false;
  }
}

export function getAIProviderFields(providerId: string) {
  return AI_PROVIDERS[providerId]?.fields || [];
}
