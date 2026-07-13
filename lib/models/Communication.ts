import mongoose, { Schema, Document } from "mongoose";

export type CommunicationType = "email" | "sms" | "whatsapp";
export type CommunicationDirection = "sent" | "received";
export type CommunicationStatus = "sent" | "failed" | "draft";

export interface ICommunication extends Document {
  storeId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  type: CommunicationType;
  direction: CommunicationDirection;
  subject: string;
  body: string;
  to: string;
  status: CommunicationStatus;
  externalId: string;
  createdAt: Date;
}

const CommunicationSchema = new Schema<ICommunication>({
  storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true, index: true },
  customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
  type: { type: String, enum: ["email", "sms", "whatsapp"], required: true },
  direction: { type: String, enum: ["sent", "received"], default: "sent" },
  subject: { type: String, default: "" },
  body: { type: String, default: "" },
  to: { type: String, default: "" },
  status: { type: String, enum: ["sent", "failed", "draft"], default: "sent" },
  externalId: { type: String, default: "" },
}, { timestamps: true });

CommunicationSchema.index({ storeId: 1, customerId: 1, createdAt: -1 });

export const Communication = mongoose.models.Communication || mongoose.model<ICommunication>("Communication", CommunicationSchema);
