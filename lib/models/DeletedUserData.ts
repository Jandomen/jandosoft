import mongoose, { Schema, Document } from "mongoose";

export interface IDeletedUserData extends Document {
  originalUserId: string;
  email: string;
  deletedAt: Date;
  affiliate?: any;
  commissions?: any[];
  payouts?: any[];
  referrals?: any[];
}

const DeletedUserDataSchema = new Schema<IDeletedUserData>({
  originalUserId: { type: String, required: true, index: true },
  email: { type: String, required: true, index: true },
  deletedAt: { type: Date, default: Date.now },
  affiliate: { type: Schema.Types.Mixed },
  commissions: [{ type: Schema.Types.Mixed }],
  payouts: [{ type: Schema.Types.Mixed }],
  referrals: [{ type: Schema.Types.Mixed }],
});

export const DeletedUserData =
  mongoose.models.DeletedUserData ||
  mongoose.model<IDeletedUserData>("DeletedUserData", DeletedUserDataSchema);
