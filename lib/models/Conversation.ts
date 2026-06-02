import mongoose, { Document, Schema } from "mongoose";

export interface IConversationParticipant {
  userId: mongoose.Types.ObjectId;
  email: string;
  name: string;
}

export interface IConversation extends Document {
  participants: IConversationParticipant[];
  lastMessage?: string;
  lastSenderId?: mongoose.Types.ObjectId;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    participants: [{
      userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
      email: { type: String, required: true },
      name: { type: String, required: true },
    }],
    lastMessage: { type: String, default: "" },
    lastSenderId: { type: Schema.Types.ObjectId, ref: "User" },
    lastMessageAt: { type: Date },
  },
  { timestamps: true }
);

ConversationSchema.index({ "participants.userId": 1 });
ConversationSchema.index({ updatedAt: -1 });

export default mongoose.models.Conversation ||
  mongoose.model<IConversation>("Conversation", ConversationSchema);
