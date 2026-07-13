import mongoose, { Document, Schema } from "mongoose";

export interface IConversationSummary extends Document {
  storeId: string;
  summary: string;
  messageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSummarySchema = new Schema<IConversationSummary>(
  {
    storeId: { type: String, required: true, index: true },
    summary: { type: String, required: true },
    messageCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ConversationSummarySchema.index({ storeId: 1, createdAt: -1 });

export default mongoose.models.ConversationSummary ||
  mongoose.model<IConversationSummary>("ConversationSummary", ConversationSummarySchema);
