import mongoose, { Schema, Document } from "mongoose";

export interface IIntegration extends Document {
  storeId: mongoose.Types.ObjectId;
  platform: string;
  enabled: boolean;
  credentials: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

const IntegrationSchema = new Schema<IIntegration>({
  storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true, index: true },
  platform: { type: String, required: true },
  enabled: { type: Boolean, default: false },
  credentials: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });

IntegrationSchema.index({ storeId: 1, platform: 1 }, { unique: true });

export const Integration = mongoose.models.Integration || mongoose.model<IIntegration>("Integration", IntegrationSchema);
