import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICampaignLog extends Document {
  storeId: mongoose.Types.ObjectId;
  campaignId: number;
  campaignName: string;
  channel: "email" | "sms" | "whatsapp" | "telegram" | "push" | "discord" | "slack";
  status: "pending" | "sent" | "delivered" | "opened" | "clicked" | "bounced" | "unsubscribed" | "complained" | "failed";
  recipientId?: mongoose.Types.ObjectId;
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

const CampaignLogSchema = new Schema<ICampaignLog>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true, index: true },
    campaignId: { type: Number, required: true, index: true },
    campaignName: { type: String, required: true },
    channel: { type: String, enum: ["email", "sms", "whatsapp", "telegram", "push", "discord", "slack"], required: true },
    status: { type: String, enum: ["pending", "sent", "delivered", "opened", "clicked", "bounced", "unsubscribed", "complained", "failed"], default: "pending" },
    recipientId: { type: Schema.Types.ObjectId, ref: "Customer" },
    recipientEmail: { type: String },
    recipientPhone: { type: String },
    subject: { type: String },
    content: { type: String },
    batchNumber: { type: Number },
    sentAt: { type: Date },
    deliveredAt: { type: Date },
    openedAt: { type: Date },
    clickedAt: { type: Date },
    bouncedAt: { type: Date },
    unsubscribedAt: { type: Date },
    complainedAt: { type: Date },
    failedAt: { type: Date },
    errorMessage: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

CampaignLogSchema.index({ storeId: 1, campaignId: 1 });
CampaignLogSchema.index({ storeId: 1, createdAt: -1 });
CampaignLogSchema.index({ storeId: 1, status: 1 });
CampaignLogSchema.index({ storeId: 1, recipientEmail: 1 });

const CampaignLog: Model<ICampaignLog> =
  mongoose.models.CampaignLog || mongoose.model<ICampaignLog>("CampaignLog", CampaignLogSchema);

export default CampaignLog;
