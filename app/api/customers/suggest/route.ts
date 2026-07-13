import { NextRequest, NextResponse } from "next/server";
import { getAuthFromHeaders, getAuthFromCookies } from "@/lib/auth";

async function getAuth(req: NextRequest) {
  return getAuthFromHeaders(req) || await getAuthFromCookies();
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuth(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await req.json();
    const { industry, count = 5 } = body;

    const openrouterKey = process.env.OPENROUTER_API_KEY;
    if (!openrouterKey) {
      return NextResponse.json({ error: "AI no configurado" }, { status: 500 });
    }

    const prompt = `Genera una lista de ${count} posibles leads/clientes potenciales para un negocio de la industria "${industry || "general"}". 
Para cada lead incluye: nombre, email, teléfono (ficticio pero realista), industria específica, y una nota corta sobre por qué sería un buen cliente.
Responde SOLO con un array JSON, sin markdown ni explicación:
[{ "name": "...", "email": "...", "phone": "...", "industry": "...", "notes": "..." }]`;

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openrouterKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
        max_tokens: 2000,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: `AI error: ${err}` }, { status: 502 });
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "";
    const json = JSON.parse(text.replace(/```json|```/g, "").trim());

    const leads = (Array.isArray(json) ? json : []).map((l: any) => ({
      name: l.name || "",
      email: l.email || "",
      phone: l.phone || "",
      industry: l.industry || "",
      notes: l.notes || "",
      source: "ai",
      status: "lead",
    }));

    return NextResponse.json({ leads });
  } catch (error: any) {
    console.error("POST /api/customers/suggest error:", error);
    return NextResponse.json({ error: "Error al sugerir leads" }, { status: 500 });
  }
}
