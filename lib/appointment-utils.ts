import { connectDB } from "@/lib/mongodb";
import { Appointment } from "@/lib/models/Appointment";

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function getAptDuration(apt: any): number {
  return apt.duration || apt.service?.duration || 60;
}

export function intervalsOverlap(
  start1: string, duration1: number,
  start2: string, duration2: number
): boolean {
  const s1 = timeToMinutes(start1);
  const e1 = s1 + duration1;
  const s2 = timeToMinutes(start2);
  const e2 = s2 + duration2;
  return s1 < e2 && s2 < e1;
}

export interface ConflictResult {
  hasConflict: boolean;
  conflictingAppointments: {
    _id: string;
    customerName: string;
    serviceName: string;
    time: string;
    duration: number;
    status: string;
  }[];
}

export async function checkAppointmentConflict(
  storeId: string,
  date: string,
  time: string,
  duration: number,
  excludeId?: string
): Promise<ConflictResult> {
  await connectDB();

  const activeStatuses = ["pending", "confirmed", "in_progress"];
  const query: any = {
    storeId,
    date,
    status: { $in: activeStatuses },
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const existingAppointments = await Appointment.find(query).lean();

  const conflicting = existingAppointments.filter((apt: any) => {
    const aptDur = getAptDuration(apt);
    return intervalsOverlap(time, duration, apt.time, aptDur);
  });

  return {
    hasConflict: conflicting.length > 0,
    conflictingAppointments: conflicting.map((apt: any) => ({
      _id: String(apt._id),
      customerName: apt.customerInfo?.name || "Desconocido",
      serviceName: apt.service?.name || "Sin servicio",
      time: apt.time,
      duration: getAptDuration(apt),
      status: apt.status,
    })),
  };
}

export async function getAvailableSlots(
  storeId: string,
  date: string,
  slotDuration: number = 30,
  dayStart: string = "09:00",
  dayEnd: string = "18:00"
): Promise<{ time: string; available: boolean; conflictWith?: string }[]> {
  await connectDB();

  const activeStatuses = ["pending", "confirmed", "in_progress"];
  const existingAppointments = await Appointment.find({
    storeId,
    date,
    status: { $in: activeStatuses },
  }).lean();

  const startMinutes = timeToMinutes(dayStart);
  const endMinutes = timeToMinutes(dayEnd);
  const slots: { time: string; available: boolean; conflictWith?: string }[] = [];

  for (let m = startMinutes; m < endMinutes; m += slotDuration) {
    const slotTime = minutesToTime(m);

    const overlapping = existingAppointments.find((apt: any) => {
      const aptDur = getAptDuration(apt);
      return intervalsOverlap(slotTime, slotDuration, apt.time, aptDur);
    });

    slots.push({
      time: slotTime,
      available: !overlapping,
      conflictWith: overlapping
        ? `${overlapping.customerInfo?.name || "Cliente"} (${overlapping.service?.name || "Servicio"})`
        : undefined,
    });
  }

  return slots;
}
