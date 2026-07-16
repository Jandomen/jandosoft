import mongoose, { Schema, Document } from "mongoose";

/* ── Table ── */
export type TableStatus = "free" | "occupied" | "reserved" | "cleaning";

export interface ITable {
  id: number;
  number: number;
  capacity: number;
  section: string;
  status: TableStatus;
  x: number;
  y: number;
  width: number;
  height: number;
  shape: "square" | "round" | "rectangle";
}

/* ── Restaurant Order ── */
export type RestaurantOrderStatus = "received" | "preparing" | "ready" | "delivered" | "cancelled";
export type OrderType = "dine_in" | "takeout" | "delivery";

export interface IOrderItem {
  menuItemId: number;
  name: string;
  price: number;
  quantity: number;
  notes: string;
  modifiers: string[];
}

export interface IRestaurantOrder {
  id: number;
  tableNumber?: number;
  orderType: OrderType;
  items: IOrderItem[];
  subtotal: number;
  tax: number;
  tip: number;
  discount: number;
  total: number;
  status: RestaurantOrderStatus;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  paymentStatus: "unpaid" | "paid" | "refunded";
  paymentMethod?: string;
  couponCode?: string;
  pointsEarned: number;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

/* ── Reservation ── */
export type ReservationStatus = "pending" | "confirmed" | "seated" | "completed" | "cancelled" | "no_show";

export interface IReservation {
  id: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  date: string;
  time: string;
  partySize: number;
  tableNumber?: number;
  status: ReservationStatus;
  notes: string;
  createdAt: Date;
}

/* ── Promotion / Coupon ── */
export type PromotionType = "percentage" | "fixed" | "bogo" | "free_item";

export interface IPromotion {
  id: number;
  code: string;
  description: string;
  type: PromotionType;
  value: number;
  minOrder: number;
  maxUses: number;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  active: boolean;
  applicableItems: number[];
}

/* ── Points / Loyalty ── */
export interface IPointsTransaction {
  id: number;
  customerId: string;
  customerName: string;
  customerEmail: string;
  points: number;
  type: "earned" | "redeemed" | "adjusted";
  description: string;
  orderId?: number;
  createdAt: Date;
}

export interface ICustomerLoyalty {
  customerId: string;
  customerName: string;
  customerEmail: string;
  totalPoints: number;
  totalVisits: number;
  totalSpent: number;
  lastVisit: Date;
  tier: "bronze" | "silver" | "gold" | "platinum";
}

/* ── Review ── */
export interface IRestaurantReview {
  id: number;
  customerName: string;
  customerEmail: string;
  rating: number;
  comment: string;
  orderId?: number;
  reply?: string;
  createdAt: Date;
}

/* ── Waiter Call ── */
export type WaiterCallStatus = "pending" | "acknowledged" | "resolved";

export interface IWaiterCall {
  id: number;
  tableNumber: number;
  message: string;
  status: WaiterCallStatus;
  createdAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
}

/* ── Floor Plan ── */
export interface IFloorPlan {
  width: number;
  height: number;
  backgroundColor: string;
  tables: ITable[];
}

/* ── Restaurant Document ── */
export interface IRestaurant extends Document {
  storeId: mongoose.Types.ObjectId;
  floorPlan: IFloorPlan;
  orders: IRestaurantOrder[];
  reservations: IReservation[];
  promotions: IPromotion[];
  pointsTransactions: IPointsTransaction[];
  loyaltyCustomers: ICustomerLoyalty[];
  reviews: IRestaurantReview[];
  waiterCalls: IWaiterCall[];
  settings: {
    taxRate: number;
    defaultTipPercent: number;
    currency: string;
    openingTime: string;
    closingTime: string;
    reservationDuration: number;
    maxPartySize: number;
    pointsPerDollar: number;
    rewardsThreshold: number;
    autoAcceptReservations: boolean;
  };
  updatedAt: Date;
}

const TableSchema = new Schema<ITable>(
  {
    id: { type: Number, required: true },
    number: { type: Number, required: true },
    capacity: { type: Number, default: 4 },
    section: { type: String, default: "General" },
    status: { type: String, enum: ["free", "occupied", "reserved", "cleaning"], default: "free" },
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    width: { type: Number, default: 80 },
    height: { type: Number, default: 80 },
    shape: { type: String, enum: ["square", "round", "rectangle"], default: "square" },
  },
  { _id: false }
);

const OrderItemSchema = new Schema<IOrderItem>(
  {
    menuItemId: { type: Number, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, default: 1 },
    notes: { type: String, default: "" },
    modifiers: [{ type: String }],
  },
  { _id: false }
);

const RestaurantOrderSchema = new Schema<IRestaurantOrder>(
  {
    id: { type: Number, required: true },
    tableNumber: { type: Number },
    orderType: { type: String, enum: ["dine_in", "takeout", "delivery"], default: "dine_in" },
    items: [OrderItemSchema],
    subtotal: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    tip: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    status: { type: String, enum: ["received", "preparing", "ready", "delivered", "cancelled"], default: "received" },
    customerName: { type: String },
    customerPhone: { type: String },
    customerEmail: { type: String },
    paymentStatus: { type: String, enum: ["unpaid", "paid", "refunded"], default: "unpaid" },
    paymentMethod: { type: String },
    couponCode: { type: String },
    pointsEarned: { type: Number, default: 0 },
    notes: { type: String, default: "" },
  },
  { _id: false, timestamps: true }
);

const ReservationSchema = new Schema<IReservation>(
  {
    id: { type: Number, required: true },
    customerName: { type: String, required: true },
    customerEmail: { type: String, default: "" },
    customerPhone: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    partySize: { type: Number, required: true },
    tableNumber: { type: Number },
    status: { type: String, enum: ["pending", "confirmed", "seated", "completed", "cancelled", "no_show"], default: "pending" },
    notes: { type: String, default: "" },
  },
  { _id: false, timestamps: { createdAt: true, updatedAt: false } }
);

const PromotionSchema = new Schema<IPromotion>(
  {
    id: { type: Number, required: true },
    code: { type: String, required: true, uppercase: true },
    description: { type: String, default: "" },
    type: { type: String, enum: ["percentage", "fixed", "bogo", "free_item"], default: "percentage" },
    value: { type: Number, default: 0 },
    minOrder: { type: Number, default: 0 },
    maxUses: { type: Number, default: 100 },
    usedCount: { type: Number, default: 0 },
    validFrom: { type: String, required: true },
    validUntil: { type: String, required: true },
    active: { type: Boolean, default: true },
    applicableItems: [{ type: Number }],
  },
  { _id: false }
);

const PointsTransactionSchema = new Schema<IPointsTransaction>(
  {
    id: { type: Number, required: true },
    customerId: { type: String, required: true },
    customerName: { type: String, default: "" },
    customerEmail: { type: String, default: "" },
    points: { type: Number, required: true },
    type: { type: String, enum: ["earned", "redeemed", "adjusted"], default: "earned" },
    description: { type: String, default: "" },
    orderId: { type: Number },
  },
  { _id: false, timestamps: { createdAt: true, updatedAt: false } }
);

const CustomerLoyaltySchema = new Schema<ICustomerLoyalty>(
  {
    customerId: { type: String, required: true },
    customerName: { type: String, default: "" },
    customerEmail: { type: String, default: "" },
    totalPoints: { type: Number, default: 0 },
    totalVisits: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    lastVisit: { type: Date },
    tier: { type: String, enum: ["bronze", "silver", "gold", "platinum"], default: "bronze" },
  },
  { _id: false }
);

const ReviewSchema = new Schema<IRestaurantReview>(
  {
    id: { type: Number, required: true },
    customerName: { type: String, required: true },
    customerEmail: { type: String, default: "" },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "" },
    orderId: { type: Number },
    reply: { type: String },
  },
  { _id: false, timestamps: { createdAt: true, updatedAt: false } }
);

