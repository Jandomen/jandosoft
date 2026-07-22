import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { WhatsAppAccount, type IWhatsAppAccount } from "@/lib/models/WhatsAppAccount";
import { WhatsAppMessage } from "@/lib/models/WhatsAppMessage";
import { Store } from "@/lib/models/Store";
import { getPlanLimits, type PlanLimits } from "@/lib/plans";

export interface WhatsAppPermissionResult {
  allowed: boolean;
  error?: string;
  code?: string;
  account?: IWhatsAppAccount;
  limits?: PlanLimits;
  dailyRemaining?: number;
  accountsUsed?: number;
}

export interface WhatsAppSendContext {
  account: IWhatsAppAccount;
  limits: PlanLimits;
  dailyRemaining: number;
}

export async function getWhatsAppAccount(storeId: string, phoneNumberId?: string): Promise<IWhatsAppAccount | null> {
  await connectDB();
  const query: any = { storeId, status: "active" };
  if (phoneNumberId) query.phoneNumberId = phoneNumberId;
  return WhatsAppAccount.findOne(query).lean();
}

export async function getWhatsAppAccountByPhoneNumberId(phoneNumberId: string): Promise<IWhatsAppAccount | null> {
  await connectDB();
  return WhatsAppAccount.findOne({ phoneNumberId, status: "active" }).lean();
}

export async function getWhatsAppAccountByWabaId(wabaId: string, phoneNumberId?: string): Promise<IWhatsAppAccount | null> {
  await connectDB();
  const query: any = { wabaId, status: "active" };
  if (phoneNumberId) query.phoneNumberId = phoneNumberId;
  return WhatsAppAccount.findOne(query).lean();
}

export async function validateWhatsAppSend(
  storeId: string,
  accountId?: string
): Promise<WhatsAppPermissionResult> {
  await connectDB();

  const store = await Store.findById(storeId).lean().select("subscription").catch(() => null);
  if (!store) {
    return { allowed: false, error: "Tienda no encontrada", code: "STORE_NOT_FOUND" };
  }

  const subscription = (store as any).subscription || "free";
  const limits = getPlanLimits(subscription);

  if (limits.maxWhatsAppNumbers <= 0) {
    return {
      allowed: false,
      error: "Tu plan no incluye WhatsApp Business. Actualiza tu plan para usar WhatsApp.",
      code: "PLAN_NO_WHATSAPP",
      limits,
    };
  }

  const accountsUsed = await WhatsAppAccount.countDocuments({ storeId, status: { $in: ["active", "pending"] } });
  if (accountsUsed >= limits.maxWhatsAppNumbers) {
    return {
      allowed: false,
      error: `Has alcanzado el límite de ${limits.maxWhatsAppNumbers} número(s) de WhatsApp en tu plan. Actualiza tu plan para agregar más.`,
      code: "LIMIT_WHATSAPP_NUMBERS",
      limits,
      accountsUsed,
    };
  }

  let accountQuery: any = { storeId, status: "active" };
  if (accountId) accountQuery._id = accountId;

  const account = await WhatsAppAccount.findOne(accountQuery).lean();
  if (!account) {
    return {
      allowed: false,
      error: "No hay cuenta de WhatsApp Business conectada. Conecta tu número primero.",
      code: "NO_ACCOUNT",
      limits,
    };
  }

  if (account.qualityRating === "red") {
    return {
      allowed: false,
      error: "Tu número de WhatsApp tiene calidad RED. Meta ha restringido el envío. Revisa tu Business Manager.",
      code: "QUALITY_RED",
      limits,
      account,
    };
  }

  const now = new Date();
  const lastReset = new Date(account.lastMessageResetAt);
  const isNewDay = now.toDateString() !== lastReset.toDateString();

  let dailySent = account.messagesSentToday;
  if (isNewDay) {
    dailySent = 0;
    await WhatsAppAccount.findByIdAndUpdate(account._id, {
      messagesSentToday: 0,
      lastMessageResetAt: now,
    });
  }

  if (dailySent >= limits.maxWhatsAppMessagesPerDay) {
    return {
      allowed: false,
      error: `Has alcanzado el límite de ${limits.maxWhatsAppMessagesPerDay} mensajes de WhatsApp por día en tu plan. Se restablece mañana.`,
      code: "LIMIT_DAILY_MESSAGES",
      limits,
      account,
      dailyRemaining: 0,
    };
  }

  return {
    allowed: true,
    account,
    limits,
    dailyRemaining: limits.maxWhatsAppMessagesPerDay - dailySent,
  };
}

export async function incrementDailyCounter(accountId: string): Promise<void> {
  await WhatsAppAccount.findByIdAndUpdate(accountId, {
    $inc: { messagesSentToday: 1 },
  });
}

export async function resetDailyCounters(): Promise<void> {
  await connectDB();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await WhatsAppAccount.updateMany(
    { lastMessageResetAt: { $lt: today } },
    { messagesSentToday: 0, lastMessageResetAt: new Date() }
  );
}

export async function canCreateWhatsAppCampaign(storeId: string): Promise<{ allowed: boolean; error?: string; code?: string }> {
  await connectDB();

  const store = await Store.findById(storeId).lean().select("subscription").catch(() => null);
  if (!store) return { allowed: false, error: "Tienda no encontrada", code: "STORE_NOT_FOUND" };

  const subscription = (store as any).subscription || "free";
  const limits = getPlanLimits(subscription);

  if (limits.maxWhatsAppCampaigns <= 0) {
    return {
      allowed: false,
      error: "Tu plan no incluye campañas de WhatsApp. Actualiza tu plan.",
      code: "PLAN_NO_WHATSAPP_CAMPAIGNS",
    };
  }

  const { WhatsAppCampaign } = await import("@/lib/models/WhatsAppCampaign");
  const activeCampaigns = await WhatsAppCampaign.countDocuments({
    storeId,
    status: { $in: ["draft", "scheduled", "sending"] },
  });

  if (activeCampaigns >= limits.maxWhatsAppCampaigns) {
    return {
      allowed: false,
      error: `Has alcanzado el límite de ${limits.maxWhatsAppCampaigns} campaña(s) activas en tu plan.`,
      code: "LIMIT_WHATSAPP_CAMPAIGNS",
    };
  }

  return { allowed: true };
}

export function checkTemplatePermission(limits: PlanLimits, currentCount: number): { allowed: boolean; remaining: number } {
  const remaining = Math.max(0, limits.maxWhatsAppTemplates - currentCount);
  return { allowed: currentCount < limits.maxWhatsAppTemplates || limits.maxWhatsAppTemplates >= 999, remaining };
}

export async function sendWhatsAppMessage(
  account: IWhatsAppAccount,
  to: string,
  payload: any
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const phoneNumberId = account.phoneNumberId;
  const accessToken = account.accessToken;

  const res = await fetch(`https://graph.facebook.com/v22.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: to.replace(/[^0-9]/g, ""),
      recipient_type: "individual",
      ...payload,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    const errMsg = data.error?.message || `HTTP ${res.status}`;
    return { success: false, error: errMsg };
  }

  const waMessage = data.messages?.[0];
  return { success: true, messageId: waMessage?.id };
}
