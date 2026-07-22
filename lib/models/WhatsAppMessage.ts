import mongoose, { Schema, Document } from "mongoose";

export interface IWhatsAppMessage extends Document {
  storeId: mongoose.Types.ObjectId;
  accountId?: mongoose.Types.ObjectId;
  conversationId?: mongoose.Types.ObjectId;
  direction: "incoming" | "outgoing";
  from: string;
  to: string;
  messageId: string;
  waId: string;
  type: "text" | "image" | "audio" | "video" | "document" | "location" | "interactive" | "template" | "reaction" | "unknown";
  body: string;
  mediaUrl?: string;
  caption?: string;
  templateName?: string;
  templateParams?: string[];
  status: "sent" | "delivered" | "read" | "failed" | "pending" | "received";
  errorMessage?: string;
  providerMessageId?: string;
  rawPayload?: any;
  createdAt: Date;
  updatedAt: Date;
}

const WhatsAppMessageSchema = new Schema<IWhatsAppMessage>({
  storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true, index: true },
  accountId: { type: Schema.Types.ObjectId, ref: "WhatsAppAccount", index: true },
  conversationId: { type: Schema.Types.ObjectId, ref: "WhatsAppConversation", index: true },
  direction: { type: String, enum: ["incoming", "outgoing"], required: true, index: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  messageId: { type: String, required: true, index: true },
  waId: { type: String, required: true },
  type: { type: String, default: "text" },
  body: { type: String, default: "" },
  mediaUrl: { type: String },
  caption: { type: String },
  templateName: { type: String },
  templateParams: { type: [String] },
  status: { type: String, enum: ["sent", "delivered", "read", "failed", "pending", "received"], default: "pending", index: true },
  errorMessage: { type: String },
  providerMessageId: { type: String },
  rawPayload: { type: Schema.Types.Mixed },
}, { timestamps: true });

WhatsAppMessageSchema.index({ storeId: 1, waId: 1 });
WhatsAppMessageSchema.index({ storeId: 1, createdAt: -1 });

export const WhatsAppMessage = mongoose.models.WhatsAppMessage || mongoose.model<IWhatsAppMessage>("WhatsAppMessage", WhatsAppMessageSchema);
