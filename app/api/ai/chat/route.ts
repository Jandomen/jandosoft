import { NextRequest, NextResponse } from "next/server";
import { askBusinessAI, askBusinessAIWithTools } from "@/lib/ai/agent";
import { getAuthFromHeaders, getAuthFromCookies } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const auth = getAuthFromHeaders(req) || await getAuthFromCookies();

  if (auth) {
    const { response, actions } = await askBusinessAIWithTools({
      message: body.message,
      store: body.store,
      history: body.history,
      userId: auth.userId,
    });

    return NextResponse.json({
      success: true,
      response,
      actions,
    });
  }

  const response = await askBusinessAI({
    message: body.message,
    store: body.store,
    history: body.history,
  });

  return NextResponse.json({
    success: true,
    response,
    actions: [],
  });
}
