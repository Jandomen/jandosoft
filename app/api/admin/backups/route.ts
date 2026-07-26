import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { DeletedUserData } from "@/lib/models/DeletedUserData";
import { verifyAdminAuth } from "@/lib/admin-middleware";

export async function GET(req: NextRequest) {
  const authResult = await verifyAdminAuth(req);
  if ("error" in authResult) return authResult.error;

  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const query: any = {};
    if (email) {
      query.email = { $regex: email, $options: "i" };
    }

    const total = await DeletedUserData.countDocuments(query);
    const backups = await DeletedUserData.find(query)
      .sort({ deletedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      backups,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/admin/backups error:", error);
    return NextResponse.json({ error: "Error al obtener backups" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const authResult = await verifyAdminAuth(req);
  if ("error" in authResult) return authResult.error;

  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    await DeletedUserData.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: "Backup eliminada" });
  } catch (error) {
    console.error("DELETE /api/admin/backups error:", error);
    return NextResponse.json({ error: "Error al eliminar backup" }, { status: 500 });
  }
}
