import mongoose, { Schema, Document } from "mongoose";

export interface INowPaymentsPayment extends Document {
  storeId?: mongoose.Types.ObjectId;
  orderId: string;
  invoiceId: number;
  invoiceUrl: string;
  priceAmount: number;
  priceCurrency: string;
  paymentStatus: string;
  payAddress?: string;
  payAmount?: number;
  payCurrency?: string;
  actuallyPaid?: number;
  customerEmail?: string;
  completedAt?: Date;
  createdAt: Date;
}

const NowPaymentsPaymentSchema = new Schema<INowPaymentsPayment>({
  storeId: { type: Schema.Types.ObjectId, ref: "Store", index: true },
  orderId: { type: String, required: true, unique: true, index: true },
  invoiceId: { type: Number, required: true },
  invoiceUrl: { type: String, required: true },
  priceAmount: { type: Number, required: true },
  priceCurrency: { type: String, default: "usd" },
  paymentStatus: { type: String, default: "pending" },
  payAddress: { type: String, default: "" },
  payAmount: { type: Number },
  payCurrency: { type: String },
  actuallyPaid: { type: Number },
  customerEmail: { type: String, default: "" },
  completedAt: { type: Date },
}, { timestamps: true });

export const NowPaymentsPayment = mongoose.models.NowPaymentsPayment || mongoose.model<INowPaymentsPayment>("NowPaymentsPayment", NowPaymentsPaymentSchema);
