import mongoose, { Schema, Document } from "mongoose";

export type EmailStatus = "sent" | "failed" | "opened" | "clicked";

export interface IEmailLog extends Document {
  to: string;
  subject: string;
  messageId?: string;
  status: EmailStatus;
  storeId?: mongoose.Types.ObjectId;
  organizationId?: mongoose.Types.ObjectId;
  template?: string;
  error?: string;
  openedAt?: Date;
  createdAt: Date;
}

const EmailLogSchema = new Schema<IEmailLog>({
  to: { type: String, required: true, index: true },
  subject: { type: String, required: true },
  messageId: { type: String, default: null },
  status: {
    type: String,
    enum: ["sent", "failed", "opened", "clicked"],
    default: "sent",
    index: true,
  },
  storeId: { type: Schema.Types.ObjectId, ref: "Store", index: true },
  organizationId: { type: Schema.Types.ObjectId, ref: "Organization", index: true },
  template: { type: String, default: null },
  error: { type: String, default: null },
  openedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

EmailLogSchema.index({ createdAt: -1 });
EmailLogSchema.index({ status: 1, createdAt: -1 });

export const EmailLog = mongoose.models.EmailLog || mongoose.model<IEmailLog>("EmailLog", EmailLogSchema);
