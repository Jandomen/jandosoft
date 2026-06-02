import { NextRequest, NextResponse } from "next/server";
import { getAuthFromHeaders, getAuthFromCookies, JWTPayload } from "./auth";

export type HandlerWithAuth<T = any> = (
  req: NextRequest,
  auth: JWTPayload,
  body: T
) => Promise<NextResponse>;

export function withAuth(handler: HandlerWithAuth) {
  return async (req: NextRequest) => {
    const auth = getAuthFromHeaders(req) || await getAuthFromCookies();
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    try {
      const body = req.method !== "GET" && req.method !== "DELETE"
        ? await req.json().catch(() => ({}))
        : {};
      return handler(req, auth, body);
    } catch (error: any) {
      console.error("API error:", error);
      return NextResponse.json({ error: error.message || "Error interno" }, { status: 500 });
    }
  };
}

export function requireRole(...roles: string[]) {
  return (handler: (req: NextRequest, auth: JWTPayload, body: any) => Promise<NextResponse>) => {
    return async (req: NextRequest, auth: JWTPayload, body: any) => {
      if (!roles.includes(auth.role)) {
        return NextResponse.json({ error: "No tienes permisos" }, { status: 403 });
      }
      return handler(req, auth, body);
    };
  };
}

export function getBody(req: NextRequest): Promise<any> {
  return req.json().catch(() => ({}));
}
