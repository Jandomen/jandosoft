import mongoose, { Schema, Document } from "mongoose";

export interface IPayment extends Document {
  storeId: mongoose.Types.ObjectId;
  storeName: string;
  ownerEmail: string;
  customerEmail: string;
  customerName: string;
  amount: number;
  currency: string;
  platformFee: number;
  netAmount: number;
  stripePaymentIntentId: string;
  stripeAccountId: string;
  status: string;
  description: string;
  createdAt: Date;
  organizationId?: mongoose.Types.ObjectId;
}

const PaymentSchema = new Schema<IPayment>({
  storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true, index: true },
  storeName: { type: String, default: "" },
  ownerEmail: { type: String, default: "", index: true },
  customerEmail: { type: String, default: "" },
  customerName: { type: String, default: "" },
  amount: { type: Number, required: true },
  currency: { type: String, default: "usd" },
  platformFee: { type: Number, default: 0 },
  netAmount: { type: Number, default: 0 },
  stripePaymentIntentId: { type: String, default: "" },
  stripeAccountId: { type: String, default: "" },
  status: { type: String, default: "pending" },
  description: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

export const Payment = mongoose.models.Payment || mongoose.model<IPayment>("Payment", PaymentSchema);
