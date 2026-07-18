import type { StoreModule as StoreModuleType } from "@/lib/models/Store";
import type { Domain } from "@/lib/ai/router";

export type StoreModule = StoreModuleType;

export const MODULE_DOMAINS: Record<StoreModule, Domain[]> = {
  services: ["crm", "booking", "products", "payments", "email", "analytics", "marketing", "industry"],
  documents: ["legal"],
  inventory: ["inventory"],
  education: ["education"],
};

export const MODULE_LABELS: Record<StoreModule, string> = {
  services: "Servicios (productos, clientes, citas, pedidos, pagos, marketing, automatizaciones)",
  documents: "Documentos Legales (documentos, expedientes, audiencias)",
  inventory: "Inventario (control de stock, almacén, proveedores)",
  education: "Educación (clases, cursos, estudiantes, inscripciones)",
};

export function getDomainsForModules(modules: StoreModule[]): Domain[] {
  const domains = new Set<Domain>();
  for (const mod of modules) {
    for (const d of MODULE_DOMAINS[mod]) {
      domains.add(d);
    }
  }
  return [...domains];
}

export function getModulesDescription(modules: StoreModule[]): string {
  return modules.map((m) => `  - ${MODULE_LABELS[m]}`).join("\n");
}
