import mongoose, { Document, Schema } from "mongoose";

export interface IContact extends Document {
  userId: mongoose.Types.ObjectId;
  contactUserId: mongoose.Types.ObjectId;
  contactEmail: string;
  contactName: string;
  createdAt: Date;
}

const ContactSchema = new Schema<IContact>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    contactUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    contactEmail: { type: String, required: true },
    contactName: { type: String, required: true },
  },
  { timestamps: true }
);

ContactSchema.index({ userId: 1 });
ContactSchema.index({ userId: 1, contactUserId: 1 }, { unique: true });

export default mongoose.models.Contact ||
  mongoose.model<IContact>("Contact", ContactSchema);
