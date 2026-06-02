import mongoose, { Schema, Document } from "mongoose";

export interface IMember {
  userId: mongoose.Types.ObjectId;
  email: string;
  name: string;
  role: "owner" | "admin" | "member";
  joinedAt: Date;
}

export interface IOrganization extends Document {
  name: string;
  slug: string;
  members: IMember[];
  createdAt: Date;
}

const MemberSchema = new Schema<IMember>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  email: { type: String, required: true },
  name: { type: String, default: "" },
  role: { type: String, enum: ["owner", "admin", "member"], default: "member" },
  joinedAt: { type: Date, default: Date.now },
}, { _id: false });

const OrganizationSchema = new Schema<IOrganization>({
  name: { type: String, required: true },
  slug: { type: String, unique: true, required: true },
  members: [MemberSchema],
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

export const Organization = mongoose.models.Organization || mongoose.model<IOrganization>("Organization", OrganizationSchema);
