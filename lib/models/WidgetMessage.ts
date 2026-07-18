import mongoose, { Document, Schema } from "mongoose";

export interface IWidgetMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: Date;
}

const WidgetMessageSchema = new Schema<IWidgetMessage>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: "WidgetConversation", required: true, index: true },
    role: { type: String, enum: ["user", "assistant", "system"], required: true },
    content: { type: String, default: "" },
  },
  { timestamps: true }
);

WidgetMessageSchema.index({ conversationId: 1, createdAt: 1 });

export default mongoose.models.WidgetMessage ||
  mongoose.model<IWidgetMessage>("WidgetMessage", WidgetMessageSchema);
