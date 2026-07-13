import { NextRequest, NextResponse } from "next/server";
import { getAuthFromHeaders, getAuthFromCookies, JWTPayload } from "./auth";
import { connectDB } from "./mongodb";
import { User } from "./models/User";

export async function verifyAdminAuth(
  req: Request
): Promise<{ auth: JWTPayload } | { error: NextResponse }> {
  const auth = getAuthFromHeaders(req) || (await getAuthFromCookies());

  if (!auth) {
    return {
      error: NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      ),
    };
  }

  await connectDB();
  const user = await User.findById(auth.userId).select("isSuperAdmin").lean();

  if (!user || !user.isSuperAdmin) {
    return {
      error: NextResponse.json(
        { error: "Acceso denegado" },
        { status: 403 }
      ),
    };
  }

  return { auth };
}
