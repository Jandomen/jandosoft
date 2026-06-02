import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { Organization } from "@/lib/models/Organization";
import bcrypt from "bcryptjs";
import { signToken, setAuthCookie } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    await connectDB();
    const { name, phone, email, password } = await req.json();
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

    const user = await User.create({
      name, phone, email, password: hashedPassword,
      organizationId: org._id,
      role: "owner",
    });

    org.members.push({
      userId: user._id,
      email: user.email,
      name: user.name,
      role: "owner",
      joinedAt: new Date(),
    });
    await org.save();

    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      organizationId: org._id.toString(),
      role: "owner",
    });

    const response = NextResponse.json({
      success: true,
      token,
      user: {
        email: user.email,
        name: user.name,
        organizationId: org._id.toString(),
        role: "owner",
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
