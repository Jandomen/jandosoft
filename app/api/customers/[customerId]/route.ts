import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Customer } from "@/lib/models/Customer";
import { getAuthFromHeaders, getAuthFromCookies } from "@/lib/auth";

async function getAuth(req: NextRequest) {
  return getAuthFromHeaders(req) || await getAuthFromCookies();
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ customerId: string }> }) {
  try {
    const auth = await getAuth(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { customerId } = await params;
    await connectDB();

    const customer = await Customer.findById(customerId).lean();
    if (!customer) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });

    return NextResponse.json({ customer });
  } catch (error) {
    console.error("GET /api/customers/[id] error:", error);
    return NextResponse.json({ error: "Error al obtener cliente" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ customerId: string }> }) {
  try {
    const auth = await getAuth(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { customerId } = await params;
    const body = await req.json();

    await connectDB();

    const customer = await Customer.findByIdAndUpdate(
      customerId,
      { $set: body },
      { new: true, runValidators: true }
    ).lean();

    if (!customer) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });

    return NextResponse.json({ customer });
  } catch (error) {
    console.error("PUT /api/customers/[id] error:", error);
    return NextResponse.json({ error: "Error al actualizar cliente" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ customerId: string }> }) {
  try {
    const auth = await getAuth(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { customerId } = await params;
    await connectDB();

    const customer = await Customer.findByIdAndDelete(customerId);
    if (!customer) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/customers/[id] error:", error);
    return NextResponse.json({ error: "Error al eliminar cliente" }, { status: 500 });
  }
}
