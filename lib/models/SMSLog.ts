import mongoose, { Schema, Document } from "mongoose";

export type SMSStatus = "sent" | "failed";

export interface ISMSLog extends Document {
  to: string;
  body: string;
  messageId?: string;
  status: SMSStatus;
  storeId?: mongoose.Types.ObjectId;
  organizationId?: mongoose.Types.ObjectId;
  error?: string;
  createdAt: Date;
}

const SMSLogSchema = new Schema<ISMSLog>({
  to: { type: String, required: true, index: true },
  body: { type: String, required: true },
  messageId: { type: String, default: null },
  status: {
    type: String,
    enum: ["sent", "failed"],
    default: "sent",
    index: true,
  },
  storeId: { type: Schema.Types.ObjectId, ref: "Store", index: true },
  organizationId: { type: Schema.Types.ObjectId, ref: "Organization", index: true },
  error: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

SMSLogSchema.index({ createdAt: -1 });

export const SMSLog = mongoose.models.SMSLog || mongoose.model<ISMSLog>("SMSLog", SMSLogSchema);
