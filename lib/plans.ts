export interface PlanLimits {
  maxStores: number;
  maxProductsPerStore: number;
  maxMessages: number;
  maxAutomations: number;
  maxAppointments: number;
  maxCampaigns: number;
  maxCustomers: number;
  maxWhatsAppNumbers: number;
  maxWhatsAppMessagesPerDay: number;
  maxWhatsAppTemplates: number;
}

export interface PlanConfig {
  id: string;
  name: string;
  price: number;
  priceUsd?: number;
  desc: string;
  descKey?: string;
  nameKey?: string;
  popular: boolean;
  features: string[];
  limits: PlanLimits;
  inherits?: string;
  durationDays?: number;
  stripePriceId?: string;
  stripeProductId?: string;
}

export interface FreePlanConfig {
  id: string;
  name: string;
  nameKey?: string;
  features: string[];
  limits: PlanLimits;
}

export const FREE_PLAN: FreePlanConfig = {
  id: "free",
  name: "Gratis",
  nameKey: "plans.free_name",
  features: ["plans.feature.products", "plans.feature.customers", "plans.feature.orders", "plans.feature.invoicing"],
  limits: { maxStores: 1, maxProductsPerStore: 1, maxMessages: 10, maxAutomations: 2, maxAppointments: 2, maxCampaigns: 2, maxCustomers: 0, maxWhatsAppNumbers: 1, maxWhatsAppMessagesPerDay: 10, maxWhatsAppTemplates: 2 },
};

