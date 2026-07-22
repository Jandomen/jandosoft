import mongoose, { Schema, Document } from "mongoose";

export interface IWhatsAppConversation extends Document {
  storeId: mongoose.Types.ObjectId;
  accountId: mongoose.Types.ObjectId;
  waId: string;
  customerName: string;
  customerPhone: string;
  customerId?: mongoose.Types.ObjectId;
  status: "open" | "closed" | "pending";
  assignedTo?: mongoose.Types.ObjectId;
  assignedToName?: string;
  assignedAt?: Date;
  lastMessageAt: Date;
  lastMessagePreview: string;
  unreadCount: number;
  aiAutoReply: boolean;
  tags: string[];
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const WhatsAppConversationSchema = new Schema<IWhatsAppConversation>({
  storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true, index: true },
  accountId: { type: Schema.Types.ObjectId, ref: "WhatsAppAccount", required: true, index: true },
  waId: { type: String, required: true },
  customerName: { type: String, default: "" },
  customerPhone: { type: String, default: "" },
  customerId: { type: Schema.Types.ObjectId, ref: "Customer", default: null },
  status: { type: String, enum: ["open", "closed", "pending"], default: "open", index: true },
  assignedTo: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
  assignedToName: { type: String, default: "" },
  assignedAt: { type: Date, default: null },
  lastMessageAt: { type: Date, default: () => new Date() },
  lastMessagePreview: { type: String, default: "" },
  unreadCount: { type: Number, default: 0 },
  aiAutoReply: { type: Boolean, default: true },
  tags: [{ type: String }],
  notes: { type: String, default: "" },
}, { timestamps: true });

WhatsAppConversationSchema.index({ storeId: 1, waId: 1 }, { unique: true });
WhatsAppConversationSchema.index({ storeId: 1, status: 1, lastMessageAt: -1 });
WhatsAppConversationSchema.index({ storeId: 1, assignedTo: 1 });

export const WhatsAppConversation = mongoose.models.WhatsAppConversation || mongoose.model<IWhatsAppConversation>("WhatsAppConversation", WhatsAppConversationSchema);
