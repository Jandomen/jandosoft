import mongoose, { Document, Schema } from "mongoose";

export interface IMemoryItem {
  key: string;
  value: string;
}

export interface IConversationMemory extends Document {
  storeId: string;
  businessInfo: string;
  goals: string[];
  preferences: string[];
  importantData: IMemoryItem[];
  updatedAt: Date;
}

const ConversationMemorySchema = new Schema<IConversationMemory>(
  {
    storeId: { type: String, required: true, unique: true, index: true },
    businessInfo: { type: String, default: "" },
    goals: [{ type: String }],
    preferences: [{ type: String }],
    importantData: [{ key: String, value: String }],
  },
  { timestamps: true }
);

export default mongoose.models.ConversationMemory ||
  mongoose.model<IConversationMemory>("ConversationMemory", ConversationMemorySchema);
