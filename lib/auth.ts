import jwt from "jsonwebtoken";
import type { NextResponse } from "next/server";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "jandosoft-jwt-secret-dev";
const COOKIE_NAME = "jandosession";

export interface JWTPayload {
  userId: string;
  email: string;
  organizationId: string;
  role: "owner" | "admin" | "member";
}

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 7 * 24 * 60 * 60,
};

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export function setAuthCookie(response: NextResponse, token: string) {
  response.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS);
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.set(COOKIE_NAME, "", { ...COOKIE_OPTIONS, maxAge: 0 });
}

export async function getAuthFromCookies(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function getAuthFromHeaders(req: Request): JWTPayload | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  return verifyToken(authHeader.slice(7));
}

export async function getAuthVerified(req: Request): Promise<{ auth: JWTPayload } | { error: string; status: number }> {
  const auth = getAuthFromHeaders(req) || await getAuthFromCookies();
  if (!auth) return { error: "No autorizado", status: 401 };
  try {
    const { connectDB } = await import("./mongodb");
    const { User } = await import("./models/User");
    await connectDB();
    const exists = await User.findById(auth.userId).lean().select("_id").catch(() => null);
    if (!exists) return { error: "Sesión inválida. La cuenta ya no existe.", status: 401 };
  } catch {}
  return { auth };
}
