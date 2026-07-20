import mongoose, { Document, Schema } from "mongoose";

export interface IWidgetConversation extends Document {
  storeId: mongoose.Types.ObjectId;
  guestId: string;
  lastMessage: string;
  taskState: string | null;
  goalState: string | null;
  workflowState: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const WidgetConversationSchema = new Schema<IWidgetConversation>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true, index: true },
    guestId: { type: String, required: true },
    lastMessage: { type: String, default: "" },
    taskState: { type: String, default: null },
    goalState: { type: String, default: null },
    workflowState: { type: String, default: null },
  },
  { timestamps: true }
);

WidgetConversationSchema.index({ storeId: 1, guestId: 1 }, { unique: true });
WidgetConversationSchema.index({ storeId: 1, updatedAt: -1 });

export default mongoose.models.WidgetConversation ||
  mongoose.model<IWidgetConversation>("WidgetConversation", WidgetConversationSchema);
