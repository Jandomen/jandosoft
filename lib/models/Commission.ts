import mongoose, { Schema, Document } from "mongoose";

export interface ICommission extends Document {
  affiliateId: mongoose.Types.ObjectId;
  referralId: mongoose.Types.ObjectId;
  referredUserId: mongoose.Types.ObjectId;
  amount: number;
  percentage: number;
  plan: string;
  planPrice: number;
  period: string;
  stripePaymentIntentId?: string;
  status: "pending" | "approved" | "paid" | "rejected";
  paidAt?: Date;
  payoutId?: mongoose.Types.ObjectId;
  notes?: string;
}

const CommissionSchema = new Schema<ICommission>({
  affiliateId: { type: Schema.Types.ObjectId, ref: "Affiliate", required: true },
  referralId: { type: Schema.Types.ObjectId, ref: "Referral", required: true },
  referredUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  percentage: { type: Number, default: 20 },
  plan: { type: String, required: true },
  planPrice: { type: Number, required: true },
  period: { type: String, required: true },
  stripePaymentIntentId: { type: String },
  status: { type: String, enum: ["pending", "approved", "paid", "rejected"], default: "pending" },
  paidAt: { type: Date },
  payoutId: { type: Schema.Types.ObjectId, ref: "AffiliatePayout" },
  notes: { type: String },
}, { timestamps: true });

CommissionSchema.index({ affiliateId: 1 });
CommissionSchema.index({ referralId: 1 });
CommissionSchema.index({ status: 1 });
CommissionSchema.index({ period: 1 });

export const Commission = mongoose.models.Commission || mongoose.model<ICommission>("Commission", CommissionSchema);