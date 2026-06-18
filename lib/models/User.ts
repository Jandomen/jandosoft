import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  name: string;
  phone: string;
  password: string;
  subscription: string | null;
  subscriptionExpiry: Date | null;
  isSuspended: boolean;
  suspendedUntil: Date | null;
  organizationId?: mongoose.Types.ObjectId;
  role?: "owner" | "admin" | "member";
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionStatus?: "active" | "past_due" | "canceled" | "unpaid" | "trialing" | "incomplete" | "incomplete_expired" | "paused";
  emailVerified?: boolean;
  verificationToken?: string | null;
  verificationTokenExpiry?: Date | null;
  resetPasswordToken?: string | null;
  resetPasswordTokenExpiry?: Date | null;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  phone: { type: String, default: "" },
  password: { type: String, required: true },
  subscription: { type: String, default: null },
  subscriptionExpiry: { type: Date, default: null },
  isSuspended: { type: Boolean, default: false },
  suspendedUntil: { type: Date, default: null },
  organizationId: { type: Schema.Types.ObjectId, ref: "Organization", index: true },
  role: { type: String, enum: ["owner", "admin", "member"], default: "owner" },
  stripeCustomerId: { type: String, default: null },
  stripeSubscriptionId: { type: String, default: null },
  subscriptionStatus: { type: String, default: null },
  emailVerified: { type: Boolean, default: false },
  verificationToken: { type: String, default: null },
  verificationTokenExpiry: { type: Date, default: null },
  resetPasswordToken: { type: String, default: null },
  resetPasswordTokenExpiry: { type: Date, default: null },
}, { timestamps: true });

export const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
