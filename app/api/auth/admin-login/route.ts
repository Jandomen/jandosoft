import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return Response.json({ error: "Faltan credenciales" }, { status: 400 });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      return Response.json({ error: "Admin no configurado" }, { status: 500 });
    }

    if (email !== adminEmail) {
      return Response.json({ error: "Credenciales de administrador incorrectas" }, { status: 400 });
    }

    if (password !== adminPassword) {
      return Response.json({ error: "Credenciales de administrador incorrectas" }, { status: 400 });
    }

    return Response.json({
      success: true,
      user: { email: adminEmail, name: "Administrador", subscription: "admin" },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return Response.json({ error: "Error al iniciar sesión" }, { status: 500 });
  }
}
