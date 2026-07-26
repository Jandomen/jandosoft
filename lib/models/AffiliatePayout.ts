import mongoose, { Schema, Document } from "mongoose";

export interface IAffiliatePayout extends Document {
  affiliateId: mongoose.Types.ObjectId;
  amount: number;
  method: "stripe" | "paypal" | "bank_transfer";
  status: "pending" | "processing" | "completed" | "failed";
  stripeTransferId?: string;
  paypalTransactionId?: string;
  bankReference?: string;
  commissions: mongoose.Types.ObjectId[];
  processedAt?: Date;
  receiptNumber?: string;
  receiptSentAt?: Date;
  notes?: string;
}

const AffiliatePayoutSchema = new Schema<IAffiliatePayout>({
  affiliateId: { type: Schema.Types.ObjectId, ref: "Affiliate", required: true },
  amount: { type: Number, required: true },
  method: { type: String, enum: ["stripe", "paypal", "bank_transfer"], required: true },
  status: { type: String, enum: ["pending", "processing", "completed", "failed"], default: "pending" },
  stripeTransferId: { type: String },
  paypalTransactionId: { type: String },
  bankReference: { type: String },
  commissions: [{ type: Schema.Types.ObjectId, ref: "Commission" }],
  processedAt: { type: Date },
  receiptNumber: { type: String },
  receiptSentAt: { type: Date },
  notes: { type: String },
}, { timestamps: true });

AffiliatePayoutSchema.index({ affiliateId: 1 });
AffiliatePayoutSchema.index({ status: 1 });

export const AffiliatePayout = mongoose.models.AffiliatePayout || mongoose.model<IAffiliatePayout>("AffiliatePayout", AffiliatePayoutSchema);