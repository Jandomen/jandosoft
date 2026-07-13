import type { ToolDefinition } from "@/lib/ai/tools";
import type { Domain } from "@/lib/ai/tools";

interface ModuleManifest {
  domain: Domain;
  required: boolean;
  dependsOn?: Domain[];
}

const MODULE_REGISTRY: Record<string, ModuleManifest> = {
  products: { domain: "products", required: true },
  booking: { domain: "booking", required: false },
  crm: { domain: "crm", required: false },
  payments: { domain: "payments", required: false },
  email: { domain: "email", required: false },
  analytics: { domain: "analytics", required: false },
  marketing: { domain: "marketing", required: false },
  admin: { domain: "admin", required: true },
};

const PLAN_MODULES: Record<string, string[]> = {
  free: ["products", "admin"],
  starter: ["products", "booking", "crm", "admin"],
  business: ["products", "booking", "crm", "payments", "email", "marketing", "admin"],
  enterprise: ["products", "booking", "crm", "payments", "email", "marketing", "analytics", "admin"],
};

export function getEnabledDomains(plan?: string): Domain[] {
  const modules = PLAN_MODULES[plan || "free"] || PLAN_MODULES.free;
  const domainSet = new Set<Domain>();

  for (const moduleName of modules) {
    const manifest = MODULE_REGISTRY[moduleName];
    if (manifest) {
      domainSet.add(manifest.domain);
    }
  }

  return [...domainSet];
}

export function filterToolsByPlan(
  tools: ToolDefinition[],
  plan?: string
): ToolDefinition[] {
  const enabledDomains = new Set(getEnabledDomains(plan));
  return tools.filter((t) => {
    const domain = getDomainForTool(t.function.name);
    return !domain || enabledDomains.has(domain);
  });
}

function getDomainForTool(toolName: string): Domain | null {
  const { DOMAIN_TOOLS } = require("./tools/domains") as typeof import("./tools/domains");
  for (const [domain, tools] of Object.entries(DOMAIN_TOOLS)) {
    if (tools.includes(toolName)) return domain as Domain;
  }
  return null;
}

const INTENT_MODULES: Record<string, Domain[]> = {
  vender: ["products", "payments"],
  agendar: ["booking"],
  cliente: ["crm"],
  factura: ["payments"],
  correo: ["email"],
  estadistica: ["analytics"],
  marketing: ["marketing"],
  configurar: ["admin"],
  integrar: ["admin"],
};

export function getModulesForIntent(intent: string): Domain[] {
  for (const [keyword, domains] of Object.entries(INTENT_MODULES)) {
    if (intent.toLowerCase().includes(keyword)) return domains;
  }
  return [];
}

export function hasModule(plan: string | undefined, domain: Domain): boolean {
  const domains = getEnabledDomains(plan);
  return domains.includes(domain);
}
