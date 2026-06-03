import mongoose, { Document, Schema } from "mongoose";

export interface IChatUsage extends Document {
  email: string;
  messageCount: number;
  lastResetAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ChatUsageSchema = new Schema<IChatUsage>(
  {
    email: { type: String, required: true, unique: true, index: true },
    messageCount: { type: Number, default: 0 },
    lastResetAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.ChatUsage ||
  mongoose.model<IChatUsage>("ChatUsage", ChatUsageSchema);