const WaiterCallSchema = new Schema<IWaiterCall>(
  {
    id: { type: Number, required: true },
    tableNumber: { type: Number, required: true },
    message: { type: String, default: "" },
    status: { type: String, enum: ["pending", "acknowledged", "resolved"], default: "pending" },
    acknowledgedAt: { type: Date },
    resolvedAt: { type: Date },
  },
  { _id: false, timestamps: { createdAt: true, updatedAt: false } }
);

const RestaurantSchema = new Schema<IRestaurant>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true, unique: true },
    floorPlan: {
      width: { type: Number, default: 800 },
      height: { type: Number, default: 600 },
      backgroundColor: { type: String, default: "#f5f5f4" },
      tables: [TableSchema],
    },
    orders: [RestaurantOrderSchema],
    reservations: [ReservationSchema],
    promotions: [PromotionSchema],
    pointsTransactions: [PointsTransactionSchema],
    loyaltyCustomers: [CustomerLoyaltySchema],
    reviews: [ReviewSchema],
    waiterCalls: [WaiterCallSchema],
    settings: {
      taxRate: { type: Number, default: 0.16 },
      defaultTipPercent: { type: Number, default: 0.15 },
      currency: { type: String, default: "USD" },
      openingTime: { type: String, default: "09:00" },
      closingTime: { type: String, default: "22:00" },
      reservationDuration: { type: Number, default: 90 },
      maxPartySize: { type: Number, default: 20 },
      pointsPerDollar: { type: Number, default: 1 },
      rewardsThreshold: { type: Number, default: 100 },
      autoAcceptReservations: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

RestaurantSchema.index({ storeId: 1 }, { unique: true });

export const Restaurant =
  mongoose.models.Restaurant || mongoose.model<IRestaurant>("Restaurant", RestaurantSchema);
