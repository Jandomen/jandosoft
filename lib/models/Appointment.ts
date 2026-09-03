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
  createdBy: "customer" | "owner" | "ai";
  paymentStatus: "unpaid" | "pending" | "paid" | "refunded";
  stripePaymentUrl?: string;
  stripePaymentIntentId?: string;
  reminders: { type: "email"; sentAt: Date }[];
  // Appointment Setting
  settingStage?: "new" | "contacted" | "qualified" | "appointment_set" | "showed" | "no_show" | "closed";
  assignedStaffId?: string;
  source?: string;
  showUpAt?: Date;
  noShowReason?: string;
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
  createdBy: { type: String, enum: ["customer", "owner", "ai"], default: "owner" },
  paymentStatus: { type: String, enum: ["unpaid", "pending", "paid", "refunded"], default: "unpaid" },
  stripePaymentUrl: { type: String, default: "" },
  stripePaymentIntentId: { type: String, default: "" },
  reminders: [{
    type: { type: String, enum: ["email"] },
    sentAt: { type: Date },
  }],
  settingStage: { type: String, enum: ["new", "contacted", "qualified", "appointment_set", "showed", "no_show", "closed"], default: "new", index: true },
  assignedStaffId: { type: String, default: "" },
  source: { type: String, default: "manual" },
  showUpAt: { type: Date, default: null },
  noShowReason: { type: String, default: "" },
}, { timestamps: true });

AppointmentSchema.index({ storeId: 1, date: 1, time: 1 });
AppointmentSchema.index({ storeId: 1, customerId: 1, createdAt: -1 });
AppointmentSchema.index({ storeId: 1, status: 1, date: 1 });

export const Appointment = mongoose.models.Appointment || mongoose.model<IAppointment>("Appointment", AppointmentSchema);
