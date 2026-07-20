import { Types } from "mongoose";
import { BatchConfig, BatchInfo } from "./types";

export function calculateBatches(
  totalRecipients: number,
  batchSize: number = 50,
  batchDelaySeconds: number = 30
): BatchConfig {
  const estimatedBatches = Math.ceil(totalRecipients / batchSize);
  const estimatedDurationMinutes = (estimatedBatches * batchDelaySeconds) / 60;

  return {
    totalRecipients,
    batchSize,
    batchDelaySeconds,
    estimatedBatches,
    estimatedDurationMinutes: Math.round(estimatedDurationMinutes * 10) / 10
  };
}

export function createBatches(
  recipientIds: Types.ObjectId[],
  batchSize: number = 50,
  batchDelaySeconds: number = 30,
  startAt?: Date
): BatchInfo[] {
  const batches: BatchInfo[] = [];
  const startTime = startAt || new Date();

  for (let i = 0; i < recipientIds.length; i += batchSize) {
    const batchNumber = Math.floor(i / batchSize) + 1;
    const scheduledAt = new Date(startTime.getTime() + (batchNumber - 1) * batchDelaySeconds * 1000);

    batches.push({
      batchNumber,
      recipients: recipientIds.slice(i, i + batchSize),
      scheduledAt,
      status: "pending"
    });
  }

  return batches;
}

export function estimateDuration(recipientCount: number, channel: "email" | "sms" | "whatsapp"): string {
  const sendTimePerUnit: Record<string, number> = {
    email: 0.5,    // 0.5 seconds per email
    sms: 1,        // 1 second per SMS
    whatsapp: 2    // 2 seconds per WhatsApp
  };

  const seconds = recipientCount * (sendTimePerUnit[channel] || 1);

  if (seconds < 60) return `${Math.ceil(seconds)} segundos`;
  if (seconds < 3600) return `${Math.ceil(seconds / 60)} minutos`;
  return `${(seconds / 3600).toFixed(1)} horas`;
}
