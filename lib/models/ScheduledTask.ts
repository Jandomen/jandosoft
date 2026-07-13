import mongoose, { Schema, Document } from "mongoose";

export type TaskType = "email" | "sms" | "ai" | "reminder" | "campaign" | "store_notification" | "appointment_reminder" | "email_campaign" | "ai_followup";
export type TaskStatus = "pending" | "processing" | "done" | "failed";

export interface IScheduledTask extends Document {
  type: TaskType;
  payload: Record<string, any>;
  runAt: Date;
  status: TaskStatus;
  storeId?: mongoose.Types.ObjectId;
  organizationId?: mongoose.Types.ObjectId;
  userId?: string;
  error?: string;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  updatedAt: Date;
}

const ScheduledTaskSchema = new Schema<IScheduledTask>({
  type: {
    type: String,
    enum: ["email", "sms", "ai", "reminder", "campaign", "store_notification", "appointment_reminder", "email_campaign", "ai_followup"],
    required: true,
    index: true,
  },
  payload: { type: Schema.Types.Mixed, required: true },
  runAt: { type: Date, required: true, index: true },
  status: {
    type: String,
    enum: ["pending", "processing", "done", "failed"],
    default: "pending",
    index: true,
  },
  storeId: { type: Schema.Types.ObjectId, ref: "Store", index: true },
  organizationId: { type: Schema.Types.ObjectId, ref: "Organization", index: true },
  userId: { type: String, index: true },
  error: { type: String },
  attempts: { type: Number, default: 0 },
  maxAttempts: { type: Number, default: 3 },
}, { timestamps: true });

ScheduledTaskSchema.index({ status: 1, runAt: 1 });
ScheduledTaskSchema.index({ runAt: 1, status: 1 });

export const ScheduledTask = mongoose.models.ScheduledTask || mongoose.model<IScheduledTask>("ScheduledTask", ScheduledTaskSchema);
