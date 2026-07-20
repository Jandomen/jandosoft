import mongoose from "mongoose";
import { ProtectionSettings, DEFAULT_PROTECTION_SETTINGS, ChannelType } from "./types";

export async function checkCooldown(
  storeId: string,
  customerId: string,
  settings: ProtectionSettings = DEFAULT_PROTECTION_SETTINGS
): Promise<{ allowed: boolean; nextAvailableAt?: Date; hoursRemaining?: number }> {
  // Check Communication model for recent messages to this customer
  const Communication = mongoose.model("Communication");
  const cutoff = new Date(Date.now() - settings.cooldownHours * 60 * 60 * 1000);
  
  const recentMessage = await Communication.findOne({
    storeId: new mongoose.Types.ObjectId(storeId),
    customerId: new mongoose.Types.ObjectId(customerId),
    direction: "sent",
    createdAt: { $gte: cutoff }
  }).sort({ createdAt: -1 });

  if (recentMessage) {
    const nextAvailable = new Date((recentMessage as any).createdAt.getTime() + settings.cooldownHours * 60 * 60 * 1000);
    const hoursRemaining = Math.max(0, (nextAvailable.getTime() - Date.now()) / (1000 * 60 * 60));
    return { allowed: false, nextAvailableAt: nextAvailable, hoursRemaining };
  }

  return { allowed: true };
}

export async function checkDailyLimit(
  storeId: string,
  channel: ChannelType,
  settings: ProtectionSettings = DEFAULT_PROTECTION_SETTINGS
): Promise<{ allowed: boolean; sentToday: number; limit: number; remaining: number }> {
  const EmailLog = mongoose.model("EmailLog");
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  let limit: number;
  let queryFilter: Record<string, any>;

  if (channel === "email") {
    limit = settings.maxDailyEmails;
    queryFilter = { storeId: new mongoose.Types.ObjectId(storeId), createdAt: { $gte: todayStart }, status: { $ne: "failed" } };
  } else if (channel === "sms") {
    limit = settings.maxDailySms;
    queryFilter = { storeId: new mongoose.Types.ObjectId(storeId), createdAt: { $gte: todayStart }, template: "sms" };
  } else {
    limit = settings.maxDailyWhatsapp;
    queryFilter = { storeId: new mongoose.Types.ObjectId(storeId), createdAt: { $gte: todayStart }, template: "whatsapp" };
  }

  const sentToday = await EmailLog.countDocuments(queryFilter);
  const remaining = Math.max(0, limit - sentToday);

  return { allowed: sentToday < limit, sentToday, limit, remaining };
}

export async function getRecentCampaignCount(storeId: string, days: number = 7): Promise<number> {
  const EmailLog = mongoose.model("EmailLog");
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  const result = await EmailLog.aggregate([
    { $match: { storeId: new mongoose.Types.ObjectId(storeId), createdAt: { $gte: cutoff }, status: { $ne: "failed" } } },
    { $group: { _id: "$template" } }
  ]);

  return result.length;
}
