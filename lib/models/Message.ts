import mongoose, { Document, Schema } from "mongoose";

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  senderEmail: string;
  senderName: string;
  content: string;
  mediaUrl?: string;
  mediaType?: "image" | "video";
  readAt: Date | null;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderEmail: { type: String, required: true },
    senderName: { type: String, required: true },
    content: { type: String, default: "" },
    mediaUrl: { type: String },
    mediaType: { type: String, enum: ["image", "video"] },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

MessageSchema.index({ conversationId: 1, createdAt: 1 });

export default mongoose.models.Message ||
  mongoose.model<IMessage>("Message", MessageSchema);
