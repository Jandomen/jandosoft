import { connectDB } from "@/lib/mongodb";
import { Commercial } from "@/lib/models/Commercial";
import { verifyAdminAuth } from "@/lib/admin-middleware";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const authResult = await verifyAdminAuth(req);
  if ("error" in authResult) return authResult.error;

  try {
    await connectDB();
    const commercials = await Commercial.find({}).sort({ createdAt: -1 }).lean();
    return Response.json({ commercials });
  } catch (error) {
    console.error("Commercials error:", error);
    return Response.json({ error: "Error loading commercials" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authResult = await verifyAdminAuth(req);
  if ("error" in authResult) return authResult.error;

  try {
    await connectDB();
    const { title, imageUrl, linkUrl } = await req.json();
    if (!title || !imageUrl) {
      return Response.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }
    const commercial = await Commercial.create({ title, imageUrl, linkUrl });
    return Response.json({ success: true, commercial });
  } catch (error) {
    console.error("Create commercial error:", error);
    return Response.json({ error: "Error al crear comercial" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const authResult = await verifyAdminAuth(req);
  if ("error" in authResult) return authResult.error;

  try {
    await connectDB();
    const { id } = await req.json();
    if (!id) {
      return Response.json({ error: "ID requerido" }, { status: 400 });
    }
    await Commercial.findByIdAndDelete(id);
    return Response.json({ success: true });
  } catch (error) {
    console.error("Delete commercial error:", error);
    return Response.json({ error: "Error al eliminar" }, { status: 500 });
  }
}
