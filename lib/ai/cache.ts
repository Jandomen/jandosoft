/* eslint-disable @typescript-eslint/no-explicit-any */
interface CacheEntry {
  data: any;
  expiresAt: number;
  storeId: string;
}

export class AICache {
  private store = new Map<string, CacheEntry>();
  private readonly defaultTTL: number;

  constructor(defaultTTLMs = 60_000) {
    this.defaultTTL = defaultTTLMs;
  }

  private keyWithStore(namespace: string, key: string, storeId: string): string {
    return `${storeId}:${namespace}:${key}`;
  }

  get<T>(namespace: string, key: string, storeId: string): T | null {
    const fullKey = this.keyWithStore(namespace, key, storeId);
    const entry = this.store.get(fullKey);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(fullKey);
      return null;
    }
    if (entry.storeId !== storeId) {
      this.store.delete(fullKey);
      return null;
    }
    return entry.data as T;
  }

  set(namespace: string, key: string, storeId: string, data: any, ttlMs?: number): void {
    const fullKey = this.keyWithStore(namespace, key, storeId);
    const ttl = ttlMs ?? this.defaultTTL;
    this.store.set(fullKey, {
      data,
      expiresAt: Date.now() + ttl,
      storeId,
    });
  }

  invalidate(storeId?: string, namespace?: string): void {
    if (!storeId && !namespace) {
      this.store.clear();
      return;
    }
    for (const [fullKey, entry] of this.store.entries()) {
      if (storeId && entry.storeId !== storeId) continue;
      if (namespace && !fullKey.startsWith(`${entry.storeId}:${namespace}:`)) continue;
      this.store.delete(fullKey);
    }
  }

  get size(): number {
    return this.store.size;
  }
}

export const aiCache = new AICache();

const CACHE_TTL = 30_000;
const CACHE_SLICE_LIMIT = 500;

export function cachedStoreData(store: any, storeId?: string): any {
  const sid = storeId || String(store._id || store.id);
  const cached = aiCache.get("store", sid, sid);
  if (cached) return cached;

  const data = {
    _id: store._id || store.id,
    name: store.name,
    slug: store.slug,
    type: store.type,
    industry: store.industry,
    desc: store.desc,
    isPublic: store.isPublic,
    publicAI: store.publicAI,
    currency: store.currency,
    paymentIntegrations: store.paymentIntegrations || [],
    paymentsEnabled: !!(store.paymentIntegrations?.length > 0),
    platformFeePercent: store.platformFeePercent || 5,
    ownerEmail: store.ownerEmail,
    _generic: store._generic,
    organizationId: store.organizationId,
    agentConfig: store.agentConfig || {},
    _stores: store._stores,
    _subscription: store._subscription,
    products: (store.products || []).slice(0, CACHE_SLICE_LIMIT),
    customers: (store.customers || []).slice(0, CACHE_SLICE_LIMIT),
    orders: (store.orders || []).slice(0, CACHE_SLICE_LIMIT),
    services: (store.services || []).slice(0, CACHE_SLICE_LIMIT),
    knowledgebase: (store.knowledgebase || []).slice(0, CACHE_SLICE_LIMIT),
    automations: (store.automations || []).slice(0, CACHE_SLICE_LIMIT),
    campaigns: (store.campaigns || []).slice(0, CACHE_SLICE_LIMIT),
    smartForms: (store.smartForms || []).slice(0, CACHE_SLICE_LIMIT),
  };

  aiCache.set("store", sid, sid, data, CACHE_TTL);
  return data;
}

export function invalidateStoreCache(storeId: string): void {
  aiCache.invalidate(storeId);
}
