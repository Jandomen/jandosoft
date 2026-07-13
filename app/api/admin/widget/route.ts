import { connectDB } from "@/lib/mongodb";
import { WidgetConfig } from "@/lib/models/WidgetConfig";
import { Store } from "@/lib/models/Store";
import { verifyAdminAuth } from "@/lib/admin-middleware";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const authResult = await verifyAdminAuth(req);
  if ("error" in authResult) return authResult.error;

  try {
    const url = new URL(req.url);
    const storeId = url.searchParams.get("storeId");

    if (!storeId) {
      return Response.json({ error: "storeId is required" }, { status: 400 });
    }

    await connectDB();

    const store = await Store.findById(storeId).lean();
    if (!store) {
      return Response.json({ error: "Store not found" }, { status: 404 });
    }

    let config = await WidgetConfig.findOne({ storeId }).lean();

    if (!config) {
      config = {
        storeId,
        slug: (store as any).slug || "",
        enabled: (store as any).publicAI ?? true,
        title: "Asistente IA",
        welcomeMessage:
          "¡Hola! Soy tu asistente virtual. ¿En qué puedo ayudarte?",
        placeholder: "Escribe tu mensaje...",
        primaryColor: "#dc2626",
        secondaryColor: "#f5f5f5",
        textColor: "#1a1a1a",
        position: "bottom-right",
        logo: "",
        headerText: "",
      };
    }

    return Response.json({ config, storeName: (store as any).name, slug: (store as any).slug });
  } catch (error) {
    console.error("Widget config GET error:", error);
    return Response.json({ error: "Error loading widget config" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const authResult = await verifyAdminAuth(req);
  if ("error" in authResult) return authResult.error;

  try {
    const body = await req.json();
    const { storeId, ...updates } = body;

    if (!storeId) {
      return Response.json({ error: "storeId is required" }, { status: 400 });
    }

    await connectDB();

    const store = await Store.findById(storeId);
    if (!store) {
      return Response.json({ error: "Store not found" }, { status: 404 });
    }

    const allowedFields = [
      "enabled",
      "title",
      "welcomeMessage",
      "placeholder",
      "primaryColor",
      "secondaryColor",
      "textColor",
      "position",
      "logo",
      "headerText",
    ];

    const cleanUpdates: Record<string, any> = {};
    for (const key of allowedFields) {
      if (key in updates) {
        cleanUpdates[key] = updates[key];
      }
    }

    if (Object.keys(cleanUpdates).length === 0) {
      return Response.json({ error: "No valid fields to update" }, { status: 400 });
    }

    cleanUpdates.slug = (store as any).slug;

    const config = await WidgetConfig.findOneAndUpdate(
      { storeId },
      { $set: cleanUpdates },
      { upsert: true, new: true }
    );

    const shouldEnableAI = updates.enabled !== undefined ? updates.enabled : (store as any).publicAI;
    if (updates.enabled !== undefined && (store as any).publicAI !== shouldEnableAI) {
      await Store.findByIdAndUpdate(storeId, { publicAI: shouldEnableAI });
    }

    return Response.json({ success: true, config });
  } catch (error) {
    console.error("Widget config PUT error:", error);
    return Response.json({ error: "Error saving widget config" }, { status: 500 });
  }
}
