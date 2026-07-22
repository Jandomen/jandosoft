import mongoose, { Schema, Document } from "mongoose";

export interface IWhatsAppContact extends Document {
  storeId: mongoose.Types.ObjectId;
  waId: string;
  customerId?: mongoose.Types.ObjectId;
  name: string;
  phone: string;
  profilePic?: string;
  lastSeen: Date;
  messageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const WhatsAppContactSchema = new Schema<IWhatsAppContact>({
  storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true, index: true },
  waId: { type: String, required: true },
  customerId: { type: Schema.Types.ObjectId, ref: "Customer", default: null, index: true },
  name: { type: String, default: "" },
  phone: { type: String, default: "" },
  profilePic: { type: String, default: "" },
  lastSeen: { type: Date, default: () => new Date() },
  messageCount: { type: Number, default: 0 },
}, { timestamps: true });

WhatsAppContactSchema.index({ storeId: 1, waId: 1 }, { unique: true });
WhatsAppContactSchema.index({ storeId: 1, phone: 1 });

export const WhatsAppContact = mongoose.models.WhatsAppContact || mongoose.model<IWhatsAppContact>("WhatsAppContact", WhatsAppContactSchema);