export const PLANS: PlanConfig[] = [
  {
    id: "starter",
    name: "El Gallito",
    nameKey: "plans.starter_name",
    price: 29,
    desc: "Pa' empezar con todo, sin miedo al éxito",
    descKey: "plans.starter_desc",
    popular: false,
    priceUsd: 29,
    features: ["plans.feature.products", "plans.feature.customers", "plans.feature.orders", "plans.feature.invoicing", "plans.feature.basic_ai", "plans.feature.auto_emails"],
    limits: { maxStores: 3, maxProductsPerStore: 50, maxMessages: 50, maxAutomations: 10, maxAppointments: 50, maxCampaigns: 20, maxCustomers: 200, maxWhatsAppNumbers: 1, maxWhatsAppMessagesPerDay: 100, maxWhatsAppTemplates: 5 },
  },
  {
    id: "business",
    name: "El Jefe",
    nameKey: "plans.business_name",
    price: 79,
    desc: "El que manda, el que decide, el que crece",
    descKey: "plans.business_desc",
    popular: true,
    inherits: "starter",
    priceUsd: 79,
    features: ["plans.feature.campaigns", "plans.feature.automations", "plans.feature.analytics", "plans.feature.knowledge_base", "plans.feature.appointments", "plans.feature.integrations", "plans.feature.whatsapp", "plans.feature.communications", "plans.feature.social_media"],
    limits: { maxStores: 20, maxProductsPerStore: 500, maxMessages: 200, maxAutomations: 50, maxAppointments: 500, maxCampaigns: 100, maxCustomers: 5000, maxWhatsAppNumbers: 3, maxWhatsAppMessagesPerDay: 500, maxWhatsAppTemplates: 50 },
  },
  {
    id: "enterprise",
    name: "El Patrón",
    nameKey: "plans.enterprise_name",
    price: 199,
    desc: "El dueño de todo, sin límites, sin fronteras",
    descKey: "plans.enterprise_desc",
    popular: false,
    inherits: "business",
    priceUsd: 199,
    features: ["plans.feature.api", "plans.feature.smart_forms", "plans.feature.advanced_integrations", "plans.feature.advanced_ai", "plans.feature.priority_support", "plans.feature.multi_user"],
    limits: { maxStores: 999, maxProductsPerStore: 9999, maxMessages: 999, maxAutomations: 999, maxAppointments: 9999, maxCampaigns: 9999, maxCustomers: 99999, maxWhatsAppNumbers: 10, maxWhatsAppMessagesPerDay: 9999, maxWhatsAppTemplates: 999 },
  },
  {
    id: "caguamon",
    name: "El Caguamón",
    nameKey: "plans.caguamon_name",
    price: 30,
    desc: "La probadita pa' que veas de qué va",
    descKey: "plans.caguamon_desc",
    popular: false,
    inherits: "starter",
    durationDays: 3,
    priceUsd: 1.5,
    features: ["plans.feature.products", "plans.feature.customers"],
    limits: { maxStores: 1, maxProductsPerStore: 10, maxMessages: 10, maxAutomations: 1, maxAppointments: 5, maxCampaigns: 1, maxCustomers: 50, maxWhatsAppNumbers: 0, maxWhatsAppMessagesPerDay: 0, maxWhatsAppTemplates: 0 },
  },
  {
    id: "tacos",
    name: "Tacos al Pastor",
    nameKey: "plans.tacos_name",
    price: 50,
    desc: "Pa'l antojo de crecer rapidito",
    descKey: "plans.tacos_desc",
    popular: false,
    inherits: "starter",
    durationDays: 5,
    priceUsd: 2.5,
    features: ["plans.feature.products", "plans.feature.customers", "plans.feature.orders", "plans.feature.basic_ai"],
    limits: { maxStores: 1, maxProductsPerStore: 25, maxMessages: 20, maxAutomations: 3, maxAppointments: 10, maxCampaigns: 3, maxCustomers: 100, maxWhatsAppNumbers: 0, maxWhatsAppMessagesPerDay: 0, maxWhatsAppTemplates: 0 },
  },
  {
    id: "siesta",
    name: "La Siesta",
    nameKey: "plans.siesta_name",
    price: 99,
    desc: "Una semanita pa' poner orden",
    descKey: "plans.siesta_desc",
    popular: false,
    inherits: "starter",
    durationDays: 7,
    priceUsd: 5,
    features: ["plans.feature.products", "plans.feature.customers", "plans.feature.orders", "plans.feature.invoicing", "plans.feature.basic_ai"],
    limits: { maxStores: 2, maxProductsPerStore: 50, maxMessages: 30, maxAutomations: 5, maxAppointments: 20, maxCampaigns: 5, maxCustomers: 200, maxWhatsAppNumbers: 1, maxWhatsAppMessagesPerDay: 50, maxWhatsAppTemplates: 3 },
  },
  {
    id: "mandado",
    name: "El Mandado",
    nameKey: "plans.mandado_name",
    price: 149,
    desc: "La quincena bien surtida pa' tu negocio",
    descKey: "plans.mandado_desc",
    popular: false,
    inherits: "starter",
    durationDays: 15,
    priceUsd: 7.5,
    features: ["plans.feature.products", "plans.feature.customers", "plans.feature.orders", "plans.feature.invoicing", "plans.feature.basic_ai", "plans.feature.auto_emails", "plans.feature.appointments"],
    limits: { maxStores: 3, maxProductsPerStore: 100, maxMessages: 50, maxAutomations: 10, maxAppointments: 50, maxCampaigns: 10, maxCustomers: 500, maxWhatsAppNumbers: 1, maxWhatsAppMessagesPerDay: 100, maxWhatsAppTemplates: 5 },
  },
  {
    id: "huevito",
    name: "El Huevito",
    nameKey: "plans.huevito_name",
    price: 249,
    desc: "Tres semanitas pa' avanzar sin prisas",
    descKey: "plans.huevito_desc",
    popular: false,
    inherits: "starter",
    durationDays: 21,
    priceUsd: 12.5,
    features: ["plans.feature.products", "plans.feature.customers", "plans.feature.orders", "plans.feature.invoicing", "plans.feature.basic_ai", "plans.feature.auto_emails", "plans.feature.appointments", "plans.feature.communications", "plans.feature.integrations"],
    limits: { maxStores: 5, maxProductsPerStore: 200, maxMessages: 100, maxAutomations: 20, maxAppointments: 100, maxCampaigns: 20, maxCustomers: 1000, maxWhatsAppNumbers: 2, maxWhatsAppMessagesPerDay: 200, maxWhatsAppTemplates: 15 },
  },
  {
    id: "comal",
    name: "El Comal",
    nameKey: "plans.comal_name",
    price: 599,
    desc: "3 meses calientitos, creciendo parejo",
    descKey: "plans.comal_desc",
    popular: false,
    inherits: "starter",
    durationDays: 90,
    priceUsd: 30,
    features: ["plans.feature.products", "plans.feature.customers", "plans.feature.orders", "plans.feature.invoicing", "plans.feature.basic_ai", "plans.feature.auto_emails", "plans.feature.appointments", "plans.feature.communications", "plans.feature.integrations", "plans.feature.whatsapp", "plans.feature.knowledge_base", "plans.feature.analytics"],
    limits: { maxStores: 10, maxProductsPerStore: 500, maxMessages: 200, maxAutomations: 50, maxAppointments: 200, maxCampaigns: 50, maxCustomers: 3000, maxWhatsAppNumbers: 3, maxWhatsAppMessagesPerDay: 500, maxWhatsAppTemplates: 50 },
  },
  {
    id: "hacienda",
    name: "La Hacienda",
    nameKey: "plans.hacienda_name",
    price: 999,
    desc: "Un añito de lujo, sin preocupaciones",
    descKey: "plans.hacienda_desc",
    popular: false,
    inherits: "starter",
    durationDays: 365,
    priceUsd: 50,
    features: ["plans.feature.products", "plans.feature.customers", "plans.feature.orders", "plans.feature.invoicing", "plans.feature.basic_ai", "plans.feature.auto_emails", "plans.feature.appointments", "plans.feature.communications", "plans.feature.integrations", "plans.feature.whatsapp", "plans.feature.knowledge_base", "plans.feature.analytics", "plans.feature.social_media", "plans.feature.campaigns"],
    limits: { maxStores: 20, maxProductsPerStore: 1000, maxMessages: 500, maxAutomations: 100, maxAppointments: 500, maxCampaigns: 100, maxCustomers: 10000, maxWhatsAppNumbers: 5, maxWhatsAppMessagesPerDay: 1000, maxWhatsAppTemplates: 1000 },
  },
];

