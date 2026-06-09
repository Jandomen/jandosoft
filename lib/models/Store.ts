import mongoose, { Schema, Document } from "mongoose";

export interface IProduct {
  id: number;
  name: string;
  price: number;
  stock: number;
}

export interface ICustomer {
  id: number;
  name: string;
  email: string;
  phone: string;
}

export interface IOrder {
  id: number;
  product: string;
  amount: number;
  status: string;
}

export interface IService {
  id: number;
  name: string;
  desc: string;
  price: number;
}

export interface IStore extends Document {
  ownerEmail: string;
  name: string;
  slug: string;
  desc: string;
  industry: string;
  type: string;
  typeLabel: string;
  createdAt: string;
  products: IProduct[];
  customers: ICustomer[];
  orders: IOrder[];
  services: IService[];
  stripeAccountId?: string;
  paymentsEnabled?: boolean;
  platformFeePercent?: number;
  organizationId?: mongoose.Types.ObjectId;
  isPublic?: boolean;
  publicAI?: boolean;
  isSuspended?: boolean;
  suspensionReason?: string;
  suspendedUntil?: Date | null;
}

const ProductSchema = new Schema<IProduct>({
  id: { type: Number, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, default: 0 },
}, { _id: false });

const CustomerSchema = new Schema<ICustomer>({
  id: { type: Number, required: true },
  name: { type: String, required: true },
  email: { type: String, default: "" },
  phone: { type: String, default: "" },
}, { _id: false });

const OrderSchema = new Schema<IOrder>({
  id: { type: Number, required: true },
  product: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, default: "Pendiente" },
}, { _id: false });

const ServiceSchema = new Schema<IService>({
  id: { type: Number, required: true },
  name: { type: String, required: true },
  desc: { type: String, default: "" },
  price: { type: Number, required: true },
}, { _id: false });

const StoreSchema = new Schema<IStore>({
  ownerEmail: { type: String, required: true, index: true },
  name: { type: String, required: true },
  slug: { type: String, unique: true, sparse: true, index: true },
  desc: { type: String, default: "" },
  industry: { type: String, default: "tecnologia" },
  type: { type: String, default: "general" },
  typeLabel: { type: String, default: "" },
  createdAt: { type: String, default: () => new Date().toISOString() },
  products: [ProductSchema],
  customers: [CustomerSchema],
  orders: [OrderSchema],
  services: [ServiceSchema],
  stripeAccountId: { type: String, default: "" },
  paymentsEnabled: { type: Boolean, default: false },
  platformFeePercent: { type: Number, default: 5 },
  organizationId: { type: Schema.Types.ObjectId, ref: "Organization", index: true },
  isPublic: { type: Boolean, default: false },
  publicAI: { type: Boolean, default: false },
  isSuspended: { type: Boolean, default: false },
  suspensionReason: { type: String, default: "" },
  suspendedUntil: { type: Date, default: null },
}, { timestamps: true });

export const Store = mongoose.models.Store || mongoose.model<IStore>("Store", StoreSchema);
