import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { Organization } from "@/lib/models/Organization";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();
    if (!email || !password || !name) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    await connectDB();

    const existingAdmin = await User.findOne({ isSuperAdmin: true });
    if (existingAdmin) {
      return NextResponse.json({ error: "Ya existe un administrador en el sistema" }, { status: 400 });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: "El correo ya está registrado" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const slug = "admin-" + Date.now().toString(36);
    const org = await Organization.create({
      name: "Administración Jandosoft",
      slug,
    });

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      organizationId: org._id,
      role: "admin",
      isSuperAdmin: true,
      emailVerified: true,
    });

    org.members.push({
      userId: user._id,
      email: user.email,
      name: user.name,
      role: "admin",
      joinedAt: new Date(),
    });
    await org.save();

    return NextResponse.json({
      success: true,
      message: "Administrador creado exitosamente",
      user: { email: user.email, name: user.name },
    });
  } catch (error) {
    console.error("Setup admin error:", error);
    return NextResponse.json({ error: "Error al crear administrador" }, { status: 500 });
  }
}
