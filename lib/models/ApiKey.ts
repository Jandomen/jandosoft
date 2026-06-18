import mongoose, { Schema, Document } from "mongoose";
import crypto from "crypto";

export interface IApiKey extends Document {
  storeId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  name: string;
  key: string;
  prefix: string;
  scopes: string[];
  lastUsed: Date | null;
  status: "active" | "revoked";
  createdAt: Date;
}

const ApiKeySchema = new Schema<IApiKey>({
  storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true },
  organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
  name: { type: String, required: true },
  key: { type: String, unique: true, required: true },
  prefix: { type: String, required: true },
  scopes: [String],
  lastUsed: { type: Date, default: null },
  status: { type: String, enum: ["active", "revoked"], default: "active" },
  createdAt: { type: Date, default: Date.now },
});

ApiKeySchema.index({ storeId: 1, status: 1 });
ApiKeySchema.index({ key: 1 });

export const ApiKey = mongoose.models.ApiKey || mongoose.model<IApiKey>("ApiKey", ApiKeySchema);

export function generateApiKey(name: string): { key: string; prefix: string } {
  const prefix = `jsk_${crypto.randomBytes(4).toString("hex")}`;
  const secret = crypto.randomBytes(24).toString("hex");
  const key = `${prefix}_${secret}`;
  return { key, prefix };
}

export const VALID_SCOPES = [
  "products:read",
  "products:write",
  "customers:read",
  "customers:write",
  "orders:read",
  "orders:write",
  "analytics:read",
  "store:read",
  "store:write",
] as const;
