import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { WhatsAppConversation } from "@/lib/models/WhatsAppConversation";
import { WhatsAppMessage } from "@/lib/models/WhatsAppMessage";
import { WhatsAppAccount } from "@/lib/models/WhatsAppAccount";
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
    const status = url.searchParams.get("status");
    const assignedTo = url.searchParams.get("assignedTo");
    const accountId = url.searchParams.get("accountId");
    const search = url.searchParams.get("search");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    if (!storeId) return NextResponse.json({ error: "storeId requerido" }, { status: 400 });

    const ownership = await verifyStoreOwnership(storeId, auth);
    if (!ownership.ok) return NextResponse.json({ error: ownership.error }, { status: 403 });

    await connectDB();

    const query: any = { storeId };
    if (status) query.status = status;
    if (assignedTo === "unassigned") query.assignedTo = null;
    else if (assignedTo) query.assignedTo = assignedTo;
    if (accountId) query.accountId = accountId;
    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: "i" } },
        { customerPhone: { $regex: search, $options: "i" } },
        { waId: { $regex: search, $options: "i" } },
      ];
    }

    const conversations = await WhatsAppConversation.find(query)
      .sort({ lastMessageAt: -1 })
      .skip(offset)
      .limit(Math.min(limit, 100))
      .lean();

    const total = await WhatsAppConversation.countDocuments(query);

    const openCount = await WhatsAppConversation.countDocuments({ storeId, status: "open" });
    const pendingCount = await WhatsAppConversation.countDocuments({ storeId, status: "pending" });
    const closedCount = await WhatsAppConversation.countDocuments({ storeId, status: "closed" });

    const unreadAgg = await WhatsAppConversation.aggregate([
      { $match: { storeId: new (await import("mongoose")).default.Types.ObjectId(storeId), unreadCount: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: "$unreadCount" } } },
    ]);
    const totalUnread = unreadAgg[0]?.total || 0;

    return NextResponse.json({
      conversations, total,
      hasMore: offset + conversations.length < total,
      stats: { open: openCount, pending: pendingCount, closed: closedCount, total, totalUnread },
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Error al obtener conversaciones" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await getAuth(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await req.json();
    const { storeId, conversationId, action, assignedTo, assignedToName, status, aiAutoReply, tags, notes } = body;

    if (!storeId || !conversationId) {
      return NextResponse.json({ error: "storeId y conversationId son requeridos" }, { status: 400 });
    }

    const ownership = await verifyStoreOwnership(storeId, auth);
    if (!ownership.ok) return NextResponse.json({ error: ownership.error }, { status: 403 });

    await connectDB();
    const conversation = await WhatsAppConversation.findOne({ _id: conversationId, storeId });
    if (!conversation) return NextResponse.json({ error: "Conversacion no encontrada" }, { status: 404 });

    if (action === "assign") {
      if (!assignedTo) return NextResponse.json({ error: "assignedTo requerido" }, { status: 400 });
      await WhatsAppConversation.findByIdAndUpdate(conversationId, {
        assignedTo,
        assignedToName: assignedToName || "",
        assignedAt: new Date(),
        status: conversation.status === "closed" ? "open" : conversation.status,
      });
      return NextResponse.json({ success: true });
    }

    if (action === "unassign") {
      await WhatsAppConversation.findByIdAndUpdate(conversationId, {
        assignedTo: null,
        assignedToName: "",
        assignedAt: null,
      });
      return NextResponse.json({ success: true });
    }

    if (action === "close") {
      await WhatsAppConversation.findByIdAndUpdate(conversationId, { status: "closed", unreadCount: 0 });
      return NextResponse.json({ success: true });
    }

    if (action === "reopen") {
      await WhatsAppConversation.findByIdAndUpdate(conversationId, { status: "open" });
      return NextResponse.json({ success: true });
    }

    if (action === "markRead") {
      await WhatsAppConversation.findByIdAndUpdate(conversationId, { unreadCount: 0 });
      return NextResponse.json({ success: true });
    }

    if (action === "update") {
      const update: any = {};
      if (status) update.status = status;
      if (typeof aiAutoReply === "boolean") update.aiAutoReply = aiAutoReply;
      if (tags) update.tags = tags;
      if (notes !== undefined) update.notes = notes;
      await WhatsAppConversation.findByIdAndUpdate(conversationId, update);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Accion no valida" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: "Error en conversacion" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await getAuth(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const url = new URL(req.url);
    const conversationId = url.searchParams.get("conversationId");
    const storeId = url.searchParams.get("storeId");

    if (!conversationId || !storeId) return NextResponse.json({ error: "conversationId y storeId requeridos" }, { status: 400 });

    const ownership = await verifyStoreOwnership(storeId, auth);
    if (!ownership.ok) return NextResponse.json({ error: ownership.error }, { status: 403 });

    await connectDB();
    await WhatsAppConversation.findOneAndDelete({ _id: conversationId, storeId });
    await WhatsAppMessage.deleteMany({ conversationId });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Error al eliminar conversacion" }, { status: 500 });
  }
}
