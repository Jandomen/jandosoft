import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { Organization } from "@/lib/models/Organization";
import bcrypt from "bcryptjs";
import { signToken, setAuthCookie } from "@/lib/auth";
import { sendWelcomeEmail } from "@/lib/email-service";
import { sendEmail } from "@/lib/email";
import { verificationEmailHtml } from "@/lib/email-templates";
import crypto from "crypto";
import { checkRateLimit } from "@/lib/rate-limiter";

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";

    const rateKey = `register:${ip}`;
    const rateCheck = checkRateLimit(rateKey, 3, 60 * 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json({
        error: `Demasiados registros desde esta IP. Intenta de nuevo en ${Math.ceil(rateCheck.resetIn / 60000)} minutos.`,
      }, { status: 429 });
    }

    await connectDB();
    const { name, phone, email, password, referralCode } = await req.json();
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: "El correo ya está registrado" }, { status: 400 });
    }
    const hashedPassword = await bcrypt.hash(password, 12);

    const slug = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Date.now().toString(36);
    const org = await Organization.create({
      name: `${name}'s Organization`,
      slug,
    });

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const user = await User.create({
      name, phone, email, password: hashedPassword,
      organizationId: org._id,
      role: "owner",
      emailVerified: false,
      verificationToken,
      verificationTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    org.members.push({
      userId: user._id,
      email: user.email,
      name: user.name,
      role: "owner",
      joinedAt: new Date(),
    });
    await org.save();

    if (referralCode) {
      try {
        const { Referral } = await import("@/lib/models/Referral");
        const { Affiliate } = await import("@/lib/models/Affiliate");
        const affiliate = await Affiliate.findOne({ code: referralCode.toUpperCase() });
        if (affiliate) {
          const referral = new Referral({
            affiliateId: affiliate._id,
            referredUserId: user._id,
            referredUserEmail: email,
            plan: "pending",
            planPrice: 0,
            status: "pending",
          });
          await referral.save();
          await Affiliate.findByIdAndUpdate(affiliate._id, {
            $inc: { totalReferrals: 1 },
          });
        }
      } catch (e) {
        console.error("Error tracking referral:", e);
      }
    }

    const verificationResult = await sendEmail({
      to: user.email,
      subject: "Verifica tu correo electrónico — Jandosoft",
      html: verificationEmailHtml(verificationToken, user.name),
    });
    if (!verificationResult.success) {
      console.warn("Verification email not sent:", verificationResult.error);
    }

    const welcomeResult = await sendWelcomeEmail({
      to: user.email,
      userName: user.name,
      organizationId: org._id.toString(),
    });
    if (!welcomeResult.success) {
      console.warn("Welcome email not sent:", welcomeResult.error);
    }

    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      organizationId: org._id.toString(),
      role: "owner",
    });

    const response = NextResponse.json({
      success: true,
      token,
      emailSent: verificationResult.success && welcomeResult.success,
      emailError: !verificationResult.success ? verificationResult.error : (!welcomeResult.success ? welcomeResult.error : undefined),
      user: {
        email: user.email,
        name: user.name,
        organizationId: org._id.toString(),
        role: "owner",
        emailVerified: false,
      },
      organization: {
        id: org._id.toString(),
        name: org.name,
        slug: org.slug,
      },
    });

    setAuthCookie(response, token);
    return response;
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Error al registrar" }, { status: 500 });
  }
}
