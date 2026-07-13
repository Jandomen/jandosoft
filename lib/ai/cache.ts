interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class AICache {
  private store = new Map<string, CacheEntry<any>>();
  private hits = 0;
  private misses = 0;

  private makeKey(domain: string, key: string): string {
    return `${domain}::${key}`;
  }

  get<T>(domain: string, key: string): T | null {
    const fullKey = this.makeKey(domain, key);
    const entry = this.store.get(fullKey);
    if (!entry) {
      this.misses++;
      return null;
    }
    if (Date.now() > entry.expiresAt) {
      this.store.delete(fullKey);
      this.misses++;
      return null;
    }
    this.hits++;
    return entry.data as T;
  }

  set<T>(domain: string, key: string, data: T, ttlMs: number = 60000): void {
    const fullKey = this.makeKey(domain, key);
    this.store.set(fullKey, { data, expiresAt: Date.now() + ttlMs });
  }

  invalidate(domain: string, key?: string): void {
    if (key) {
      this.store.delete(this.makeKey(domain, key));
    } else {
      const prefix = `${domain}::`;
      for (const k of this.store.keys()) {
        if (k.startsWith(prefix)) this.store.delete(k);
      }
    }
  }

  clear(): void {
    this.store.clear();
    this.hits = 0;
    this.misses = 0;
  }

  stats() {
    return {
      size: this.store.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits + this.misses > 0
        ? (this.hits / (this.hits + this.misses)) * 100
        : 0,
    };
  }
}

export const aiCache = new AICache();

export function cachedStoreData(store: any): any {
  if (!store?._id) return store;
  const cached = aiCache.get<any>("store", String(store._id));
  if (cached) return cached;

  const storeData = {
    _id: store._id,
    name: store.name,
    slug: store.slug,
    type: store.type,
    industry: store.industry,
    desc: store.desc,
    isPublic: store.isPublic,
    publicAI: store.publicAI,
    currency: store.currency,
    paymentIntegrations: store.paymentIntegrations,
    paymentsEnabled: store.paymentsEnabled,
    platformFeePercent: store.platformFeePercent,
    ownerEmail: store.ownerEmail,
    _generic: store._generic,
    organizationId: store.organizationId,
    agentConfig: store.agentConfig,
    _stores: store._stores,
    _subscription: store._subscription,
    products: store.products,
    customers: store.customers,
    orders: store.orders,
    services: store.services,
    knowledgebase: store.knowledgebase,
    automations: store.automations,
    campaigns: store.campaigns,
    smartForms: store.smartForms,
  };

  aiCache.set("store", String(store._id), storeData, 30000);
  return storeData;
}

export function invalidateStoreCache(storeId: string): void {
  aiCache.invalidate("store", storeId);
}
