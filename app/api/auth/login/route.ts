import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import bcrypt from "bcryptjs";
import { signToken, setAuthCookie } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limiter";

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const { email, password } = await req.json();

    const rateKey = `login:${ip}`;
    const rateCheck = checkRateLimit(rateKey, 5, 15 * 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json({
        error: `Demasiados intentos. Intenta de nuevo en ${Math.ceil(rateCheck.resetIn / 60000)} minutos.`,
      }, { status: 429 });
    }

    if (!email || !password) {
      return NextResponse.json({ error: "Faltan credenciales" }, { status: 400 });
    }

    await connectDB();
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
    const now = new Date();
    if (user.suspendedUntil && user.suspendedUntil < now) {
      user.isSuspended = false;
      user.suspendedUntil = null;
      await user.save();
    }
    if (user.isSuspended) {
      const until = user.suspendedUntil ? ` hasta ${new Date(user.suspendedUntil).toLocaleDateString("es")}` : "";
      return NextResponse.json({ error: `Cuenta suspendida${until}` }, { status: 403 });
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
        emailVerified: user.emailVerified ?? false,
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