export function getPlanLimits(subscription: string | null): PlanLimits {
  const sub = subscription || "free";
  if (sub === "free") return FREE_PLAN.limits;
  const plan = PLANS.find((p) => p.id === sub);
  return plan?.limits || FREE_PLAN.limits;
}

export function canUseFeature(subscription: string | null, feature: keyof PlanLimits, currentCount: number): { allowed: boolean; limit: number; remaining: number; needsUpgrade: boolean } {
  const limits = getPlanLimits(subscription);
  const limit = limits[feature];
  const remaining = Math.max(0, limit - currentCount);
  const allowed = currentCount < limit || limit >= 999;
  return { allowed, limit, remaining, needsUpgrade: !allowed && (subscription || "free") === "free" };
}

export function getPlanLabel(subscription: string | null): string {
  if (!subscription) return "SIN PLAN";
  if (subscription === "free") return "GRATIS";
  const found = PLANS.find(p => p.id === subscription);
  return found ? found.name : subscription.replace(/^plan_/i, "").replace(/_/g, " ");
}

export function inheritFeatures(plan: PlanConfig, allPlans: PlanConfig[]): string[] {
  if (!plan.inherits) return plan.features || [];
  const source = allPlans.find((p: PlanConfig) => p.id === plan.inherits);
  const sourceFeatures = source ? inheritFeatures(source, allPlans) : [];
  return [...new Set([...sourceFeatures, ...(plan.features || [])])];
}

export function buildComparisonFeatures(
  plans: PlanConfig[],
  freePlan: FreePlanConfig,
  t: (key: string, fallback?: string) => string
) {
  const allFeatures = new Set<string>();
  freePlan.features?.forEach((f: string) => allFeatures.add(f));
  plans.forEach((p: PlanConfig) => p.features?.forEach((f: string) => allFeatures.add(f)));

  const limitsList: { labelKey: string; key: keyof PlanLimits }[] = [
    { labelKey: "plans.limit_stores", key: "maxStores" },
    { labelKey: "plans.limit_products", key: "maxProductsPerStore" },
    { labelKey: "plans.limit_messages", key: "maxMessages" },
    { labelKey: "plans.limit_automations", key: "maxAutomations" },
    { labelKey: "plans.limit_appointments", key: "maxAppointments" },
    { labelKey: "plans.limit_campaigns", key: "maxCampaigns" },
    { labelKey: "plans.limit_customers", key: "maxCustomers" },
    { labelKey: "plans.limit_whatsapp_numbers", key: "maxWhatsAppNumbers" },
    { labelKey: "plans.limit_whatsapp_per_day", key: "maxWhatsAppMessagesPerDay" },
    { labelKey: "plans.limit_whatsapp_templates", key: "maxWhatsAppTemplates" },
  ];

  const formatLimit = (value: number) => value >= 999 ? t("plans.unlimited") : value?.toString() || "0";

  const result: any[] = [];

  limitsList.forEach((meta) => {
    const row: any = { label: t(meta.labelKey), _isLimit: true };
    row.free = formatLimit(freePlan.limits?.[meta.key] ?? 0);
    plans.forEach((p: PlanConfig) => { row[p.id] = formatLimit(p.limits?.[meta.key] ?? 0); });
    result.push(row);
  });

  allFeatures.forEach((feat) => {
    const row: any = { label: t(feat), _key: feat };
    row.free = !!freePlan.features?.includes(feat);
    plans.forEach((p: PlanConfig) => {
      const resolved = inheritFeatures(p, plans);
      row[p.id] = resolved.includes(feat);
    });
    result.push(row);
  });

  return result;
}
