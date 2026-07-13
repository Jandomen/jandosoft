import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Appointment } from "@/lib/models/Appointment";
import { Store } from "@/lib/models/Store";
import { Customer } from "@/lib/models/Customer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug, serviceId, serviceName, servicePrice, serviceDuration, date, time, duration, name, email, phone, notes } = body;

    if (!slug || !date || !time || !name) {
      return NextResponse.json({ error: "slug, date, time and name required" }, { status: 400 });
    }

    await connectDB();
    const store = await Store.findOne({ slug }).lean();
    if (!store) {
      return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });
    }

    const storeId = store._id;

    let customerId: string | undefined;
    if (email) {
      const existing = await Customer.findOne({ storeId, email }).lean();
      if (existing) {
        customerId = String(existing._id);
      } else {
        const newCustomer = await Customer.create({
          storeId,
          name,
          email: email || "",
          phone: phone || "",
          tags: ["booking"],
          notes: "Creado desde reserva pública",
        });
        customerId = String(newCustomer._id);
      }
    }

    const appointment = await Appointment.create({
      storeId,
      customerId: customerId || undefined,
      service: {
        id: serviceId || 0,
        name: serviceName || "Sin servicio",
        price: servicePrice || 0,
        duration: serviceDuration || duration || 60,
      },
      customerInfo: { name, email: email || "", phone: phone || "" },
      date,
      time,
      duration: duration || serviceDuration || 60,
      notes: notes || "",
      status: "pending",
      createdBy: "customer",
    });

    return NextResponse.json({ success: true, appointment }, { status: 201 });
  } catch (error) {
    console.error("Public book appointment error:", error);
    return NextResponse.json({ error: "Error creating booking" }, { status: 500 });
  }
}
