import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { WhatsAppAccount, type IWhatsAppAccount } from "@/lib/models/WhatsAppAccount";
import { WhatsAppMessage } from "@/lib/models/WhatsAppMessage";
import { WhatsAppConversation } from "@/lib/models/WhatsAppConversation";
import { WhatsAppContact } from "@/lib/models/WhatsAppContact";
import { Store } from "@/lib/models/Store";
import { Customer } from "@/lib/models/Customer";
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

export async function validateWhatsAppSend(storeId: string, accountId?: string): Promise<WhatsAppPermissionResult> {
  await connectDB();

  const store = await Store.findById(storeId).lean().select("subscription").catch(() => null);
  if (!store) return { allowed: false, error: "Tienda no encontrada", code: "STORE_NOT_FOUND" };

  const subscription = (store as any).subscription || "free";
  const limits = getPlanLimits(subscription);

  if (limits.maxWhatsAppNumbers <= 0) {
    return { allowed: false, error: "Tu plan no incluye WhatsApp Business. Actualiza tu plan para usar WhatsApp.", code: "PLAN_NO_WHATSAPP", limits };
  }

  const accountsUsed = await WhatsAppAccount.countDocuments({ storeId, status: { $in: ["active", "pending"] } });
  if (accountsUsed >= limits.maxWhatsAppNumbers) {
    return { allowed: false, error: `Has alcanzado el limite de ${limits.maxWhatsAppNumbers} numero(s) de WhatsApp en tu plan.`, code: "LIMIT_WHATSAPP_NUMBERS", limits, accountsUsed };
  }

  let accountQuery: any = { storeId, status: "active" };
  if (accountId) accountQuery._id = accountId;

  const account = await WhatsAppAccount.findOne(accountQuery).lean();
  if (!account) return { allowed: false, error: "No hay cuenta de WhatsApp Business conectada.", code: "NO_ACCOUNT", limits };

  if (account.qualityRating === "red") {
    return { allowed: false, error: "Tu numero de WhatsApp tiene calidad RED. Meta ha restringido el envio.", code: "QUALITY_RED", limits, account };
  }

  const now = new Date();
  const lastReset = new Date(account.lastMessageResetAt);
  const isNewDay = now.toDateString() !== lastReset.toDateString();

  let dailySent = account.messagesSentToday;
  if (isNewDay) {
    dailySent = 0;
    await WhatsAppAccount.findByIdAndUpdate(account._id, { messagesSentToday: 0, lastMessageResetAt: now });
  }

  if (dailySent >= limits.maxWhatsAppMessagesPerDay) {
    return { allowed: false, error: `Has alcanzado el limite de ${limits.maxWhatsAppMessagesPerDay} mensajes de WhatsApp por dia.`, code: "LIMIT_DAILY_MESSAGES", limits, account, dailyRemaining: 0 };
  }

  return { allowed: true, account, limits, dailyRemaining: limits.maxWhatsAppMessagesPerDay - dailySent };
}

export async function incrementDailyCounter(accountId: string): Promise<void> {
  await WhatsAppAccount.findByIdAndUpdate(accountId, { $inc: { messagesSentToday: 1 } });
}

export async function resetDailyCounters(): Promise<void> {
  await connectDB();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  await WhatsAppAccount.updateMany({ lastMessageResetAt: { $lt: today } }, { messagesSentToday: 0, lastMessageResetAt: new Date() });
}

export async function upsertConversation(
  storeId: string,
  accountId: string,
  waId: string,
  customerName: string,
  customerPhone: string,
  lastMessage: string,
  direction: "incoming" | "outgoing"
): Promise<string> {
  await connectDB();

  let contact = await WhatsAppContact.findOne({ storeId, waId });
  if (!contact) {
    let customerId: any = null;
    if (customerPhone) {
      const existingCustomer = await Customer.findOne({ storeId, phone: customerPhone });
      if (existingCustomer) customerId = existingCustomer._id;
    }

    contact = await WhatsAppContact.create({
      storeId,
      waId,
      customerId,
      name: customerName,
      phone: customerPhone,
      lastSeen: new Date(),
      messageCount: 1,
    });
  } else {
    const update: any = { lastSeen: new Date(), $inc: { messageCount: 1 } };
    if (customerName && !contact.name) update.name = customerName;
    if (customerPhone && !contact.phone) update.phone = customerPhone;
    await WhatsAppContact.findByIdAndUpdate(contact._id, update);
  }

  let conversation = await WhatsAppConversation.findOne({ storeId, waId });
  if (!conversation) {
    conversation = await WhatsAppConversation.create({
      storeId,
      accountId,
      waId,
      customerName: contact.name || customerName,
      customerPhone: contact.phone || customerPhone,
      customerId: contact.customerId,
      status: "open",
      lastMessageAt: new Date(),
      lastMessagePreview: lastMessage.slice(0, 100),
      unreadCount: direction === "incoming" ? 1 : 0,
    });
  } else {
    const update: any = {
      lastMessageAt: new Date(),
      lastMessagePreview: lastMessage.slice(0, 100),
    };
    if (direction === "incoming") update.$inc = { unreadCount: 1 };
    await WhatsAppConversation.findByIdAndUpdate(conversation._id, update);
  }

  return conversation._id.toString();
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
  if (!res.ok) return { success: false, error: data.error?.message || `HTTP ${res.status}` };
  return { success: true, messageId: data.messages?.[0]?.id };
}
