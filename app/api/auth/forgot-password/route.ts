import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { sendPasswordResetEmail } from "@/lib/email-service";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Correo requerido" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ success: true, message: "Si el correo existe, recibirás un enlace de restablecimiento" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const emailResult = await sendPasswordResetEmail({
      to: user.email,
      token,
      organizationId: user.organizationId?.toString(),
    });

    if (!emailResult.success) {
      console.warn("Password reset email failed:", emailResult.error);
    }

    return NextResponse.json({ success: true, message: "Si el correo existe, recibirás un enlace de restablecimiento" });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Error al procesar solicitud" }, { status: 500 });
  }
}
