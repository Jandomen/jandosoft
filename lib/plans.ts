export interface PlanLimits {
  maxStores: number;
  maxProductsPerStore: number;
  maxMessages: number;
  maxAutomations: number;
}

export interface PlanConfig {
  id: string;
  name: string;
  price: number;
  desc: string;
  descKey?: string;
  nameKey?: string;
  popular: boolean;
  features: string[];
  limits: PlanLimits;
  inherits?: string;
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
  limits: { maxStores: 1, maxProductsPerStore: 10, maxMessages: 10, maxAutomations: 2 },
};

export const PLANS: PlanConfig[] = [
  {
    id: "starter",
    name: "Starter",
    nameKey: "plans.starter_name",
    price: 29,
    desc: "Perfecto para emprender tu negocio digital",
    descKey: "plans.starter_desc",
    popular: false,
    features: ["plans.feature.products", "plans.feature.customers", "plans.feature.orders", "plans.feature.invoicing", "plans.feature.basic_ai", "plans.feature.auto_emails"],
    limits: { maxStores: 3, maxProductsPerStore: 50, maxMessages: 50, maxAutomations: 10 },
  },
  {
    id: "business",
    name: "Business",
    nameKey: "plans.business_name",
    price: 79,
    desc: "La opción más completa para hacer crecer tu negocio",
    descKey: "plans.business_desc",
    popular: true,
    inherits: "starter",
    features: ["plans.feature.campaigns", "plans.feature.automations", "plans.feature.analytics", "plans.feature.knowledge_base", "plans.feature.appointments", "plans.feature.integrations", "plans.feature.whatsapp", "plans.feature.communications", "plans.feature.social_media"],
    limits: { maxStores: 20, maxProductsPerStore: 500, maxMessages: 200, maxAutomations: 50 },
  },
  {
    id: "enterprise",
    name: "Enterprise",
    nameKey: "plans.enterprise_name",
    price: 199,
    desc: "Para empresas que necesitan potencia y control total",
    descKey: "plans.enterprise_desc",
    popular: false,
    inherits: "business",
    features: ["plans.feature.api", "plans.feature.smart_forms", "plans.feature.advanced_integrations", "plans.feature.advanced_ai", "plans.feature.priority_support", "plans.feature.multi_user"],
    limits: { maxStores: 999, maxProductsPerStore: 9999, maxMessages: 999, maxAutomations: 999 },
  },
];

export function getPlanLimits(subscription: string | null): PlanLimits {
  const sub = subscription || "free";
  if (sub === "free") return FREE_PLAN.limits;
  const plan = PLANS.find((p) => p.id === sub);
  return plan?.limits || FREE_PLAN.limits;
}

export function getPlanLabel(subscription: string | null): string {
  if (!subscription) return "SIN PLAN";
  if (subscription === "free") return "GRATIS";
  return `PLAN ${subscription.toUpperCase()}`;
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
