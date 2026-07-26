import mongoose, { Schema, Document } from "mongoose";

export interface IReferral extends Document {
  affiliateId: mongoose.Types.ObjectId;
  referredUserId: mongoose.Types.ObjectId;
  referredUserEmail: string;
  plan: string;
  planPrice: number;
  status: "pending" | "active" | "expired" | "canceled";
  startDate: Date;
  endDate?: Date;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  totalCommissions: number;
  lastCommissionDate?: Date;
}

const ReferralSchema = new Schema<IReferral>({
  affiliateId: { type: Schema.Types.ObjectId, ref: "Affiliate", required: true },
  referredUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  referredUserEmail: { type: String, required: true },
  plan: { type: String, required: true },
  planPrice: { type: Number, required: true },
  status: { type: String, enum: ["pending", "active", "expired", "canceled"], default: "pending" },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  stripeCustomerId: { type: String },
  stripeSubscriptionId: { type: String },
  totalCommissions: { type: Number, default: 0 },
  lastCommissionDate: { type: Date },
}, { timestamps: true });

ReferralSchema.index({ affiliateId: 1 });
ReferralSchema.index({ referredUserId: 1 });
ReferralSchema.index({ status: 1 });

export const Referral = mongoose.models.Referral || mongoose.model<IReferral>("Referral", ReferralSchema);