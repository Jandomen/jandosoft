import { connectDB } from "@/lib/mongodb";
import { Store } from "@/lib/models/Store";
import { verifyAdminAuth } from "@/lib/admin-middleware";

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
  const authResult = await verifyAdminAuth(req);
  if ("error" in authResult) return authResult.error;

  try {
    await connectDB();
    const { id } = await params;
    const { reason, duration } = await req.json();

    const store = await Store.findById(id);
    if (!store) {
      return Response.json({ error: "Empresa no encontrada" }, { status: 404 });
    }

    const now = new Date();
    const isExpired = store.suspendedUntil && new Date(store.suspendedUntil) < now;

    if (store.isSuspended && !isExpired) {
      store.isSuspended = false;
      store.suspensionReason = "";
      store.suspendedUntil = null;
    } else {
      const suspendedUntil = parseDuration(duration);
      store.isSuspended = true;
      store.suspensionReason = reason || "Violación de términos de servicio";
      store.suspendedUntil = suspendedUntil;
    }
    await store.save();

    return Response.json({
      success: true,
      isSuspended: store.isSuspended,
      name: store.name,
      suspendedUntil: store.suspendedUntil,
    });
  } catch (error) {
    console.error("Toggle suspend error:", error);
    return Response.json({ error: "Error al cambiar estado" }, { status: 500 });
  }
}
