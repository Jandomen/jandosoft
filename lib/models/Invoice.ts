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
  series: string;
  taxId: string;
  recipientTaxId: string;
  recipientName: string;
  recipientAddress: string;
  invoiceType: "F1" | "F2" | "F3";
  baseAmount: number;
  vatAmount: number;
  vatRate: number;
  previousHash: string;
  invoiceHash: string;
  signedAt: Date;
  verifactuQR: string;
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
  series: { type: String, default: "" },
  taxId: { type: String, default: "" },
  recipientTaxId: { type: String, default: "" },
  recipientName: { type: String, default: "" },
  recipientAddress: { type: String, default: "" },
  invoiceType: { type: String, enum: ["F1", "F2", "F3"], default: "F1" },
  baseAmount: { type: Number, default: 0 },
  vatAmount: { type: Number, default: 0 },
  vatRate: { type: Number, default: 21 },
  previousHash: { type: String, default: "" },
  invoiceHash: { type: String, default: "" },
  signedAt: { type: Date, default: Date.now },
  verifactuQR: { type: String, default: "" },
}, { timestamps: true });

export const Invoice = mongoose.models.Invoice || mongoose.model<IInvoice>("Invoice", InvoiceSchema);
