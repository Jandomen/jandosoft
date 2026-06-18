import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { signToken, setAuthCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    if (!token) {
      return NextResponse.json({ error: "Token requerido" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json({ error: "Token inválido o expirado" }, { status: 400 });
    }

    user.emailVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpiry = null;
    await user.save();

    const newToken = signToken({
      userId: user._id.toString(),
      email: user.email,
      organizationId: user.organizationId?.toString() || "",
      role: user.role || "member",
    });

    const response = NextResponse.json({
      success: true,
      token: newToken,
      message: "Correo verificado exitosamente",
    });

    setAuthCookie(response, newToken);
    return response;
  } catch (error) {
    console.error("Verify email error:", error);
    return NextResponse.json({ error: "Error al verificar correo" }, { status: 500 });
  }
}
