import { NextResponse } from "next/server";
import { askBusinessAI } from "@/lib/ai/agent";

export async function POST(req: Request) {
  const body = await req.json();

  const response = await askBusinessAI({
    message: body.message,
    store: body.store,
    history: body.history,
  });

  return NextResponse.json({
    success: true,
    response,
  });
}
