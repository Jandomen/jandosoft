import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/admin-middleware";
import { signToken } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const authResult = await verifyAdminAuth(req);
  if ("error" in authResult) return authResult.error;

  try {
    const { userId } = await params;
    await connectDB();

    const user = await User.findById(userId).lean() as any;
    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      organizationId: user.organizationId?.toString() || "",
      role: user.role || "owner",
    });

    return NextResponse.json({
      token,
      user: {
        email: user.email,
        name: user.name,
        subscription: user.subscription,
      },
    });
  } catch (error: any) {
    console.error("[Impersonate] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
