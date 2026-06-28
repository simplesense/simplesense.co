import type { Customer, NormalizedStore, Order, Product, StoreLocation } from '@ss/core'

export interface ShopInfo {
  currency: string
  hasPhysicalLocations: boolean
  freeShippingThreshold: number | null
}

/**
 * Reads a store's history from Shopify in PAGES of already-normalized domain objects.
 * The reader owns pagination + Shopify→domain mapping; callers just consume pages, which
 * keeps the backfill job idempotent and storage-agnostic.
 */
export interface ShopifyReader {
  fetchShopInfo(shop: string, token: string): Promise<ShopInfo>
  customers(shop: string, token: string): AsyncGenerator<Customer[]>
  products(shop: string, token: string): AsyncGenerator<Product[]>
  orders(shop: string, token: string): AsyncGenerator<Order[]>
  locations(shop: string, token: string): AsyncGenerator<StoreLocation[]>
}

async function* paginate<T>(items: readonly T[], size: number): AsyncGenerator<T[]> {
  for (let i = 0; i < items.length; i += size) yield items.slice(i, i + size)
}

/**
 * Deterministic reader backed by an in-memory NormalizedStore — the tested path, and how
 * the backfill runs end-to-end without live Shopify. `pageSize` drives pagination so tests
 * can verify multi-page consumption.
 */
export class MockShopifyReader implements ShopifyReader {
  constructor(
    private readonly store: NormalizedStore,
    private readonly pageSize = 25,
  ) {}
  fetchShopInfo(): Promise<ShopInfo> {
    return Promise.resolve({
      currency: this.store.currency,
      hasPhysicalLocations: this.store.hasPhysicalLocations,
      freeShippingThreshold: this.store.freeShippingThreshold ?? null,
    })
  }
  customers(): AsyncGenerator<Customer[]> {
    return paginate(this.store.customers, this.pageSize)
  }
  products(): AsyncGenerator<Product[]> {
    return paginate(this.store.products, this.pageSize)
  }
  orders(): AsyncGenerator<Order[]> {
    return paginate(this.store.orders, this.pageSize)
  }
  locations(): AsyncGenerator<StoreLocation[]> {
    return paginate(this.store.locations, this.pageSize)
  }
}

/**
 * Live Admin-GraphQL reader — NOT YET IMPLEMENTED. The backfill, pagination, idempotent
 * ingest and status machine are all built and tested against MockShopifyReader; the only
 * remaining piece for a real connect is mapping the cursor-paginated GraphQL responses to
 * the domain types below. We throw rather than silently return empty pages (Prime Directive
 * #1 — never fabricate, here "never pretend to have data"). Implement when Shopify creds
 * + a dev store are available:
 *
 *   POST https://{shop}/admin/api/2024-10/graphql.json  (X-Shopify-Access-Token)
 *   - orders(first:100, after:$cursor){ pageInfo{hasNextPage endCursor}
 *       nodes{ id createdAt currentTotalPriceSet{shopMoney{amount}} totalDiscountsSet{shopMoney{amount}}
 *              customer{id} shippingAddress{city province countryCode zip latitude longitude}
 *              lineItems(first:50){ nodes{ product{id} quantity discountedUnitPriceSet{shopMoney{amount}} } } } }
 *   - customers / products / locations: analogous cursor loops → map to the domain shapes.
 */
export class RealShopifyReader implements ShopifyReader {
  private notImplemented(): never {
    throw new Error(
      'RealShopifyReader is not implemented yet — supply Shopify creds + a dev store and ' +
        'implement the GraphQL→domain mapping (see reader.ts). The Mock reader is the tested path.',
    )
  }
  fetchShopInfo(): Promise<ShopInfo> {
    return this.notImplemented()
  }
  // eslint-disable-next-line require-yield
  async *customers(): AsyncGenerator<Customer[]> {
    this.notImplemented()
  }
  // eslint-disable-next-line require-yield
  async *products(): AsyncGenerator<Product[]> {
    this.notImplemented()
  }
  // eslint-disable-next-line require-yield
  async *orders(): AsyncGenerator<Order[]> {
    this.notImplemented()
  }
  // eslint-disable-next-line require-yield
  async *locations(): AsyncGenerator<StoreLocation[]> {
    this.notImplemented()
  }
}
