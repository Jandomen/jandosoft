import mongoose, { Schema, Document } from "mongoose";

export type AppointmentStatus = "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";

export interface IAppointment extends Document {
  storeId?: mongoose.Types.ObjectId;
  ownerEmail?: string;
  customerId?: mongoose.Types.ObjectId;
  service: {
    id: number;
    name: string;
    price: number;
    duration: number;
  };
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  date: string;
  time: string;
  duration: number;
  notes: string;
  status: AppointmentStatus;
  createdBy: "customer" | "owner";
  reminders: { type: "email"; sentAt: Date }[];
  createdAt: Date;
}

const AppointmentSchema = new Schema<IAppointment>({
  storeId: { type: Schema.Types.ObjectId, ref: "Store", required: false, index: true },
  ownerEmail: { type: String, index: true },
  customerId: { type: Schema.Types.ObjectId, ref: "Customer" },
  service: {
    id: { type: Number, required: true },
    name: { type: String, required: true },
    price: { type: Number, default: 0 },
    duration: { type: Number, default: 60 },
  },
  customerInfo: {
    name: { type: String, required: true },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
  },
  date: { type: String, required: true, index: true },
  time: { type: String, required: true },
  duration: { type: Number, default: 60 },
  notes: { type: String, default: "" },
  status: {
    type: String,
    enum: ["pending", "confirmed", "in_progress", "completed", "cancelled"],
    default: "pending",
  },
  createdBy: { type: String, enum: ["customer", "owner"], default: "owner" },
  reminders: [{
    type: { type: String, enum: ["email"] },
    sentAt: { type: Date },
  }],
}, { timestamps: true });

AppointmentSchema.index({ storeId: 1, date: 1, time: 1 });
AppointmentSchema.index({ storeId: 1, customerId: 1, createdAt: -1 });
AppointmentSchema.index({ storeId: 1, status: 1, date: 1 });

export const Appointment = mongoose.models.Appointment || mongoose.model<IAppointment>("Appointment", AppointmentSchema);
