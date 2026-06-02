import mongoose, { Schema, Document } from "mongoose";

export interface IInvoice extends Document {
  invoiceNumber: string;
  userEmail: string;
  userName: string;
  amount: number;
  currency: string;
  items: string[];
  paymentMethod: string;
  status: string;
  createdAt: Date;
  organizationId?: mongoose.Types.ObjectId;
}

const InvoiceSchema = new Schema<IInvoice>({
  invoiceNumber: { type: String, required: true, unique: true },
  userEmail: { type: String, required: true, index: true },
  userName: { type: String, default: "" },
  amount: { type: Number, required: true },
  currency: { type: String, default: "USD" },
  items: [{ type: String }],
  paymentMethod: { type: String, default: "Transferencia" },
  status: { type: String, default: "Pagado" },
  createdAt: { type: Date, default: Date.now },
  organizationId: { type: Schema.Types.ObjectId, ref: "Organization", index: true },
}, { timestamps: true });

export const Invoice = mongoose.models.Invoice || mongoose.model<IInvoice>("Invoice", InvoiceSchema);
