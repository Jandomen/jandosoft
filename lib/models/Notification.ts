import mongoose, { Schema, Document } from "mongoose";

export type NotificationType = "automation" | "system" | "alert" | "info";

export interface INotification extends Document {
  type: NotificationType;
  title: string;
  message: string;
  storeId?: mongoose.Types.ObjectId;
  organizationId?: mongoose.Types.ObjectId;
  userId: string;
  read: boolean;
  link?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  type: {
    type: String,
    enum: ["automation", "system", "alert", "info"],
    default: "info",
    index: true,
  },
  title: { type: String, required: true },
  message: { type: String, default: "" },
  storeId: { type: Schema.Types.ObjectId, ref: "Store", index: true },
  organizationId: { type: Schema.Types.ObjectId, ref: "Organization", index: true },
  userId: { type: String, required: true, index: true },
  read: { type: Boolean, default: false, index: true },
  link: { type: String, default: null },
}, { timestamps: true });

NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ createdAt: -1 });

export const Notification = mongoose.models.Notification || mongoose.model<INotification>("Notification", NotificationSchema);
