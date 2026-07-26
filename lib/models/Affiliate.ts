import mongoose, { Schema, Document } from "mongoose";

export interface IAffiliate extends Document {
  userId: mongoose.Types.ObjectId;
  code: string;
  name: string;
  email: string;
  phone?: string;
  status: "pending" | "active" | "suspended";
  stripeAccountId?: string;
  stripeAccountStatus?: "pending" | "active" | "restricted";
  totalEarnings: number;
  pendingBalance: number;
  paidBalance: number;
  totalReferrals: number;
  activeReferrals: number;
  commissionRate: number;
  payoutMethod?: "stripe" | "paypal" | "bank_transfer";
  payoutDetails?: {
    paypalEmail?: string;
    bankName?: string;
    accountNumber?: string;
    clabe?: string;
  };
  referralLinkId?: string;
  notes?: string;
}

const AffiliateSchema = new Schema<IAffiliate>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  code: { type: String, required: true, unique: true, uppercase: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  status: { type: String, enum: ["pending", "active", "suspended"], default: "pending" },
  stripeAccountId: { type: String },
  stripeAccountStatus: { type: String, enum: ["pending", "active", "restricted"] },
  totalEarnings: { type: Number, default: 0 },
  pendingBalance: { type: Number, default: 0 },
  paidBalance: { type: Number, default: 0 },
  totalReferrals: { type: Number, default: 0 },
  activeReferrals: { type: Number, default: 0 },
  commissionRate: { type: Number, default: 20 },
  payoutMethod: { type: String, enum: ["stripe", "paypal", "bank_transfer"] },
  payoutDetails: {
    paypalEmail: { type: String },
    bankName: { type: String },
    accountNumber: { type: String },
    clabe: { type: String },
  },
  referralLinkId: { type: String },
  notes: { type: String },
}, { timestamps: true });

AffiliateSchema.index({ status: 1 });

export const Affiliate = mongoose.models.Affiliate || mongoose.model<IAffiliate>("Affiliate", AffiliateSchema);