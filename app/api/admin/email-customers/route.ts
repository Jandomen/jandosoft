import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Customer } from "@/lib/models/Customer";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    let filter: any = {};
    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [{ name: regex }, { email: regex }];
    }

    const customers = await Customer.find(filter)
      .select("name email phone")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({ customers });
  } catch (error) {
    console.error("GET /api/admin/email-customers error:", error);
    return NextResponse.json({ error: "Error al obtener clientes" }, { status: 500 });
  }
}
