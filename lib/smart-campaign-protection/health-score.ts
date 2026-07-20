import mongoose from "mongoose";
import { HealthScoreResult, RiskLevel } from "./types";

export async function calculateHealthScore(storeId: string): Promise<HealthScoreResult> {
  const EmailLog = mongoose.model("EmailLog");
  const Communication = mongoose.model("Communication");
  const storeObjectId = new mongoose.Types.ObjectId(storeId);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // 1. Send Frequency (0-20): Lower is better
  const emailsLast7d = await EmailLog.countDocuments({
    storeId: storeObjectId,
    createdAt: { $gte: sevenDaysAgo },
    status: { $ne: "failed" }
  });
  const sendFrequency = emailsLast7d <= 10 ? 20 : emailsLast7d <= 30 ? 15 : emailsLast7d <= 50 ? 10 : emailsLast7d <= 100 ? 5 : 0;

  // 2. Audience Size (0-20): Moderate is best
  const Customer = mongoose.model("Customer");
  const totalCustomers = await Customer.countDocuments({ storeId: storeObjectId });
  const audienceSize = totalCustomers >= 10 && totalCustomers <= 1000 ? 20 : totalCustomers > 1000 ? 15 : totalCustomers >= 5 ? 10 : 5;

  // 3. Bounce History (0-20): Lower bounce rate is better
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
  const bounceRate = totalSent30d > 0 ? (totalBounced30d / totalSent30d) * 100 : 0;
  const bounceHistory = bounceRate < 2 ? 20 : bounceRate < 5 ? 15 : bounceRate < 10 ? 10 : bounceRate < 15 ? 5 : 0;

  // 4. Unsubscribe History (0-20)
  const totalUnsub30d = await Communication.countDocuments({
    storeId: storeObjectId,
    createdAt: { $gte: thirtyDaysAgo },
    status: "unsubscribed"
  });
  const unsubRate = totalSent30d > 0 ? (totalUnsub30d / totalSent30d) * 100 : 0;
  const unsubscribeHistory = unsubRate < 0.5 ? 20 : unsubRate < 1 ? 15 : unsubRate < 2 ? 10 : unsubRate < 5 ? 5 : 0;

  // 5. Engagement (0-20): Opens + Clicks
  const totalOpened30d = await EmailLog.countDocuments({
    storeId: storeObjectId,
    createdAt: { $gte: thirtyDaysAgo },
    status: "opened"
  });
  const totalClicked30d = await EmailLog.countDocuments({
    storeId: storeObjectId,
    createdAt: { $gte: thirtyDaysAgo },
    status: "clicked"
  });
  const openRate = totalSent30d > 0 ? (totalOpened30d / totalSent30d) * 100 : 0;
  const clickRate = totalSent30d > 0 ? (totalClicked30d / totalSent30d) * 100 : 0;
  const engagement = Math.min(20, Math.floor(openRate / 2.5 + clickRate * 2));

  const score = sendFrequency + audienceSize + bounceHistory + unsubscribeHistory + engagement;
  const clampedScore = Math.max(0, Math.min(100, score));

  let level: RiskLevel;
  let label: string;
  let icon: string;

  if (clampedScore >= 80) { level = "excellent"; label = "Excelente"; icon = "🟢"; }
  else if (clampedScore >= 60) { level = "good"; label = "Bueno"; icon = "🟢"; }
  else if (clampedScore >= 40) { level = "medium"; label = "Riesgo Medio"; icon = "🟡"; }
  else if (clampedScore >= 20) { level = "high"; label = "Riesgo Alto"; icon = "🔴"; }
  else { level = "critical"; label = "Crítico"; icon = "🔴"; }

  const factors: string[] = [];
  if (sendFrequency < 10) factors.push("Estás enviando demasiados correos. Reduce la frecuencia.");
  if (bounceRate > 5) factors.push(`Tasa de rebote alta (${bounceRate.toFixed(1)}%). Limpia tu lista.`);
  if (unsubRate > 1) factors.push(`Muchas desuscripciones (${unsubRate.toFixed(1)}%). Revisa tu contenido.`);
  if (engagement < 8) factors.push("Baja tasa de apertura. Mejora tus asuntos.");

  return {
    score: clampedScore,
    level,
    label,
    icon,
    breakdown: { sendFrequency, audienceSize, bounceHistory, unsubscribeHistory, engagement },
    factors
  };
}
