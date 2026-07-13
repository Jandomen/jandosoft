import mongoose, { Schema, Document } from "mongoose";

export interface IEmailSettings extends Document {
  storeId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  fromEmail: string;
  fromName: string;
  welcomeEnabled: boolean;
  passwordResetEnabled: boolean;
  invoiceEnabled: boolean;
  appointmentReminderEnabled: boolean;
  paymentConfirmationEnabled: boolean;
  orderConfirmationEnabled: boolean;
  newClientNotificationEnabled: boolean;
  paymentReceivedNotificationEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EmailSettingsSchema = new Schema<IEmailSettings>({
  storeId: { type: Schema.Types.ObjectId, ref: "Store", default: null, index: true },
  organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
  fromEmail: { type: String, default: "noreply@jandosoft.com" },
  fromName: { type: String, default: "Jandosoft" },
  welcomeEnabled: { type: Boolean, default: true },
  passwordResetEnabled: { type: Boolean, default: true },
  invoiceEnabled: { type: Boolean, default: true },
  appointmentReminderEnabled: { type: Boolean, default: true },
  paymentConfirmationEnabled: { type: Boolean, default: true },
  orderConfirmationEnabled: { type: Boolean, default: true },
  newClientNotificationEnabled: { type: Boolean, default: true },
  paymentReceivedNotificationEnabled: { type: Boolean, default: true },
}, { timestamps: true });

export const EmailSettings = mongoose.models.EmailSettings || mongoose.model<IEmailSettings>("EmailSettings", EmailSettingsSchema);
