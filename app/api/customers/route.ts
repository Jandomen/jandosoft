import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Customer } from "@/lib/models/Customer";
import { getAuthFromHeaders, getAuthFromCookies } from "@/lib/auth";

async function getAuth(req: NextRequest) {
  return getAuthFromHeaders(req) || await getAuthFromCookies();
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuth(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const category = searchParams.get("category") || "";
    const source = searchParams.get("source") || "";

    if (!storeId) return NextResponse.json({ error: "storeId requerido" }, { status: 400 });

    await connectDB();

    let filter: any = { storeId };
    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [{ name: regex }, { email: regex }, { phone: regex }, { address: regex }, { tags: regex }];
    }
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (source) filter.source = source;

    const customers = await Customer.find(filter).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ customers });
  } catch (error) {
    console.error("GET /api/customers error:", error);
    return NextResponse.json({ error: "Error al obtener clientes" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuth(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await req.json();
    const { storeId, name, email, phone, address, coordinates, category, status, source, industry, tags, notes } = body;

    if (!storeId || !name?.trim()) {
      return NextResponse.json({ error: "storeId y name son requeridos" }, { status: 400 });
    }

    await connectDB();

    const customer = await Customer.create({
      storeId,
      name: name.trim(),
      email: email || "",
      phone: phone || "",
      address: address || "",
      coordinates: coordinates || null,
      category: category || "",
      status: status || "lead",
      source: source || "manual",
      industry: industry || "",
      tags: tags || [],
      notes: notes || "",
    });

    return NextResponse.json({ customer }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/customers error:", error);
    return NextResponse.json({ error: "Error al crear cliente" }, { status: 500 });
  }
}
