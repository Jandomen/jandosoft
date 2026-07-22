import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { WhatsAppMessage } from "@/lib/models/WhatsAppMessage";
import { getAuthFromHeaders } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthFromHeaders(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const url = new URL(req.url);
    const storeId = url.searchParams.get("storeId");
    const accountId = url.searchParams.get("accountId");
    const waId = url.searchParams.get("waId");
    const direction = url.searchParams.get("direction");
    const status = url.searchParams.get("status");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    if (!storeId) return NextResponse.json({ error: "storeId requerido" }, { status: 400 });

    await connectDB();

    const query: any = { storeId };
    if (accountId) query.accountId = accountId;
    if (waId) query.waId = waId;
    if (direction) query.direction = direction;
    if (status) query.status = status;

    const messages = await WhatsAppMessage.find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(Math.min(limit, 100))
      .lean();

    const total = await WhatsAppMessage.countDocuments(query);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = await WhatsAppMessage.countDocuments({
      storeId,
      direction: "outgoing",
      createdAt: { $gte: today },
    });

    return NextResponse.json({ messages, total, hasMore: offset + messages.length < total, todaySentCount: todayCount });
  } catch (error: any) {
    console.error("[WA Messages] Error:", error?.message);
    return NextResponse.json({ error: "Error al obtener mensajes" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = getAuthFromHeaders(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const url = new URL(req.url);
    const storeId = url.searchParams.get("storeId");
    const accountId = url.searchParams.get("accountId");

    if (!storeId) return NextResponse.json({ error: "storeId requerido" }, { status: 400 });

    await connectDB();
    const query: any = { storeId };
    if (accountId) query.accountId = accountId;

    await WhatsAppMessage.deleteMany(query);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Error al eliminar mensajes" }, { status: 500 });
  }
}
