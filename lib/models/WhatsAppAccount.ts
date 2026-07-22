import mongoose, { Schema, Document } from "mongoose";

export interface IWhatsAppAccount extends Document {
  storeId: mongoose.Types.ObjectId;
  wabaId: string;
  phoneNumberId: string;
  accessToken: string;
  phoneNumber: string;
  displayName: string;
  verifiedName: string;
  status: "active" | "disconnected" | "pending" | "suspended";
  qualityRating: "green" | "yellow" | "red" | "unknown";
  messagingLimitTier: number;
  messagesSentToday: number;
  lastMessageResetAt: Date;
  connectedAt: Date;
  disconnectedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WhatsAppAccountSchema = new Schema<IWhatsAppAccount>({
  storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true, index: true },
  wabaId: { type: String, required: true, index: true },
  phoneNumberId: { type: String, required: true, index: true },
  accessToken: { type: String, required: true },
  phoneNumber: { type: String, default: "" },
  displayName: { type: String, default: "" },
  verifiedName: { type: String, default: "" },
  status: { type: String, enum: ["active", "disconnected", "pending", "suspended"], default: "pending", index: true },
  qualityRating: { type: String, enum: ["green", "yellow", "red", "unknown"], default: "unknown" },
  messagingLimitTier: { type: Number, default: 1 },
  messagesSentToday: { type: Number, default: 0 },
  lastMessageResetAt: { type: Date, default: () => new Date() },
  connectedAt: { type: Date, default: null },
  disconnectedAt: { type: Date, default: null },
}, { timestamps: true });

WhatsAppAccountSchema.index({ storeId: 1, phoneNumberId: 1 }, { unique: true });
WhatsAppAccountSchema.index({ storeId: 1, status: 1 });
WhatsAppAccountSchema.index({ wabaId: 1, phoneNumberId: 1 });

export const WhatsAppAccount = mongoose.models.WhatsAppAccount || mongoose.model<IWhatsAppAccount>("WhatsAppAccount", WhatsAppAccountSchema);
