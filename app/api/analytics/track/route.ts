import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Store } from "@/lib/models/Store";
import { PageView } from "@/lib/models/PageView";

export async function POST(req: NextRequest) {
  try {
    const { slug, path, referrer, visitorId } = await req.json();
    if (!slug || !path || !visitorId) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    await connectDB();
    const store = await Store.findOne({ slug }).lean();
    if (!store) {
      return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });
    }

    await PageView.create({
      storeId: store._id,
      path,
      visitorId,
      referrer: referrer || "",
      timestamp: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Track error:", error);
    return NextResponse.json({ error: "Error tracking page view" }, { status: 500 });
  }
}
