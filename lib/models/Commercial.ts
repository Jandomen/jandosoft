import mongoose, { Schema, Document } from "mongoose";

export interface ICommercial extends Document {
  title: string;
  imageUrl: string;
  linkUrl?: string;
  active: boolean;
  createdAt: Date;
}

const CommercialSchema = new Schema<ICommercial>({
  title: { type: String, required: true },
  imageUrl: { type: String, required: true },
  linkUrl: { type: String, default: "" },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

export const Commercial = mongoose.models.Commercial || mongoose.model<ICommercial>("Commercial", CommercialSchema);
