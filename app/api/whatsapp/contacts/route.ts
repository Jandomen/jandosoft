import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { WhatsAppContact } from "@/lib/models/WhatsAppContact";
import { Customer } from "@/lib/models/Customer";
import { getAuth } from "@/lib/auth";
import { verifyStoreOwnership } from "@/lib/whatsapp-middleware";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuth(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const url = new URL(req.url);
    const storeId = url.searchParams.get("storeId");
    const search = url.searchParams.get("search");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    if (!storeId) return NextResponse.json({ error: "storeId requerido" }, { status: 400 });

    const ownership = await verifyStoreOwnership(storeId, auth);
    if (!ownership.ok) return NextResponse.json({ error: ownership.error }, { status: 403 });

    await connectDB();

    const query: any = { storeId };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { waId: { $regex: search, $options: "i" } },
      ];
    }

    const contacts = await WhatsAppContact.find(query)
      .sort({ lastSeen: -1 })
      .skip(offset)
      .limit(Math.min(limit, 100))
      .populate("customerId", "name email phone status")
      .lean();

    const total = await WhatsAppContact.countDocuments(query);

    return NextResponse.json({ contacts, total, hasMore: offset + contacts.length < total });
  } catch (error: any) {
    return NextResponse.json({ error: "Error al obtener contactos" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await getAuth(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await req.json();
    const { storeId, contactId, customerId, name } = body;

    if (!storeId || !contactId) {
      return NextResponse.json({ error: "storeId y contactId son requeridos" }, { status: 400 });
    }

    const ownership = await verifyStoreOwnership(storeId, auth);
    if (!ownership.ok) return NextResponse.json({ error: ownership.error }, { status: 403 });

    await connectDB();

    if (customerId) {
      const customer = await Customer.findOne({ _id: customerId, storeId });
      if (!customer) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    const update: any = {};
    if (customerId !== undefined) update.customerId = customerId || null;
    if (name) update.name = name;

    await WhatsAppContact.findByIdAndUpdate(contactId, update);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Error al actualizar contacto" }, { status: 500 });
  }
}
