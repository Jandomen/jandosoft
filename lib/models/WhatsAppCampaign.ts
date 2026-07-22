import mongoose, { Schema, Document } from "mongoose";

export interface IWhatsAppCampaign extends Document {
  storeId: mongoose.Types.ObjectId;
  accountId: mongoose.Types.ObjectId;
  name: string;
  templateName: string;
  templateLanguage: string;
  templateParams: string[];
  status: "draft" | "scheduled" | "sending" | "sent" | "failed" | "cancelled";
  scheduledAt?: Date;
  sentAt?: Date;
  audience: {
    type: "all" | "segment" | "tags" | "list";
    value: string[];
  };
  recipientCount: number;
  stats: {
    sent: number;
    delivered: number;
    read: number;
    failed: number;
  };
  errorMessage?: string;
  broadcastId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WhatsAppCampaignSchema = new Schema<IWhatsAppCampaign>({
  storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true, index: true },
  accountId: { type: Schema.Types.ObjectId, ref: "WhatsAppAccount", required: true, index: true },
  name: { type: String, required: true },
  templateName: { type: String, required: true },
  templateLanguage: { type: String, default: "es" },
  templateParams: { type: [String], default: [] },
  status: { type: String, enum: ["draft", "scheduled", "sending", "sent", "failed", "cancelled"], default: "draft", index: true },
  scheduledAt: { type: Date, default: null },
  sentAt: { type: Date, default: null },
  audience: {
    type: {
      type: { type: String, enum: ["all", "segment", "tags", "list"], default: "all" },
      value: { type: [String], default: [] },
    },
    default: { type: "all", value: [] },
  },
  recipientCount: { type: Number, default: 0 },
  stats: {
    type: {
      sent: { type: Number, default: 0 },
      delivered: { type: Number, default: 0 },
      read: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
    },
    default: { sent: 0, delivered: 0, read: 0, failed: 0 },
  },
  errorMessage: { type: String, default: "" },
  broadcastId: { type: String, default: "" },
}, { timestamps: true });

WhatsAppCampaignSchema.index({ storeId: 1, status: 1 });
WhatsAppCampaignSchema.index({ storeId: 1, createdAt: -1 });

export const WhatsAppCampaign = mongoose.models.WhatsAppCampaign || mongoose.model<IWhatsAppCampaign>("WhatsAppCampaign", WhatsAppCampaignSchema);
