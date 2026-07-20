import { Types } from "mongoose";

// ── Core Types ──
export type ChannelType = "email" | "sms" | "whatsapp" | "telegram" | "push" | "discord" | "slack";

export type AudienceSegment =
  | "all"
  | "new"
  | "frequent"
  | "vip"
  | "inactive"
  | "recent_purchasers"
  | "no_purchase_days"
  | "upcoming_appointments"
  | "birthday"
  | "custom";

export type RiskLevel = "excellent" | "good" | "medium" | "high" | "critical";

export type CampaignStatus = "draft" | "validated" | "scheduled" | "sending" | "sent" | "paused" | "cancelled" | "failed";

export type LogStatus = "pending" | "sent" | "delivered" | "opened" | "clicked" | "bounced" | "unsubscribed" | "complained" | "failed";

// ── Protection Settings ──
export interface ProtectionSettings {
  enabled: boolean;
  cooldownHours: number;           // default 24
  maxDailyEmails: number;          // default 200
  maxDailySms: number;             // default 50
  maxDailyWhatsapp: number;        // default 100
  batchSize: number;               // default 50
  batchDelaySeconds: number;       // default 30
  autoExcludeBounced: boolean;     // default true
  autoExcludeUnsubscribed: boolean; // default true
  autoExcludeNoContact: boolean;   // default true
  minHealthScore: number;          // minimum score to allow sending (default 30)
  autoSegmentation: boolean;       // default true
}

export const DEFAULT_PROTECTION_SETTINGS: ProtectionSettings = {
  enabled: true,
  cooldownHours: 24,
  maxDailyEmails: 200,
  maxDailySms: 50,
  maxDailyWhatsapp: 100,
  batchSize: 50,
  batchDelaySeconds: 30,
  autoExcludeBounced: true,
  autoExcludeUnsubscribed: true,
  autoExcludeNoContact: true,
  minHealthScore: 30,
  autoSegmentation: true,
};

// ── Validation ──
export interface ValidationResult {
  valid: boolean;
  risk: RiskLevel;
  warnings: ValidationWarning[];
  score: number; // 0-100
}

export interface ValidationWarning {
  code: string;
  message: string;
  severity: "info" | "warning" | "danger";
  suggestion?: string;
}

// ── Segmentation ──
export interface SegmentFilter {
  segment: AudienceSegment;
  label: string;
  description: string;
  criteria?: {
    daysSincePurchase?: number;
    minSpent?: number;
    minOrders?: number;
    tags?: string[];
    customQuery?: Record<string, any>;
  };
}

export interface SegmentResult {
  segment: AudienceSegment;
  label: string;
  count: number;
  customerIds: Types.ObjectId[];
  excludedCount: number;
  excludedReasons: Record<string, number>;
}

// ── Batching ──
export interface BatchConfig {
  totalRecipients: number;
  batchSize: number;
  batchDelaySeconds: number;
  estimatedBatches: number;
  estimatedDurationMinutes: number;
}

export interface BatchInfo {
  batchNumber: number;
  recipients: Types.ObjectId[];
  scheduledAt: Date;
  status: "pending" | "sending" | "sent" | "failed";
}

// ── Health Score ──
export interface HealthScoreResult {
  score: number; // 0-100
  level: RiskLevel;
  label: string;
  icon: string;
  breakdown: {
    sendFrequency: number;    // 0-20
    audienceSize: number;     // 0-20
    bounceHistory: number;    // 0-20
    unsubscribeHistory: number; // 0-20
    engagement: number;       // 0-20
  };
  factors: string[];
}

// ── Recommendations ──
export interface Recommendation {
  id: string;
  type: "frequency" | "segmentation" | "batching" | "timing" | "subject" | "content" | "general";
  priority: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  impact: string;
  autoFixAvailable: boolean;
  autoFixAction?: string;
}

// ── Simulation ──
export interface SimulationResult {
  totalRecipients: number;
  excludedRecipients: number;
  excludedBreakdown: {
    bounced: number;
    unsubscribed: number;
    noContact: number;
    cooldown: number;
    invalidEmail: number;
    invalidPhone: number;
  };
  batches: BatchConfig;
  risk: RiskLevel;
  healthScore: HealthScoreResult;
  estimatedCost: {
    email: number;
    sms: number;
    whatsapp: number;
  };
  estimatedDuration: string;
  nextExecution: Date;
  recipients: SimulationRecipient[];
  recommendations: Recommendation[];
}

export interface SimulationRecipient {
  id: Types.ObjectId;
  name: string;
  email?: string;
  phone?: string;
  segment: AudienceSegment;
  status: "will_receive" | "excluded";
  excludeReason?: string;
}

// ── Campaign Log ──
export interface ICampaignLog {
  storeId: Types.ObjectId;
  campaignId: number;
  campaignName: string;
  channel: ChannelType;
  status: LogStatus;
  recipientId?: Types.ObjectId;
  recipientEmail?: string;
  recipientPhone?: string;
  subject?: string;
  content?: string;
  batchNumber?: number;
  sentAt?: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  bouncedAt?: Date;
  unsubscribedAt?: Date;
  complainedAt?: Date;
  failedAt?: Date;
  errorMessage?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

// ── Protection Engine Request/Response ──
export interface ValidateRequest {
  storeId: string;
  channel: ChannelType;
  subject?: string;
  content: string;
  audience: AudienceSegment;
  customSegmentIds?: string[];
}

export interface SimulateRequest extends ValidateRequest {
  scheduledAt?: string;
}

export interface SendWithProtectionRequest extends ValidateRequest {
  campaignId: number;
  campaignName: string;
  scheduledAt?: string;
}

export interface ProtectionResponse {
  success: boolean;
  data?: any;
  error?: string;
}
