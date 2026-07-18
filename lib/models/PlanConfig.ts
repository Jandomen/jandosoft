import mongoose, { Schema, Document } from "mongoose";

export interface IPlanFeature {
  id: string;
  label: string;
  free: string | boolean;
  starter: string | boolean;
  business: string | boolean;
  enterprise: string | boolean;
}

export interface IPlanLimits {
  maxStores: number;
  maxProductsPerStore: number;
  maxMessages: number;
  maxAutomations: number;
  maxAppointments: number;
  maxCampaigns: number;
  maxCustomers: number;
}

export interface IPlan {
  id: string;
  name: string;
  price: number;
  currency?: string;
  priceUsd?: number;
  desc: string;
  popular: boolean;
  features: string[];
  limits: IPlanLimits;
  stripePriceId?: string;
  stripeProductId?: string;
  stripePriceIdUsd?: string;
}

export interface IFreePlan {
  id: string;
  name: string;
  features: string[];
  limits: IPlanLimits;
}

export interface IPlanConfig extends Document {
  plans: IPlan[];
  freePlan: IFreePlan;
}

const PlanLimitsSchema = new Schema<IPlanLimits>({
  maxStores: { type: Number, default: 1 },
  maxProductsPerStore: { type: Number, default: 10 },
  maxMessages: { type: Number, default: 10 },
  maxAutomations: { type: Number, default: 2 },
  maxAppointments: { type: Number, default: 999 },
  maxCampaigns: { type: Number, default: 999 },
  maxCustomers: { type: Number, default: 999 },
}, { _id: false });

const PlanSchema = new Schema<IPlan>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  currency: { type: String, default: "usd" },
  desc: { type: String, default: "" },
  popular: { type: Boolean, default: false },
  features: [String],
  limits: { type: PlanLimitsSchema, default: () => ({}) },
  stripePriceId: { type: String, default: null },
  stripeProductId: { type: String, default: null },
  stripePriceIdUsd: { type: String, default: null },
}, { _id: false });

const FreePlanSchema = new Schema<IFreePlan>({
  id: { type: String, default: "free" },
  name: { type: String, default: "Gratis" },
  features: [String],
  limits: { type: PlanLimitsSchema, default: () => ({}) },
}, { _id: false });

const PlanConfigSchema = new Schema<IPlanConfig>({
  plans: [PlanSchema],
  freePlan: { type: FreePlanSchema, default: () => ({}) },
}, { timestamps: true });

export const PlanConfig = mongoose.models.PlanConfig || mongoose.model<IPlanConfig>("PlanConfig", PlanConfigSchema);

export const DEFAULT_PLANS: IPlan[] = [
  {
    id: "starter",
    name: "El Gallito",
    price: 29,
    priceUsd: 29,
    currency: "usd",
    desc: "Pa' empezar con todo, sin miedo al éxito",
    popular: false,
    features: ["Productos", "Clientes", "Pedidos", "Facturación", "IA básica", "Correos automáticos"],
    limits: { maxStores: 3, maxProductsPerStore: 50, maxMessages: 50, maxAutomations: 10, maxAppointments: 50, maxCampaigns: 20, maxCustomers: 200 },
  },
  {
    id: "business",
    name: "El Jefe",
    price: 79,
    priceUsd: 79,
    currency: "usd",
    desc: "El que manda, el que decide, el que crece",
    popular: true,
    features: ["Todo El Gallito", "CRM avanzado", "WhatsApp Business", "Campañas", "Automatizaciones", "Analytics", "Clientes ilimitados"],
    limits: { maxStores: 20, maxProductsPerStore: 500, maxMessages: 200, maxAutomations: 50, maxAppointments: 500, maxCampaigns: 100, maxCustomers: 5000 },
  },
  {
    id: "enterprise",
    name: "El Patrón",
    price: 199,
    priceUsd: 199,
    currency: "usd",
    desc: "El dueño de todo, sin límites, sin fronteras",
    popular: false,
    features: ["Todo El Jefe", "Multiusuario", "Roles y permisos", "API", "Integraciones avanzadas", "IA avanzada", "Soporte prioritario"],
    limits: { maxStores: 999, maxProductsPerStore: 9999, maxMessages: 999, maxAutomations: 999, maxAppointments: 9999, maxCampaigns: 9999, maxCustomers: 99999 },
  },
];

export const DEFAULT_FREE_PLAN: IFreePlan = {
  id: "free",
  name: "Gratis",
  features: ["1 producto", "2 citas", "2 campañas", "10 mensajes IA"],
  limits: { maxStores: 1, maxProductsPerStore: 1, maxMessages: 10, maxAutomations: 2, maxAppointments: 2, maxCampaigns: 2, maxCustomers: 0 },
};
