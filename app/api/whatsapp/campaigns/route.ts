import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { WhatsAppCampaign, type IWhatsAppCampaign } from "@/lib/models/WhatsAppCampaign";
import { WhatsAppAccount } from "@/lib/models/WhatsAppAccount";
import { WhatsAppTemplate } from "@/lib/models/WhatsAppTemplate";
import { WhatsAppMessage } from "@/lib/models/WhatsAppMessage";
import { getAuthFromHeaders } from "@/lib/auth";
import { canCreateWhatsAppCampaign, incrementDailyCounter, sendWhatsAppMessage, validateWhatsAppSend } from "@/lib/whatsapp-middleware";
import { Store } from "@/lib/models/Store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthFromHeaders(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const url = new URL(req.url);
    const storeId = url.searchParams.get("storeId");
    const status = url.searchParams.get("status");
    if (!storeId) return NextResponse.json({ error: "storeId requerido" }, { status: 400 });

    await connectDB();
    const query: any = { storeId };
    if (status) query.status = status;

    const campaigns = await WhatsAppCampaign.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ campaigns });
  } catch (error: any) {
    return NextResponse.json({ error: "Error al obtener campañas" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthFromHeaders(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await req.json();
    const { storeId, accountId, name, templateName, templateLanguage = "es", templateParams = [], audience, scheduledAt } = body;

    if (!storeId || !accountId || !name || !templateName) {
      return NextResponse.json({ error: "storeId, accountId, name y templateName son requeridos" }, { status: 400 });
    }

    await connectDB();

    const permCheck = await canCreateWhatsAppCampaign(storeId);
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error, code: permCheck.code }, { status: 403 });
    }

    const account = await WhatsAppAccount.findOne({ _id: accountId, storeId, status: "active" });
    if (!account) return NextResponse.json({ error: "Cuenta de WhatsApp no encontrada o inactiva" }, { status: 404 });

    const template = await WhatsAppTemplate.findOne({
      storeId, accountId, name: templateName, status: "approved",
    });
    if (!template) return NextResponse.json({ error: "Plantilla no encontrada o no aprobada" }, { status: 404 });

    let recipientCount = 0;
    if (audience?.type === "all") {
      const store = await Store.findById(storeId).lean().select("customers");
      recipientCount = (store as any)?.customers?.length || 0;
    } else if (audience?.type === "list" && audience.value?.length) {
      recipientCount = audience.value.length;
    }

    const campaign = await WhatsAppCampaign.create({
      storeId,
      accountId,
      name,
      templateName,
      templateLanguage,
      templateParams,
      status: scheduledAt ? "scheduled" : "draft",
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      audience: audience || { type: "all", value: [] },
      recipientCount,
    });

    return NextResponse.json({ success: true, campaign });
  } catch (error: any) {
    console.error("[WA Campaigns] Error:", error?.message);
    return NextResponse.json({ error: "Error al crear campaña" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = getAuthFromHeaders(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await req.json();
    const { storeId, campaignId, action } = body;

    if (!storeId || !campaignId) {
      return NextResponse.json({ error: "storeId y campaignId son requeridos" }, { status: 400 });
    }

    await connectDB();
    const campaign = await WhatsAppCampaign.findOne({ _id: campaignId, storeId });
    if (!campaign) return NextResponse.json({ error: "Campaña no encontrada" }, { status: 404 });

    if (action === "cancel") {
      if (["sent", "failed", "cancelled"].includes(campaign.status)) {
        return NextResponse.json({ error: "No se puede cancelar una campaña en estado: " + campaign.status }, { status: 400 });
      }
      await WhatsAppCampaign.findByIdAndUpdate(campaignId, { status: "cancelled" });
      return NextResponse.json({ success: true });
    }

    if (action === "send") {
      if (campaign.status !== "draft" && campaign.status !== "scheduled") {
        return NextResponse.json({ error: "Solo se pueden enviar campañas en borrador o programadas" }, { status: 400 });
      }

      const permission = await validateWhatsAppSend(storeId, campaign.accountId.toString());
      if (!permission.allowed) {
        return NextResponse.json({ error: permission.error, code: permission.code }, { status: 403 });
      }

      if (!permission.account) {
        return NextResponse.json({ error: "No se encontró la cuenta de WhatsApp" }, { status: 404 });
      }

      const account = permission.account;

      await WhatsAppCampaign.findByIdAndUpdate(campaignId, { status: "sending" });

      let sentCount = 0;
      let failedCount = 0;

      const store = await Store.findById(storeId).lean().select("customers phone");
      const customers = (store as any)?.customers || [];

      let recipients: { phone: string; name?: string }[] = [];

      if (campaign.audience.type === "all") {
        recipients = customers
          .filter((c: any) => c.phone)
          .map((c: any) => ({ phone: c.phone, name: c.name || "" }));
      } else if (campaign.audience.type === "list" && campaign.audience.value?.length) {
        recipients = campaign.audience.value.map((phone: string) => ({ phone }));
      }

      for (const recipient of recipients) {
        try {
          const params = [campaign.templateLanguage, ...campaign.templateParams];
          const result = await sendWhatsAppMessage(account, recipient.phone, {
            type: "template",
            template: {
              name: campaign.templateName,
              language: { code: campaign.templateLanguage },
              components: params.length > 0 ? [{
                type: "body",
                parameters: params.map((p: string) => ({ type: "text", text: p })),
              }] : [],
            },
          });

          if (result.success) {
            sentCount++;
            await incrementDailyCounter(account._id.toString());

            await WhatsAppMessage.create({
              storeId,
              accountId: account._id,
              direction: "outgoing",
              from: account.phoneNumberId,
              to: recipient.phone.replace(/[^0-9]/g, ""),
              messageId: result.messageId || `campaign_${Date.now()}`,
              waId: recipient.phone.replace(/[^0-9]/g, ""),
              type: "template",
              body: campaign.templateName,
              templateName: campaign.templateName,
              templateParams: campaign.templateParams,
              status: "sent",
              providerMessageId: result.messageId,
            });
          } else {
            failedCount++;
          }
        } catch {
          failedCount++;
        }

        await new Promise(r => setTimeout(r, 100));
      }

      await WhatsAppCampaign.findByIdAndUpdate(campaignId, {
        status: "sent",
        sentAt: new Date(),
        "stats.sent": sentCount,
        "stats.failed": failedCount,
      });

      return NextResponse.json({
        success: true,
        sent: sentCount,
        failed: failedCount,
        total: recipients.length,
      });
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch (error: any) {
    console.error("[WA Campaigns] Error:", error?.message);
    return NextResponse.json({ error: "Error en campaña" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = getAuthFromHeaders(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const url = new URL(req.url);
    const campaignId = url.searchParams.get("campaignId");
    const storeId = url.searchParams.get("storeId");

    if (!campaignId || !storeId) return NextResponse.json({ error: "campaignId y storeId requeridos" }, { status: 400 });

    await connectDB();
    const campaign = await WhatsAppCampaign.findOne({ _id: campaignId, storeId });
    if (!campaign) return NextResponse.json({ error: "Campaña no encontrada" }, { status: 404 });

    if (campaign.status === "sending") {
      return NextResponse.json({ error: "No se puede eliminar una campaña en proceso de envío" }, { status: 400 });
    }

    await WhatsAppCampaign.findByIdAndDelete(campaignId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Error al eliminar campaña" }, { status: 500 });
  }
}
