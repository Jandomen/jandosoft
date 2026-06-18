import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { EmailSettings } from "@/lib/models/EmailSettings";
import { withAuth } from "@/lib/api-middleware";

export const GET = withAuth(async (_req: NextRequest, auth) => {
  await connectDB();
  let settings = await EmailSettings.findOne({ organizationId: auth.organizationId });
  if (!settings) {
    settings = await EmailSettings.create({
      organizationId: auth.organizationId,
      fromEmail: process.env.EMAIL_FROM || "noreply@jandosoft.com",
      fromName: process.env.EMAIL_FROM_NAME || "Jandosoft",
    });
  }
  return NextResponse.json({ success: true, settings });
});

export const PUT = withAuth(async (_req: NextRequest, auth, body) => {
  await connectDB();
  const settings = await EmailSettings.findOneAndUpdate(
    { organizationId: auth.organizationId },
    {
      $set: {
        fromEmail: body.fromEmail,
        fromName: body.fromName,
        welcomeEnabled: body.welcomeEnabled,
        passwordResetEnabled: body.passwordResetEnabled,
        invoiceEnabled: body.invoiceEnabled,
        appointmentReminderEnabled: body.appointmentReminderEnabled,
        paymentConfirmationEnabled: body.paymentConfirmationEnabled,
        orderConfirmationEnabled: body.orderConfirmationEnabled,
        newClientNotificationEnabled: body.newClientNotificationEnabled,
        paymentReceivedNotificationEnabled: body.paymentReceivedNotificationEnabled,
      },
    },
    { upsert: true, new: true }
  );
  return NextResponse.json({ success: true, settings });
});
