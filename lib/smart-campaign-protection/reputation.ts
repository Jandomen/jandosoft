import mongoose from "mongoose";

export interface ReputationMetrics {
  totalSent30d: number;
  totalBounced30d: number;
  totalUnsubscribed30d: number;
  totalComplaints30d: number;
  bounceRate: number;
  unsubscribeRate: number;
  complaintRate: number;
  domainHealth: "excellent" | "good" | "fair" | "poor" | "critical";
}

export async function getReputationMetrics(storeId: string): Promise<ReputationMetrics> {
  const EmailLog = mongoose.model("EmailLog");
  const Communication = mongoose.model("Communication");
  const storeObjectId = new mongoose.Types.ObjectId(storeId);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const totalSent30d = await EmailLog.countDocuments({
    storeId: storeObjectId,
    createdAt: { $gte: thirtyDaysAgo },
    status: { $ne: "failed" }
  });

  const totalBounced30d = await EmailLog.countDocuments({
    storeId: storeObjectId,
    createdAt: { $gte: thirtyDaysAgo },
    status: "bounced"
  });

  const totalUnsubscribed30d = await Communication.countDocuments({
    storeId: storeObjectId,
    createdAt: { $gte: thirtyDaysAgo },
    status: "unsubscribed"
  });

  const totalComplaints30d = await EmailLog.countDocuments({
    storeId: storeObjectId,
    createdAt: { $gte: thirtyDaysAgo },
    status: "complained"
  });

  const bounceRate = totalSent30d > 0 ? (totalBounced30d / totalSent30d) * 100 : 0;
  const unsubscribeRate = totalSent30d > 0 ? (totalUnsubscribed30d / totalSent30d) * 100 : 0;
  const complaintRate = totalSent30d > 0 ? (totalComplaints30d / totalSent30d) * 100 : 0;

  let domainHealth: ReputationMetrics["domainHealth"];
  if (bounceRate < 2 && complaintRate < 0.1) domainHealth = "excellent";
  else if (bounceRate < 5 && complaintRate < 0.3) domainHealth = "good";
  else if (bounceRate < 10 && complaintRate < 0.5) domainHealth = "fair";
  else if (bounceRate < 15 && complaintRate < 1) domainHealth = "poor";
  else domainHealth = "critical";

  return {
    totalSent30d,
    totalBounced30d,
    totalUnsubscribed30d,
    totalComplaints30d,
    bounceRate: Math.round(bounceRate * 10) / 10,
    unsubscribeRate: Math.round(unsubscribeRate * 10) / 10,
    complaintRate: Math.round(complaintRate * 100) / 100,
    domainHealth
  };
}

export async function getBouncedEmails(storeId: string): Promise<string[]> {
  const EmailLog = mongoose.model("EmailLog");
  const storeObjectId = new mongoose.Types.ObjectId(storeId);

  const bounced = await EmailLog.find({
    storeId: storeObjectId,
    status: "bounced"
  }).distinct("to");

  return bounced as string[];
}

export async function getUnsubscribedEmails(storeId: string): Promise<string[]> {
  const Communication = mongoose.model("Communication");
  const storeObjectId = new mongoose.Types.ObjectId(storeId);

  const unsubscribed = await Communication.find({
    storeId: storeObjectId,
    status: "unsubscribed"
  }).distinct("to");

  return unsubscribed as string[];
}
