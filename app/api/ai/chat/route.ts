import { NextRequest, NextResponse } from "next/server";
import { askBusinessAI, askBusinessAIWithTools } from "@/lib/ai/agent";
import { getAuthFromHeaders, getAuthFromCookies } from "@/lib/auth";
import { contextIsolator, buildCognitiveContext, injectCognitiveContextHeader } from "@/lib/ai/cognitive";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const auth = getAuthFromHeaders(req) || await getAuthFromCookies();

  // Isolate context from client-supplied store data
  const result = contextIsolator.isolateFromClient(
    body.store,
    auth?.organizationId || null,
  );

  if (!result.verified || result.contamination) {
    console.error(
      `[AI Chat] Context isolation FAILED: ${result.reason}. ` +
      `Auth org: ${auth?.organizationId || "none"}`,
    );
    return NextResponse.json(
      { error: "Error de contexto. Intenta de nuevo." },
      { status: 403 },
    );
  }

  // Build cognitive context for tracing
  const cognitiveCtx = buildCognitiveContext({
    message: body.message,
    storeId: result.storeId,
    snapshot: result.data!,
    authUserId: auth?.userId,
    authOrganizationId: auth?.organizationId || null,
  });

  console.log(cognitiveCtx.trace.join("\n"));

  if (auth) {
    const { response, actions } = await askBusinessAIWithTools({
      message: body.message,
      store: body.store,
      history: body.history,
      userId: auth.userId,
      cognitiveHeader: injectCognitiveContextHeader(cognitiveCtx),
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
    cognitiveHeader: injectCognitiveContextHeader(cognitiveCtx),
  });

  return NextResponse.json({
    success: true,
    response,
    actions: [],
  });
}
