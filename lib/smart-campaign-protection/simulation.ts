import { SimulationResult, SimulationRecipient, ValidateRequest, ProtectionSettings, DEFAULT_PROTECTION_SETTINGS, ChannelType, AudienceSegment } from "./types";
import { validateCampaign } from "./validation";
import { checkCooldown, checkDailyLimit, getRecentCampaignCount } from "./limits";
import { getSegmentCustomers, applyExclusions } from "./segmentation";
import { calculateBatches } from "./batching";
import { getReputationMetrics } from "./reputation";
import { calculateHealthScore } from "./health-score";
import { generateRecommendations } from "./recommendations";
import mongoose from "mongoose";

export async function simulateCampaign(
  request: ValidateRequest,
  settings: ProtectionSettings = DEFAULT_PROTECTION_SETTINGS
): Promise<SimulationResult> {
  const { storeId, channel, subject, content, audience } = request;

  // 1. Get segment customers
  const segmentResult = await getSegmentCustomers(storeId, audience);

  // 2. Apply exclusions
  const exclusions = await applyExclusions(storeId, segmentResult.customerIds, {
    autoExcludeBounced: settings.autoExcludeBounced,
    autoExcludeUnsubscribed: settings.autoExcludeUnsubscribed,
    autoExcludeNoContact: settings.autoExcludeNoContact
  });

  // 3. Check cooldown for each remaining customer
  const Customer = mongoose.model("Customer");
  const includedCustomers = await Customer.find({ _id: { $in: exclusions.included } }).select("_id name email phone");

  const willReceive: SimulationRecipient[] = [];
  const cooldownExcluded: SimulationRecipient[] = [];

  for (const cust of includedCustomers) {
    const cooldown = await checkCooldown(storeId, (cust as any)._id.toString(), settings);
    if (cooldown.allowed) {
      willReceive.push({
        id: (cust as any)._id,
        name: (cust as any).name,
        email: (cust as any).email,
        phone: (cust as any).phone,
        segment: audience,
        status: "will_receive"
      });
    } else {
      cooldownExcluded.push({
        id: (cust as any)._id,
        name: (cust as any).name,
        email: (cust as any).email,
        phone: (cust as any).phone,
        segment: audience,
        status: "excluded",
        excludeReason: `Cooldown: próximo envío en ${cooldown.hoursRemaining?.toFixed(1)}h`
      });
    }
  }

  // 4. Validation
  const validation = validateCampaign({
    channel,
    subject,
    content,
    audienceSize: willReceive.length,
    recentCampaignCount: await getRecentCampaignCount(storeId),
    avgOpenRate: 0,
    avgBounceRate: 0
  });

  // 5. Health score
  const healthScore = await calculateHealthScore(storeId);

  // 6. Reputation
  const reputation = await getReputationMetrics(storeId);

  // 7. Batching
  const batches = calculateBatches(willReceive.length, settings.batchSize, settings.batchDelaySeconds);

  // 8. Daily limit check
  const dailyLimit = await checkDailyLimit(storeId, channel, settings);

  // 9. Estimated cost
  const estimatedCost = { email: 0, sms: 0, whatsapp: 0 };
  if (channel === "email") estimatedCost.email = willReceive.length * 0.001;
  else if (channel === "sms") estimatedCost.sms = willReceive.length * 0.01;
  else if (channel === "whatsapp") estimatedCost.whatsapp = willReceive.length * 0.005;

  // 10. Next execution
  const nextExecution = new Date();
  if (hourIsOffHours()) {
    nextExecution.setHours(9, 0, 0, 0);
    if (nextExecution <= new Date()) nextExecution.setDate(nextExecution.getDate() + 1);
  }

  // 11. Recommendations
  const recommendations = generateRecommendations({
    validation,
    healthScore,
    reputation,
    audienceSize: willReceive.length,
    recentCampaignCount: await getRecentCampaignCount(storeId),
    channel,
    subject,
    content
  });

  // Combine all excluded
  const allRecipients: SimulationRecipient[] = [
    ...willReceive.map(r => ({ ...r, status: "will_receive" as const })),
    ...cooldownExcluded,
    ...exclusions.reasons.bounced > 0 ? [] : [],
    ...exclusions.reasons.unsubscribed > 0 ? [] : []
  ];

  const duration = willReceive.length > 0
    ? `${batches.estimatedDurationMinutes} min`
    : "0 seg";

  return {
    totalRecipients: segmentResult.count,
    excludedRecipients: segmentResult.count - willReceive.length,
    excludedBreakdown: {
      bounced: exclusions.reasons.bounced || 0,
      unsubscribed: exclusions.reasons.unsubscribed || 0,
      noContact: exclusions.reasons.noContact || 0,
      cooldown: cooldownExcluded.length,
      invalidEmail: exclusions.reasons.invalidEmail || 0,
      invalidPhone: 0
    },
    batches,
    risk: validation.risk,
    healthScore,
    estimatedCost,
    estimatedDuration: duration,
    nextExecution,
    recipients: allRecipients.slice(0, 100), // Limit for UI performance
    recommendations
  };
}

function hourIsOffHours(): boolean {
  const hour = new Date().getHours();
  return hour < 8 || hour > 20;
}
