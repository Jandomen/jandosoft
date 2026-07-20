import { NextRequest, NextResponse } from "next/server";
import { verify } from "jsonwebtoken";
import CampaignLog from "@/lib/models/CampaignLog";
import mongoose from "mongoose";

function getToken(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return req.cookies.get("token")?.value || null;
}

async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI!);
  }
}

// GET /api/campaign-logs - List campaign logs
export async function GET(req: NextRequest) {
  try {
    const token = getToken(req);
    if (!token) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    try { verify(token, process.env.JWT_SECRET || "jandosoft-secret-2026"); } catch {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId");
    const campaignId = searchParams.get("campaignId");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    if (!storeId) return NextResponse.json({ error: "storeId requerido" }, { status: 400 });

    const query: Record<string, any> = { storeId: new mongoose.Types.ObjectId(storeId) };
    if (campaignId) query.campaignId = parseInt(campaignId);
    if (status) query.status = status;

    const [logs, total] = await Promise.all([
      CampaignLog.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      CampaignLog.countDocuments(query)
    ]);

    // Aggregate stats
    const stats = await CampaignLog.aggregate([
      { $match: { storeId: new mongoose.Types.ObjectId(storeId), ...(campaignId ? { campaignId: parseInt(campaignId) } : {}) } },
      { $group: {
        _id: "$status",
        count: { $sum: 1 }
      }}
    ]);

    const statsMap: Record<string, number> = {};
    stats.forEach((s: any) => { statsMap[s._id] = s.count; });

    return NextResponse.json({
      success: true,
      data: {
        logs,
        stats: {
          total,
          pending: statsMap.pending || 0,
          sent: statsMap.sent || 0,
          delivered: statsMap.delivered || 0,
          opened: statsMap.opened || 0,
          clicked: statsMap.clicked || 0,
          bounced: statsMap.bounced || 0,
          unsubscribed: statsMap.unsubscribed || 0,
          complained: statsMap.complained || 0,
          failed: statsMap.failed || 0
        },
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/campaign-logs - Create campaign log entry
export async function POST(req: NextRequest) {
  try {
    const token = getToken(req);
    if (!token) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    await connectDB();
    const body = await req.json();

    const log = await CampaignLog.create({
      storeId: new mongoose.Types.ObjectId(body.storeId),
      campaignId: body.campaignId,
      campaignName: body.campaignName,
      channel: body.channel,
      status: body.status || "pending",
      recipientId: body.recipientId ? new mongoose.Types.ObjectId(body.recipientId) : undefined,
      recipientEmail: body.recipientEmail,
      recipientPhone: body.recipientPhone,
      subject: body.subject,
      content: body.content,
      batchNumber: body.batchNumber,
      metadata: body.metadata
    });

    return NextResponse.json({ success: true, data: log });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
