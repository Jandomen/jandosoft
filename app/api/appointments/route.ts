import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Appointment } from "@/lib/models/Appointment";
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
    const customerId = searchParams.get("customerId");
    const status = searchParams.get("status");
    const date = searchParams.get("date");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));

    if (!storeId) return NextResponse.json({ error: "storeId required" }, { status: 400 });

    await connectDB();
    const filter: any = { storeId };

    if (customerId) filter.customerId = customerId;
    if (status) filter.status = status;
    if (date) filter.date = date;
    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = dateFrom;
      if (dateTo) filter.date.$lte = dateTo;
    }

    const skip = (page - 1) * limit;
    const [total, appointments] = await Promise.all([
      Appointment.countDocuments(filter),
      Appointment.find(filter)
        .sort({ date: 1, time: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    return NextResponse.json({ appointments, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("GET appointments error:", error);
    return NextResponse.json({ error: "Error loading appointments" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuth(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await req.json();
    const { storeId, ownerEmail, customerId, service, customerInfo, date, time, duration, notes, status } = body;

    if (!date || !time) {
      return NextResponse.json({ error: "date and time required" }, { status: 400 });
    }

    await connectDB();
    const appointment = await Appointment.create({
      storeId: storeId || undefined,
      ownerEmail: ownerEmail || undefined,
      customerId: customerId || undefined,
      service: service || { id: 0, name: "Sin servicio", price: 0, duration: duration || 60 },
      customerInfo: customerInfo || { name: "", email: "", phone: "" },
      date,
      time,
      duration: duration || 60,
      notes: notes || "",
      status: status || "pending",
      createdBy: "owner",
    });

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    console.error("POST appointment error:", error);
    return NextResponse.json({ error: "Error creating appointment" }, { status: 500 });
  }
}
