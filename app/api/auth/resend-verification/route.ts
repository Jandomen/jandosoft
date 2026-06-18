import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { getAuthFromHeaders, getAuthFromCookies } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { verificationEmailHtml } from "@/lib/email-templates";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthFromHeaders(req) || await getAuthFromCookies();
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(auth.userId);
    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: "El correo ya está verificado" }, { status: 400 });
    }

    const token = crypto.randomBytes(32).toString("hex");
    user.verificationToken = token;
    user.verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    const emailResult = await sendEmail({
      to: user.email,
      subject: "Verifica tu correo electrónico — Jandosoft",
      html: verificationEmailHtml(token, user.name),
    });

    if (!emailResult.success) {
      console.warn("Resend verification email failed:", emailResult.error);
    }

    return NextResponse.json({ success: true, message: "Correo de verificación reenviado" });
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json({ error: "Error al reenviar verificación" }, { status: 500 });
  }
}
