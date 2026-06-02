import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import bcrypt from "bcryptjs";
import { signToken, setAuthCookie } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    await connectDB();
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Faltan credenciales" }, { status: 400 });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "No hay cuenta con ese correo" }, { status: 400 });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 400 });
    }
    if (user.isSuspended) {
      return NextResponse.json({ error: "Cuenta suspendida" }, { status: 403 });
    }

    const orgId = user.organizationId?.toString() || "";
    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      organizationId: orgId,
      role: user.role || "member",
    });

    const response = NextResponse.json({
      success: true,
      token,
      user: {
        email: user.email,
        name: user.name,
        subscription: user.subscription,
        subscriptionExpiry: user.subscriptionExpiry,
        isSuspended: user.isSuspended,
        organizationId: orgId.toString(),
        role: user.role || "member",
      }
    });

    setAuthCookie(response, token);
    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Error al iniciar sesión" }, { status: 500 });
  }
}
