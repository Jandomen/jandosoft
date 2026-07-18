export interface IsolateResult<T> {
  data: T | null;
  storeId: string;
  verified: boolean;
  contamination: boolean;
  reason: string | null;
  source: "db" | "client" | "cache" | "none";
}

export interface StoreContextSnapshot {
  storeId: string;
  name: string;
  industry: string | null;
  type: string | null;
  slug: string | null;
  currency: string;
  timezone: string;
  ownerEmail: string;
  organizationId: string | null;
  paymentsEnabled: boolean;
  aiProvider: { enabled: boolean; provider?: string; model?: string } | null;
  plan: string;
  planStatus: string | null;
  planExpiry: string | null;
  productsCount: number;
  servicesCount: number;
  customersCount: number;
  ordersCount: number;
  knowledgebaseCount: number;
  appointmentsCount: number;
  hsVersion: string;
}

export function buildSnapshot(store: any): StoreContextSnapshot {
  return {
    storeId: String(store._id || store.id),
    name: store.name || "",
    industry: store.industry || null,
    type: store.type || null,
    slug: store.slug || null,
    currency: store.currency || "USD",
    timezone: store.timezone || "America/Mexico_City",
    ownerEmail: store.ownerEmail || "",
    organizationId: store.organizationId ? String(store.organizationId) : null,
    paymentsEnabled: !!(store.paymentIntegrations?.length > 0),
    aiProvider: store.aiProvider?.enabled
      ? { enabled: true, provider: store.aiProvider.provider, model: store.aiProvider.model }
      : null,
    plan: store._subscription?.plan || "free",
    planStatus: store._subscription?.status || null,
    planExpiry: store._subscription?.expiry || null,
    productsCount: store.products?.length || 0,
    servicesCount: store.services?.length || 0,
    customersCount: store.customers?.length || 0,
    ordersCount: store.orders?.length || 0,
    knowledgebaseCount: store.knowledgebase?.length || 0,
    appointmentsCount: store.appointments?.length || 0,
    hsVersion: "1.0",
  };
}

export function snapshotFingerprint(snap: StoreContextSnapshot): string {
  return `${snap.storeId}:${snap.name}:${snap.organizationId || "null"}:${snap.plan}:${snap.hsVersion}`;
}

export class ContextIsolator {
  private lastSnapshot: Map<string, StoreContextSnapshot> = new Map();

  isolateFromDb(
    store: any,
    expectedStoreId?: string,
  ): IsolateResult<StoreContextSnapshot> {
    const sid = String(store._id || store.id);
    const source: "db" = "db";

    if (!sid || sid === "undefined" || sid === "null") {
      return {
        data: null,
        storeId: sid,
        verified: false,
        contamination: false,
        reason: "Store has no valid _id",
        source,
      };
    }

    if (expectedStoreId && sid !== expectedStoreId) {
      console.error(
        `[Cognitive:CONTAMINATION] store._id (${sid}) !== expectedStoreId (${expectedStoreId}). ` +
        `Name: ${store.name || "unnamed"}. Rejecting.`,
      );
      return {
        data: null,
        storeId: sid,
        verified: false,
        contamination: true,
        reason: `store._id mismatch: got ${sid}, expected ${expectedStoreId}`,
        source,
      };
    }

    const snapshot = buildSnapshot(store);
    this.lastSnapshot.set(sid, snapshot);

    return {
      data: snapshot,
      storeId: sid,
      verified: true,
      contamination: false,
      reason: null,
      source,
    };
  }

  isolateFromClient(
    store: any,
    authOrganizationId?: string | null,
  ): IsolateResult<StoreContextSnapshot> {
    const sid = String(store._id || store.id);
    const source: "client" = "client";

    if (!sid || sid === "undefined" || sid === "null") {
      return {
        data: null,
        storeId: sid,
        verified: false,
        contamination: false,
        reason: "Client-supplied store has no _id",
        source,
      };
    }

    const snapshot = buildSnapshot(store);
    const orgId = snapshot.organizationId;

    if (authOrganizationId && orgId && orgId !== authOrganizationId) {
      console.error(
        `[Cognitive:CONTAMINATION] Client store orgId (${orgId}) !== ` +
        `auth orgId (${authOrganizationId}). Store: ${snapshot.name}. Rejecting.`,
      );
      return {
        data: null,
        storeId: sid,
        verified: false,
        contamination: true,
        reason: `organizationId mismatch: store=${orgId}, auth=${authOrganizationId}`,
        source,
      };
    }

    const prev = this.lastSnapshot.get(sid);
    if (prev) {
      const prevFp = snapshotFingerprint(prev);
      const currFp = snapshotFingerprint(snapshot);
      if (prevFp !== currFp) {
        console.log(
          `[Cognitive] Store ${sid} (${snapshot.name}) context changed. ` +
          `Plan: ${prev.plan}->${snapshot.plan}, Org: ${prev.organizationId}->${snapshot.organizationId}. Updating snapshot.`,
        );
      }
    }

    this.lastSnapshot.set(sid, snapshot);

    return {
      data: snapshot,
      storeId: sid,
      verified: true,
      contamination: false,
      reason: null,
      source,
    };
  }

  getLastSnapshot(storeId: string): StoreContextSnapshot | undefined {
    return this.lastSnapshot.get(storeId);
  }

  clear(storeId?: string): void {
    if (storeId) {
      this.lastSnapshot.delete(storeId);
    } else {
      this.lastSnapshot.clear();
    }
  }
}

export const contextIsolator = new ContextIsolator();

export function requireIsolation<T>(
  result: IsolateResult<T>,
  context: string,
): T {
  if (!result.verified || result.contamination) {
    const err = new Error(
      `[Cognitive] Context isolation FAILED in ${context}: ${result.reason || "unknown"}`,
    );
    err.name = "ContextContaminationError";
    throw err;
  }
  if (result.data === null) {
    const err = new Error(
      `[Cognitive] No data available in ${context}`,
    );
    err.name = "ContextContaminationError";
    throw err;
  }
  return result.data;
}
