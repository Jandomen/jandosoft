import { NextRequest, NextResponse } from "next/server";
import { verify } from "jsonwebtoken";
import { validateCampaign } from "@/lib/smart-campaign-protection/validation";
import { checkCooldown, checkDailyLimit, getRecentCampaignCount } from "@/lib/smart-campaign-protection/limits";
import { getSegmentCustomers, applyExclusions } from "@/lib/smart-campaign-protection/segmentation";
import { calculateBatches } from "@/lib/smart-campaign-protection/batching";
import { getReputationMetrics } from "@/lib/smart-campaign-protection/reputation";
import { calculateHealthScore } from "@/lib/smart-campaign-protection/health-score";
import { generateRecommendations } from "@/lib/smart-campaign-protection/recommendations";
import { simulateCampaign } from "@/lib/smart-campaign-protection/simulation";
import { DEFAULT_PROTECTION_SETTINGS, type ProtectionSettings, type ChannelType, type AudienceSegment } from "@/lib/smart-campaign-protection/types";
import mongoose from "mongoose";
import { Store } from "@/lib/models/Store";

function getToken(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  const cookie = req.cookies.get("token")?.value;
  if (cookie) return cookie;
  return null;
}

function verifyAuth(token: string): any {
  return verify(token, process.env.JWT_SECRET || "jandosoft-secret-2026");
}

async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI!);
  }
}

// POST /api/campaign-protection - Main endpoint for all protection operations
export async function POST(req: NextRequest) {
  try {
    const token = getToken(req);
    if (!token) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    let user: any;
    try {
      user = verifyAuth(token);
    } catch {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const { action, storeId, channel, subject, content, audience, settings } = body;

    if (!storeId) {
      return NextResponse.json({ error: "storeId requerido" }, { status: 400 });
    }

    const store = await Store.findById(storeId).lean() as any;
    const storeSettings = store?.protectionSettings || {};
    const protectionSettings: ProtectionSettings = { ...DEFAULT_PROTECTION_SETTINGS, ...storeSettings, ...settings };

    switch (action) {
      case "validate": {
        if (!channel || !content) {
          return NextResponse.json({ error: "channel y content requeridos para validate" }, { status: 400 });
        }
        const segmentResult = await getSegmentCustomers(storeId, audience || "all");
        const recentCount = await getRecentCampaignCount(storeId);
        const healthScore = await calculateHealthScore(storeId);

        const validation = validateCampaign({
          channel: channel as ChannelType,
          subject,
          content,
          audienceSize: segmentResult.count,
          recentCampaignCount: recentCount,
          avgOpenRate: 0,
          avgBounceRate: healthScore.breakdown.bounceHistory < 10 ? 5 : 1
        });

        return NextResponse.json({ success: true, data: validation });
      }

      case "simulate": {
        if (!channel || !content) {
          return NextResponse.json({ error: "channel y content requeridos para simulate" }, { status: 400 });
        }
        const result = await simulateCampaign(
          { storeId, channel: channel as ChannelType, subject, content, audience: (audience || "all") as AudienceSegment },
          protectionSettings
        );
        return NextResponse.json({ success: true, data: result });
      }

      case "health": {
        const healthScore = await calculateHealthScore(storeId);
        return NextResponse.json({ success: true, data: healthScore });
      }

      case "reputation": {
        const reputation = await getReputationMetrics(storeId);
        return NextResponse.json({ success: true, data: reputation });
      }

      case "segments": {
        const segments = await Promise.all(
          ["all", "new", "frequent", "vip", "inactive", "recent_purchasers", "birthday"].map(
            async (seg) => await getSegmentCustomers(storeId, seg as AudienceSegment)
          )
        );
        return NextResponse.json({ success: true, data: segments });
      }

      case "daily-limit": {
        const limit = await checkDailyLimit(storeId, channel as ChannelType, protectionSettings);
        return NextResponse.json({ success: true, data: limit });
      }

      case "recommendations": {
        if (!channel || !content) {
          return NextResponse.json({ error: "channel y content requeridos para recommendations" }, { status: 400 });
        }
        const segmentResult = await getSegmentCustomers(storeId, audience || "all");
        const validation = validateCampaign({
          channel: channel as ChannelType,
          subject,
          content,
          audienceSize: segmentResult.count,
          recentCampaignCount: await getRecentCampaignCount(storeId),
          avgOpenRate: 0,
          avgBounceRate: 0
        });
        const healthScore = await calculateHealthScore(storeId);
        const reputation = await getReputationMetrics(storeId);
        const recs = generateRecommendations({
          validation,
          healthScore,
          reputation,
          audienceSize: segmentResult.count,
          recentCampaignCount: await getRecentCampaignCount(storeId),
          channel,
          subject,
          content
        });
        return NextResponse.json({ success: true, data: recs });
      }

      default:
        return NextResponse.json({ error: `Acción desconocida: ${action}` }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Campaign protection error:", error);
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 });
  }
}

// PUT /api/campaign-protection - Save protection settings
export async function PUT(req: NextRequest) {
  try {
    const token = getToken(req);
    if (!token) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    let user: any;
    try { user = verifyAuth(token); } catch {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const { storeId, settings } = body;

    if (!storeId || !settings) {
      return NextResponse.json({ error: "storeId y settings requeridos" }, { status: 400 });
    }

    const store = await Store.findById(storeId);
    if (!store) return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });

    store.protectionSettings = { ...DEFAULT_PROTECTION_SETTINGS, ...settings };
    await store.save();

    return NextResponse.json({ success: true, data: store.protectionSettings });
  } catch (error: any) {
    console.error("Save protection settings error:", error);
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 });
  }
}

// GET /api/campaign-protection - Get protection settings and status
export async function GET(req: NextRequest) {
  try {
    const token = getToken(req);
    if (!token) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    try { verifyAuth(token); } catch {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId");

    if (!storeId) {
      return NextResponse.json({ error: "storeId requerido" }, { status: 400 });
    }

    const [healthScore, reputation, dailyLimit, store] = await Promise.all([
      calculateHealthScore(storeId),
      getReputationMetrics(storeId),
      checkDailyLimit(storeId, "email"),
      Store.findById(storeId).lean() as any
    ]);

    const storeSettings = store?.protectionSettings || null;

    return NextResponse.json({
      success: true,
      data: {
        settings: storeSettings || DEFAULT_PROTECTION_SETTINGS,
        healthScore,
        reputation,
        dailyLimit
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
