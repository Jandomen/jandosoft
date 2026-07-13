import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Customer } from "@/lib/models/Customer";
import { getAuthFromHeaders, getAuthFromCookies } from "@/lib/auth";

async function getAuth(req: NextRequest) {
  return getAuthFromHeaders(req) || await getAuthFromCookies();
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuth(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await req.json();
    const { storeId, customers: rows } = body;

    if (!storeId || !rows?.length) {
      return NextResponse.json({ error: "storeId y customers requeridos" }, { status: 400 });
    }

    await connectDB();

    let created = 0;
    let skipped = 0;

    for (const row of rows) {
      if (!row.name?.trim()) { skipped++; continue; }

      const exists = await Customer.findOne({ storeId, name: row.name.trim(), email: row.email || "" }).lean();
      if (exists) { skipped++; continue; }

      await Customer.create({
        storeId,
        name: row.name.trim(),
        email: row.email || "",
        phone: row.phone || "",
        address: row.address || "",
        coordinates: row.coordinates || null,
        category: row.category || "",
        status: row.status || "lead",
        source: row.source || "import",
        industry: row.industry || "",
        tags: row.tags ? (Array.isArray(row.tags) ? row.tags : row.tags.split(",").map((t: string) => t.trim()).filter(Boolean)) : [],
        notes: row.notes || "",
      });
      created++;
    }

    return NextResponse.json({ success: true, created, skipped, total: rows.length });
  } catch (error: any) {
    console.error("POST /api/customers/import error:", error);
    return NextResponse.json({ error: "Error al importar clientes" }, { status: 500 });
  }
}
