import { connectDB } from "@/lib/mongodb";
import { Commercial } from "@/lib/models/Commercial";

export const dynamic = "force-dynamic";

export async function GET() {
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
