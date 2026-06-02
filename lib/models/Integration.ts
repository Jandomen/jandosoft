import mongoose, { Schema, Document } from "mongoose";

export interface IIntegration extends Document {
  storeId: mongoose.Types.ObjectId;
  platform: string;
  label: string;
  apiKey: string;
  tier: "developer" | "production";
  status: "verified" | "pending" | "invalid";
  config: {
    rateLimit: number;
    dailyCap: number;
    monthlyCap: number;
  };
  usage: {
    today: number;
    thisMonth: number;
    total: number;
  };
  lastVerified: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const IntegrationSchema = new Schema<IIntegration>({
  storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true, index: true },
  platform: { type: String, required: true },
  label: { type: String, default: "" },
  apiKey: { type: String, required: true },
  tier: { type: String, enum: ["developer", "production"], default: "developer" },
  status: { type: String, enum: ["verified", "pending", "invalid"], default: "pending" },
  config: {
    rateLimit: { type: Number, default: 60 },
    dailyCap: { type: Number, default: 1000 },
    monthlyCap: { type: Number, default: 30000 },
  },
  usage: {
    today: { type: Number, default: 0 },
    thisMonth: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  lastVerified: { type: Date, default: null },
}, { timestamps: true });

IntegrationSchema.index({ storeId: 1, platform: 1 }, { unique: true });

export const Integration = mongoose.models.Integration || mongoose.model<IIntegration>("Integration", IntegrationSchema);
