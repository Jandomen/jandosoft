import mongoose, { Schema, Document } from "mongoose";

export interface IWhatsAppTemplate extends Document {
  storeId: mongoose.Types.ObjectId;
  accountId: mongoose.Types.ObjectId;
  templateId: string;
  name: string;
  category: "marketing" | "utility" | "authentication" | "otp";
  status: "approved" | "pending" | "rejected" | "disabled";
  language: string;
  components: any[];
  rejectedReason?: string;
  lastSyncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WhatsAppTemplateSchema = new Schema<IWhatsAppTemplate>({
  storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true, index: true },
  accountId: { type: Schema.Types.ObjectId, ref: "WhatsAppAccount", required: true, index: true },
  templateId: { type: String, required: true },
  name: { type: String, required: true, index: true },
  category: { type: String, enum: ["marketing", "utility", "authentication", "otp"], default: "marketing" },
  status: { type: String, enum: ["approved", "pending", "rejected", "disabled"], default: "pending", index: true },
  language: { type: String, default: "es" },
  components: [{ type: Schema.Types.Mixed }],
  rejectedReason: { type: String, default: "" },
  lastSyncedAt: { type: Date, default: () => new Date() },
}, { timestamps: true });

WhatsAppTemplateSchema.index({ storeId: 1, name: 1, language: 1 }, { unique: true });
WhatsAppTemplateSchema.index({ accountId: 1, status: 1 });

export const WhatsAppTemplate = mongoose.models.WhatsAppTemplate || mongoose.model<IWhatsAppTemplate>("WhatsAppTemplate", WhatsAppTemplateSchema);
