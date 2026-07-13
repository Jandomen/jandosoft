import mongoose, { Schema, Document } from "mongoose";

export interface ICustomer extends Document {
  storeId: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  address: string;
  coordinates: { lat: number; lng: number };
  category: string;
  status: string;
  source: string;
  industry: string;
  tags: string[];
  notes: string;
  createdAt: Date;
}

const CustomerSchema = new Schema<ICustomer>({
  storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true, index: true },
  name: { type: String, required: true },
  email: { type: String, default: "" },
  phone: { type: String, default: "" },
  address: { type: String, default: "" },
  coordinates: { type: { lat: { type: Number }, lng: { type: Number } }, default: null },
  category: { type: String, default: "" },
  status: { type: String, default: "lead", enum: ["lead", "prospect", "customer", "churned"] },
  source: { type: String, default: "manual", enum: ["manual", "import", "ai", "referral", "website"] },
  industry: { type: String, default: "" },
  tags: [{ type: String }],
  notes: { type: String, default: "" },
}, { timestamps: true });

CustomerSchema.index({ storeId: 1, name: 1 });
CustomerSchema.index({ storeId: 1, status: 1 });

export const Customer = mongoose.models.Customer || mongoose.model<ICustomer>("Customer", CustomerSchema);
