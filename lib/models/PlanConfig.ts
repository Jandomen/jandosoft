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
}

export interface IPlan {
  id: string;
  name: string;
  price: number;
  desc: string;
  popular: boolean;
  features: string[];
  limits: IPlanLimits;
  stripePriceId?: string;
  stripeProductId?: string;
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
}, { _id: false });

const PlanSchema = new Schema<IPlan>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  desc: { type: String, default: "" },
  popular: { type: Boolean, default: false },
  features: [String],
  limits: { type: PlanLimitsSchema, default: () => ({}) },
  stripePriceId: { type: String, default: null },
  stripeProductId: { type: String, default: null },
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
    name: "Starter",
    price: 29,
    desc: "Perfecto para emprender tu negocio digital",
    popular: false,
    features: ["Productos", "Clientes", "Pedidos", "Facturación", "IA básica", "Correos automáticos"],
    limits: { maxStores: 3, maxProductsPerStore: 50, maxMessages: 50, maxAutomations: 10 },
  },
  {
    id: "business",
    name: "Business",
    price: 79,
    desc: "La opción más completa para hacer crecer tu negocio",
    popular: true,
    features: ["Todo Starter", "CRM avanzado", "WhatsApp Business", "Campañas", "Automatizaciones", "Analytics", "Clientes ilimitados"],
    limits: { maxStores: 20, maxProductsPerStore: 500, maxMessages: 200, maxAutomations: 50 },
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 199,
    desc: "Para empresas que necesitan potencia y control total",
    popular: false,
    features: ["Todo Business", "Multiusuario", "Roles y permisos", "API", "Integraciones avanzadas", "IA avanzada", "Soporte prioritario"],
    limits: { maxStores: 999, maxProductsPerStore: 9999, maxMessages: 999, maxAutomations: 999 },
  },
];

export const DEFAULT_FREE_PLAN: IFreePlan = {
  id: "free",
  name: "Gratis",
  features: ["Productos", "Clientes", "Pedidos", "Facturación"],
  limits: { maxStores: 1, maxProductsPerStore: 10, maxMessages: 10, maxAutomations: 2 },
};
