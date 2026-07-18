import { StoreContextSnapshot, snapshotFingerprint } from "./context-isolator";

export interface CognitiveContext {
  storeId: string;
  fingerprint: string;
  timestamp: string;
  snapshot: StoreContextSnapshot;
  domain: string;
  source: "db" | "client" | "cache" | "none";
  verified: boolean;
  trace: string[];
}

export interface CognitiveContextRequest {
  message: string;
  storeId: string;
  snapshot: StoreContextSnapshot;
  authUserId?: string;
  authOrganizationId?: string | null;
  guestId?: string;
}

export function buildCognitiveContext(req: CognitiveContextRequest): CognitiveContext {
  const trace: string[] = [];
  const ts = new Date().toISOString();

  trace.push(`[Cognitive] Building context for store ${req.storeId}`);
  trace.push(`[Cognitive] Snapshot: ${req.snapshot.name} (${req.snapshot.industry || "N/A"})`);
  trace.push(`[Cognitive] Plan: ${req.snapshot.plan} | Status: ${req.snapshot.planStatus || "N/A"}`);
  trace.push(`[Cognitive] Products: ${req.snapshot.productsCount} | Services: ${req.snapshot.servicesCount}`);
  trace.push(`[Cognitive] Customers: ${req.snapshot.customersCount} | Orders: ${req.snapshot.ordersCount}`);
  trace.push(`[Cognitive] Timezone: ${req.snapshot.timezone} | Currency: ${req.snapshot.currency}`);

  if (req.authUserId) {
    trace.push(`[Cognitive] Auth user: ${req.authUserId}`);
  }
  if (req.authOrganizationId) {
    trace.push(`[Cognitive] Org: ${req.authOrganizationId}`);
    if (req.snapshot.organizationId && req.snapshot.organizationId !== req.authOrganizationId) {
      trace.push(`[Cognitive:WARN] Organization mismatch! Snapshot org: ${req.snapshot.organizationId}`);
    }
  }
  if (req.guestId) {
    trace.push(`[Cognitive] Guest: ${req.guestId}`);
  }

  trace.push(`[Cognitive] Context built at ${ts}`);

  return {
    storeId: req.storeId,
    fingerprint: snapshotFingerprint(req.snapshot),
    timestamp: ts,
    snapshot: req.snapshot,
    domain: "general",
    source: "db",
    verified: true,
    trace,
  };
}

export function injectCognitiveContextHeader(ctx: CognitiveContext): string {
  const lines: string[] = [];
  lines.push("═══ CONTEXTO COGNITIVO ═══");
  lines.push(`Negocio: ${ctx.snapshot.name}`);
  lines.push(`Industria: ${ctx.snapshot.industry || "N/A"}`);
  lines.push(`Plan: ${ctx.snapshot.plan.toUpperCase()}${ctx.snapshot.planStatus ? ` (${ctx.snapshot.planStatus})` : ""}`);
  lines.push(`Productos: ${ctx.snapshot.productsCount} | Servicios: ${ctx.snapshot.servicesCount}`);
  lines.push(`Clientes: ${ctx.snapshot.customersCount} | Pedidos: ${ctx.snapshot.ordersCount}`);
  lines.push(`Moneda: ${ctx.snapshot.currency}`);
  lines.push(`Zona horaria: ${ctx.snapshot.timezone}`);
  lines.push(`Pagos: ${ctx.snapshot.paymentsEnabled ? "Activos" : "No configurados"}`);
  if (ctx.snapshot.planExpiry) {
    lines.push(`Vencimiento plan: ${new Date(ctx.snapshot.planExpiry).toLocaleDateString()}`);
  }
  lines.push(`Huella: ${ctx.fingerprint}`);
  lines.push(`Tiempo cognitivo: ${ctx.timestamp}`);
  lines.push("═══ FIN CONTEXTO COGNITIVO ═══");
  return lines.join("\n");
}

export function validateContextConsistency(
  ctx: CognitiveContext,
  expectedStoreId: string,
): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  if (ctx.storeId !== expectedStoreId) {
    issues.push(`storeId mismatch: context=${ctx.storeId}, expected=${expectedStoreId}`);
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}
