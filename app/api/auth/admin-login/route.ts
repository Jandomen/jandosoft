import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { signToken, setAuthCookie } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Faltan credenciales" }, { status: 400 });
    }

    await connectDB();

    const user = await User.findOne({ email, isSuperAdmin: true });
    if (!user) {
      return NextResponse.json({ error: "Credenciales de administrador incorrectas" }, { status: 400 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Credenciales de administrador incorrectas" }, { status: 400 });
    }

    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      organizationId: user.organizationId?.toString() || "",
      role: user.role || "admin",
    });

    const response = NextResponse.json({
      success: true,
      token,
      user: { email: user.email, name: user.name, subscription: "admin" },
    });

    setAuthCookie(response, token);
    return response;
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json({ error: "Error al iniciar sesión" }, { status: 500 });
  }
}
