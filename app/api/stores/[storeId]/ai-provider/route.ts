import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Store } from "@/lib/models/Store";
import { validateAIProvider } from "@/lib/ai-providers/registry";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId");
    if (!storeId) return NextResponse.json({ error: "storeId required" }, { status: 400 });

    await connectDB();
    const store = await Store.findById(storeId).lean() as any;
    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

    const aiProvider = store.aiProvider || null;
    const safeProvider = aiProvider ? { ...aiProvider, apiKey: aiProvider.apiKey ? "••••••••" : "" } : null;

    return NextResponse.json({ aiProvider: safeProvider });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { storeId, provider, apiKey, baseUrl, model } = await req.json();
    if (!storeId || !provider) return NextResponse.json({ error: "storeId and provider required" }, { status: 400 });

    await connectDB();
    const store = await Store.findById(storeId) as any;
    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

    const effectiveBaseUrl = baseUrl || getDefaultBaseUrl(provider);
    const effectiveModel = model || getDefaultModel(provider);

    const valid = await validateAIProvider(provider, apiKey || "", effectiveBaseUrl);
    if (!valid) return NextResponse.json({ error: "Credenciales inválidas. Verifica la API key y la URL." }, { status: 400 });

    store.aiProvider = {
      provider,
      apiKey: apiKey || "",
      baseUrl: effectiveBaseUrl,
      model: effectiveModel,
      enabled: true,
      configuredAt: new Date(),
    };
    await store.save();

    return NextResponse.json({ success: true, provider, enabled: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { storeId, enabled } = await req.json();
    if (!storeId) return NextResponse.json({ error: "storeId required" }, { status: 400 });

    await connectDB();
    const store = await Store.findById(storeId) as any;
    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

    if (typeof enabled === "boolean" && store.aiProvider) {
      store.aiProvider.enabled = enabled;
      await store.save();
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId");
    if (!storeId) return NextResponse.json({ error: "storeId required" }, { status: 400 });

    await connectDB();
    const store = await Store.findById(storeId) as any;
    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

    store.aiProvider = null;
    await store.save();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function getDefaultBaseUrl(provider: string): string {
  const defaults: Record<string, string> = {
    openai: "https://api.openai.com/v1",
    anthropic: "https://api.anthropic.com",
    gemini: "https://generativelanguage.googleapis.com/v1beta",
    openrouter: "https://openrouter.ai/api/v1",
    ollama: "http://localhost:11434/v1",
    groq: "https://api.groq.com/openai/v1",
    deepseek: "https://api.deepseek.com",
    custom: "",
  };
  return defaults[provider] || "";
}

function getDefaultModel(provider: string): string {
  const defaults: Record<string, string> = {
    openai: "gpt-4o-mini",
    anthropic: "claude-sonnet-4-20250514",
    gemini: "gemini-2.0-flash",
    openrouter: "openai/gpt-4o-mini",
    ollama: "llama3.1",
    groq: "llama-3.3-70b-versatile",
    deepseek: "deepseek-chat",
    custom: "",
  };
  return defaults[provider] || "";
}
