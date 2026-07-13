export interface AIProviderField {
  key: string;
  label: string;
  placeholder: string;
  secret?: boolean;
}

export interface AIProviderConfig {
  id: string;
  label: string;
  color: string;
  icon: string;
  fields: AIProviderField[];
  defaultBaseUrl?: string;
  defaultModel?: string;
  models?: string[];
  isOpenAICompatible: boolean;
}

export interface StoreAIProvider {
  provider: string;
  apiKey: string;
  baseUrl: string;
  model: string;
  enabled: boolean;
  configuredAt?: Date;
}

export interface LLMMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_call_id?: string;
  tool_calls?: any[];
  name?: string;
}

export interface LLMResponse {
  content: string;
  model: string;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  tool_calls?: any[];
  finish_reason?: string;
}

export interface LLMOptions {
  messages: LLMMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  tools?: any[];
  tool_choice?: string | { type: string; function?: { name: string } };
}

export interface AIProvider {
  config: AIProviderConfig;
  chat(options: LLMOptions, credentials: { apiKey: string; baseUrl: string; model: string }): Promise<LLMResponse>;
  validateCredentials(apiKey: string, baseUrl: string): Promise<boolean>;
}

export const AI_PROVIDERS: Record<string, AIProviderConfig> = {
  openai: {
    id: "openai",
    label: "OpenAI",
    color: "#10a37f",
    icon: "SiOpenai",
    defaultBaseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
    models: ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini", "gpt-4.1", "o3-mini", "o4-mini"],
    isOpenAICompatible: true,
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "sk-...", secret: true },
      { key: "model", label: "Modelo", placeholder: "gpt-4o-mini" },
    ],
  },
  anthropic: {
    id: "anthropic",
    label: "Anthropic",
    color: "#d4a574",
    icon: "SiAnthropic",
    defaultBaseUrl: "https://api.anthropic.com",
    defaultModel: "claude-sonnet-4-20250514",
    models: ["claude-sonnet-4-20250514", "claude-3-5-haiku-20241022", "claude-3-opus-20240229"],
    isOpenAICompatible: false,
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "sk-ant-...", secret: true },
      { key: "model", label: "Modelo", placeholder: "claude-sonnet-4-20250514" },
    ],
  },
  gemini: {
    id: "gemini",
    label: "Google Gemini",
    color: "#4285f4",
    icon: "SiGooglegemini",
    defaultBaseUrl: "https://generativelanguage.googleapis.com/v1beta",
    defaultModel: "gemini-2.0-flash",
    models: ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-2.5-pro"],
    isOpenAICompatible: false,
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "AIza...", secret: true },
      { key: "model", label: "Modelo", placeholder: "gemini-2.0-flash" },
    ],
  },
  openrouter: {
    id: "openrouter",
    label: "OpenRouter",
    color: "#6366f1",
    icon: "SiOpenrouter",
    defaultBaseUrl: "https://openrouter.ai/api/v1",
    defaultModel: "openai/gpt-4o-mini",
    models: ["openai/gpt-4o-mini", "openai/gpt-4o", "anthropic/claude-3.5-sonnet", "deepseek/deepseek-chat", "meta-llama/llama-3.1-8b-instruct"],
    isOpenAICompatible: true,
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "sk-or-...", secret: true },
      { key: "model", label: "Modelo", placeholder: "openai/gpt-4o-mini" },
    ],
  },
  ollama: {
    id: "ollama",
    label: "Ollama (Local)",
    color: "#ffffff",
    icon: "SiOllama",
    defaultBaseUrl: "http://localhost:11434/v1",
    defaultModel: "llama3.1",
    isOpenAICompatible: true,
    fields: [
      { key: "baseUrl", label: "URL del servidor", placeholder: "http://localhost:11434/v1" },
      { key: "model", label: "Modelo", placeholder: "llama3.1" },
    ],
  },
  groq: {
    id: "groq",
    label: "Groq",
    color: "#f55036",
    icon: "SiGroq",
    defaultBaseUrl: "https://api.groq.com/openai/v1",
    defaultModel: "llama-3.3-70b-versatile",
    models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768", "gemma2-9b-it"],
    isOpenAICompatible: true,
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "gsk_...", secret: true },
      { key: "model", label: "Modelo", placeholder: "llama-3.3-70b-versatile" },
    ],
  },
  deepseek: {
    id: "deepseek",
    label: "DeepSeek",
    color: "#4d6bfe",
    icon: "SiDeepseek",
    defaultBaseUrl: "https://api.deepseek.com",
    defaultModel: "deepseek-chat",
    models: ["deepseek-chat", "deepseek-reasoner"],
    isOpenAICompatible: true,
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "sk-...", secret: true },
      { key: "model", label: "Modelo", placeholder: "deepseek-chat" },
    ],
  },
  custom: {
    id: "custom",
    label: "Custom OpenAI-Compatible",
    color: "#71717a",
    icon: "SiJson",
    defaultModel: "default",
    isOpenAICompatible: true,
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "Tu API key", secret: true },
      { key: "baseUrl", label: "Base URL", placeholder: "https://tu-servidor.com/v1" },
      { key: "model", label: "Modelo", placeholder: "nombre-del-modelo" },
    ],
  },
};

export function getAIProviderConfig(id: string): AIProviderConfig | undefined {
  return AI_PROVIDERS[id];
}
