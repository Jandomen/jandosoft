import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Store } from "@/lib/models/Store";
import { ScheduledTask } from "@/lib/models/ScheduledTask";
import { getAuthFromCookies, getAuthFromHeaders } from "@/lib/auth";

async function getAuth(req: NextRequest) {
  return getAuthFromHeaders(req) || await getAuthFromCookies();
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ storeId: string }> }) {
  try {
    const auth = await getAuth(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const { storeId } = await params;
    await connectDB();
    const store = await Store.findOne({ _id: storeId, organizationId: auth.organizationId }).lean() as any;
    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });
    return NextResponse.json({ prospectingConfig: store.prospectingConfig || null });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ storeId: string }> }) {
  try {
    const auth = await getAuth(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const { storeId } = await params;
    const body = await req.json();
    const { enabled, location, category, customKeyword, radius, maxResults, intervalHours, autoOutreach, outreachChannel } = body;

    await connectDB();
    const store = await Store.findOne({ _id: storeId, organizationId: auth.organizationId });
    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });
    if (store.isSuspended) return NextResponse.json({ error: "Empresa suspendida" }, { status: 403 });

    const cfg: any = {
      enabled: !!enabled,
      location: location || "",
      category: category || "store",
      customKeyword: customKeyword || "",
      radius: Math.min(Math.max(Number(radius) || 2000, 500), 50000),
      maxResults: Math.min(Math.max(Number(maxResults) || 10, 1), 20),
      intervalHours: Math.min(Math.max(Number(intervalHours) || 24, 1), 168),
      autoOutreach: autoOutreach !== false,
      outreachChannel: ["email", "whatsapp", "sms"].includes(outreachChannel) ? outreachChannel : "email",
      lastRunAt: (store as any).prospectingConfig?.lastRunAt || null,
    };

    if (cfg.enabled && !cfg.location) {
      return NextResponse.json({ error: "location es requerido si prospecting está habilitado" }, { status: 400 });
    }

    await Store.updateOne({ _id: storeId }, { $set: { prospectingConfig: cfg } });

    // If enabled, enqueue immediate prospecting task
    let taskId: string | null = null;
    if (cfg.enabled) {
      // Cancel existing pending prospecting tasks for this store to avoid duplicates
      await ScheduledTask.deleteMany({ storeId, type: "prospecting", status: "pending" });
      const task = await ScheduledTask.create({
        type: "prospecting",
        payload: {
          storeId,
          location: cfg.location,
          category: cfg.category,
          customKeyword: cfg.customKeyword,
          radius: cfg.radius,
          maxResults: cfg.maxResults,
        },
        runAt: new Date(),
        status: "pending",
        storeId,
        organizationId: auth.organizationId,
      });
      taskId = String(task._id);

      // Schedule next run
      const next = new Date(Date.now() + cfg.intervalHours * 60 * 60 * 1000);
      await ScheduledTask.create({
        type: "prospecting",
        payload: {
          storeId,
          location: cfg.location,
          category: cfg.category,
          customKeyword: cfg.customKeyword,
          radius: cfg.radius,
          maxResults: cfg.maxResults,
        },
        runAt: next,
        status: "pending",
        storeId,
        organizationId: auth.organizationId,
      });
    } else {
      await ScheduledTask.deleteMany({ storeId, type: "prospecting", status: "pending" });
    }

    return NextResponse.json({ prospectingConfig: cfg, taskId, message: cfg.enabled ? "Prospecting activado y tarea encolada" : "Prospecting desactivado" });
  } catch (e: any) {
    console.error("PUT prospecting error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// Manual trigger: POST to run now
export async function POST(req: NextRequest, { params }: { params: Promise<{ storeId: string }> }) {
  try {
    const auth = await getAuth(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const { storeId } = await params;
    await connectDB();
    const store = await Store.findOne({ _id: storeId, organizationId: auth.organizationId }).lean() as any;
    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });
    const cfg = store.prospectingConfig;
    if (!cfg?.enabled) return NextResponse.json({ error: "Prospecting no está habilitado" }, { status: 400 });

    const task = await ScheduledTask.create({
      type: "prospecting",
      payload: {
        storeId,
        location: cfg.location,
        category: cfg.category,
        customKeyword: cfg.customKeyword,
        radius: cfg.radius,
        maxResults: cfg.maxResults,
      },
      runAt: new Date(),
      status: "pending",
      storeId,
      organizationId: auth.organizationId,
    });
    return NextResponse.json({ taskId: String(task._id), message: "Prospecting encolado ahora" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
