import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";

function parseDuration(duration: string): Date | null {
  if (!duration || duration === "permanent") return null;
  const match = duration.match(/^(\d+)([hdwm])$/);
  if (!match) return null;
  const [, num, unit] = match;
  const n = parseInt(num);
  const now = Date.now();
  switch (unit) {
    case "h": return new Date(now + n * 3600000);
    case "d": return new Date(now + n * 86400000);
    case "w": return new Date(now + n * 604800000);
    case "m": return new Date(now + n * 2592000000);
    default: return null;
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const { reason, duration } = await req.json();

    const user = await User.findById(id);
    if (!user) {
      return Response.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const now = new Date();
    const isExpired = user.suspendedUntil && new Date(user.suspendedUntil) < now;

    if (user.isSuspended && !isExpired) {
      user.isSuspended = false;
      user.suspendedUntil = null;
    } else {
      const suspendedUntil = parseDuration(duration);
      user.isSuspended = true;
      user.suspendedUntil = suspendedUntil;
    }
    await user.save();

    return Response.json({
      success: true,
      isSuspended: user.isSuspended,
      name: user.name,
      suspendedUntil: user.suspendedUntil,
    });
  } catch (error) {
    console.error("Toggle user suspend error:", error);
    return Response.json({ error: "Error al cambiar estado" }, { status: 500 });
  }
}
