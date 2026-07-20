export { validateCampaign } from "./validation";
export { checkCooldown, checkDailyLimit, getRecentCampaignCount } from "./limits";
export { getSegmentCustomers, applyExclusions, SEGMENT_DEFINITIONS } from "./segmentation";
export { calculateBatches, createBatches, estimateDuration } from "./batching";
export { getReputationMetrics, getBouncedEmails, getUnsubscribedEmails } from "./reputation";
export { calculateHealthScore } from "./health-score";
export { generateRecommendations } from "./recommendations";
export { simulateCampaign } from "./simulation";
export * from "./types";
