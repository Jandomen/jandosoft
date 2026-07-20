import mongoose from "mongoose";
import { AudienceSegment, SegmentResult, SegmentFilter } from "./types";

export const SEGMENT_DEFINITIONS: SegmentFilter[] = [
  { segment: "all", label: "Todos los clientes", description: "Todos los clientes activos del negocio" },
  { segment: "new", label: "Clientes nuevos", description: "Clientes registrados en los últimos 30 días" },
  { segment: "frequent", label: "Clientes frecuentes", description: "Clientes con 3 o más compras" },
  { segment: "vip", label: "Clientes VIP", description: "Clientes con gasto total ≥ $500" },
  { segment: "inactive", label: "Clientes inactivos", description: "Sin actividad en los últimos 90 días" },
  { segment: "recent_purchasers", label: "Compras recientes", description: "Clientes con compra en los últimos 30 días" },
  { segment: "no_purchase_days", label: "Sin compras en X días", description: "Clientes sin compra en un período configurable", criteria: { daysSincePurchase: 60 } },
  { segment: "upcoming_appointments", label: "Con citas próximas", description: "Clientes con cita agendada en los próximos 7 días" },
  { segment: "birthday", label: "Cumpleañeros", description: "Clientes con cumpleaños este mes" },
];

export async function getSegmentCustomers(
  storeId: string,
  segment: AudienceSegment,
  customDays?: number
): Promise<SegmentResult> {
  const Customer = mongoose.model("Customer");
  const Appointment = mongoose.model("Appointment");
  const storeObjectId = new mongoose.Types.ObjectId(storeId);
  
  let query: Record<string, any> = { storeId: storeObjectId };
  const now = new Date();
  let label = "";

  switch (segment) {
    case "new":
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      query.createdAt = { $gte: thirtyDaysAgo };
      label = "Clientes nuevos";
      break;
    case "frequent":
      query.totalOrders = { $gte: 3 };
      label = "Clientes frecuentes";
      break;
    case "vip":
      query.totalSpent = { $gte: 500 };
      label = "Clientes VIP";
      break;
    case "inactive":
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      query.lastActivityAt = { $lt: ninetyDaysAgo };
      label = "Clientes inactivos";
      break;
    case "recent_purchasers":
      const recent30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      query.lastPurchaseAt = { $gte: recent30 };
      label = "Compras recientes";
      break;
    case "no_purchase_days":
      const days = customDays || 60;
      const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      query.$or = [
        { lastPurchaseAt: { $lt: cutoff } },
        { lastPurchaseAt: { $exists: false } }
      ];
      label = `Sin compras en ${days} días`;
      break;
    case "upcoming_appointments":
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const apptCustomers = await Appointment.find({
        storeId: storeObjectId,
        date: { $gte: now.toISOString().split("T")[0], $lte: nextWeek.toISOString().split("T")[0] },
        status: { $in: ["pending", "confirmed"] }
      }).select("customerEmail");
      const emails = apptCustomers.map((a: any) => a.customerEmail).filter(Boolean);
      if (emails.length === 0) {
        return { segment, label: "Con citas próximas", count: 0, customerIds: [], excludedCount: 0, excludedReasons: {} };
      }
      query.email = { $in: emails };
      label = "Con citas próximas";
      break;
    case "birthday":
      const month = now.getMonth() + 1;
      query.$expr = { $eq: [{ $month: "$birthDate" }, month] };
      label = "Cumpleañeros del mes";
      break;
    case "all":
    default:
      label = "Todos los clientes";
      break;
  }

  const customers = await Customer.find(query).select("_id");
  const customerIds = customers.map((c: any) => c._id);

  return {
    segment,
    label,
    count: customerIds.length,
    customerIds,
    excludedCount: 0,
    excludedReasons: {}
  };
}

export async function applyExclusions(
  storeId: string,
  customerIds: mongoose.Types.ObjectId[],
  settings: { autoExcludeBounced: boolean; autoExcludeUnsubscribed: boolean; autoExcludeNoContact: boolean }
): Promise<{ included: mongoose.Types.ObjectId[]; excluded: number; reasons: Record<string, number> }> {
  const Customer = mongoose.model("Customer");
  const reasons: Record<string, number> = { bounced: 0, unsubscribed: 0, noContact: 0, invalidEmail: 0 };

  if (customerIds.length === 0) {
    return { included: [], excluded: 0, reasons };
  }

  let excludedIds = new Set<string>();

  if (settings.autoExcludeBounced) {
    const bounced = await Customer.find({ _id: { $in: customerIds }, tags: "bounced" }).select("_id");
    bounced.forEach((c: any) => { excludedIds.add(c._id.toString()); reasons.bounced++; });
  }

  if (settings.autoExcludeUnsubscribed) {
    const unsub = await Customer.find({ _id: { $in: customerIds }, status: "unsubscribed" }).select("_id");
    unsub.forEach((c: any) => { excludedIds.add(c._id.toString()); reasons.unsubscribed++; });
  }

  if (settings.autoExcludeNoContact) {
    const noContact = await Customer.find({ _id: { $in: customerIds }, tags: "no-contact" }).select("_id");
    noContact.forEach((c: any) => { excludedIds.add(c._id.toString()); reasons.noContact++; });
  }

  // Invalid emails
  const customers = await Customer.find({ _id: { $in: customerIds } }).select("_id email");
  customers.forEach((c: any) => {
    if (c.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) {
      excludedIds.add(c._id.toString());
      reasons.invalidEmail++;
    }
  });

  const included = customerIds.filter(id => !excludedIds.has(id.toString()));
  return { included, excluded: excludedIds.size, reasons };
}
