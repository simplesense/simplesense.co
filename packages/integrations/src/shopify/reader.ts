import type { Address, Customer, NormalizedStore, Order, Product, StoreLocation } from '@ss/core'
import { normalizeShop } from './oauth'

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

// ---------------------------------------------------------------------------
// RealShopifyReader — live Admin GraphQL (2024-10), cursor-paginated.
// Conservative geo: hasPhysicalLocations defaults to FALSE (online-only treatment) so we
// never wrongly tell a store to drive foot traffic (§1.4); a store can flag physical
// locations explicitly later. Product cost + free-ship threshold aren't read here, so the
// margin/free-ship analyzers emit "insufficient" rather than guessing.
// ---------------------------------------------------------------------------

const API_VERSION = '2024-10'
const num = (s?: string | null): number => (s ? Number.parseFloat(s) : 0)
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

interface GqlError {
  message?: string
  extensions?: { code?: string }
}
interface MoneyBag {
  shopMoney?: { amount?: string; currencyCode?: string }
}
interface PageInfo {
  hasNextPage: boolean
  endCursor: string | null
}
interface GqlAddress {
  city?: string | null
  provinceCode?: string | null
  countryCodeV2?: string | null
  zip?: string | null
  latitude?: number | null
  longitude?: number | null
}

interface LineItemNode {
  quantity: number
  product?: { id: string } | null
  originalUnitPriceSet?: MoneyBag
  discountedUnitPriceSet?: MoneyBag
}

interface OrderNode {
  id: string
  createdAt: string
  totalPriceSet?: MoneyBag
  totalDiscountsSet?: MoneyBag
  totalRefundedSet?: MoneyBag
  customer?: { id: string } | null
  shippingAddress?: GqlAddress | null
  lineItems?: { pageInfo?: PageInfo; nodes: LineItemNode[] }
}

function mapOrderNode(n: OrderNode, items: LineItemNode[]): Order {
  return {
    id: n.id,
    customerId: n.customer?.id ?? null,
    createdAt: new Date(n.createdAt),
    totalPrice: num(n.totalPriceSet?.shopMoney?.amount),
    discountTotal: num(n.totalDiscountsSet?.shopMoney?.amount),
    refundedAmount: num(n.totalRefundedSet?.shopMoney?.amount),
    currency: n.totalPriceSet?.shopMoney?.currencyCode ?? 'USD',
    sourceName: null,
    shippingAddress: mapAddress(n.shippingAddress),
    lineItems: items.map((li) => {
      const unit = num(li.originalUnitPriceSet?.shopMoney?.amount)
      const disc = unit - num(li.discountedUnitPriceSet?.shopMoney?.amount)
      return {
        productId: li.product?.id ?? null,
        quantity: li.quantity,
        price: unit,
        discount: Math.max(0, disc) * li.quantity,
      }
    }),
  }
}

const LINE_ITEMS_QUERY = `query($id:ID!,$cursor:String){ order(id:$id){
  lineItems(first:250, after:$cursor){ pageInfo{ hasNextPage endCursor }
    nodes{ quantity product{ id }
      originalUnitPriceSet{ shopMoney{ amount } }
      discountedUnitPriceSet{ shopMoney{ amount } } } } } }`

function mapAddress(a?: GqlAddress | null): Address {
  return {
    city: a?.city ?? null,
    region: a?.provinceCode ?? null,
    country: a?.countryCodeV2 ?? null,
    zip: a?.zip ?? null,
    lat: a?.latitude ?? null,
    lng: a?.longitude ?? null,
  }
}

export class RealShopifyReader implements ShopifyReader {
  private async gql<T>(
    shop: string,
    token: string,
    query: string,
    variables: Record<string, unknown> = {},
  ): Promise<T> {
    const url = `https://${normalizeShop(shop)}/admin/api/${API_VERSION}/graphql.json`
    const body = JSON.stringify({ query, variables })
    const maxAttempts = 5
    for (let attempt = 1; ; attempt++) {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'X-Shopify-Access-Token': token },
        body,
      })
      // HTTP 429 = REST-style rate limit; honor Retry-After, else exponential backoff.
      if (res.status === 429 && attempt < maxAttempts) {
        const retryAfter = Number.parseFloat(res.headers.get('retry-after') ?? '')
        await sleep(Number.isFinite(retryAfter) ? retryAfter * 1000 : 2 ** attempt * 500)
        continue
      }
      if (!res.ok) throw new Error(`Shopify GraphQL ${res.status}: ${await res.text()}`)
      const json = (await res.json()) as { data?: T; errors?: GqlError[] }
      // GraphQL-level throttle returns 200 with a THROTTLED error — retry, don't fail the store.
      const throttled =
        Array.isArray(json.errors) && json.errors.some((e) => e?.extensions?.code === 'THROTTLED')
      if (throttled && attempt < maxAttempts) {
        await sleep(2 ** attempt * 500)
        continue
      }
      if (!json.data) throw new Error(`Shopify GraphQL error: ${JSON.stringify(json.errors)}`)
      return json.data
    }
  }

  private async *paginate<N, T>(
    shop: string,
    token: string,
    query: string,
    pick: (d: unknown) => { nodes: N[]; pageInfo: PageInfo },
    map: (n: N) => T,
  ): AsyncGenerator<T[]> {
    let cursor: string | null = null
    do {
      const data = await this.gql<unknown>(shop, token, query, { cursor })
      const conn = pick(data)
      yield conn.nodes.map(map)
      cursor = conn.pageInfo.hasNextPage ? conn.pageInfo.endCursor : null
    } while (cursor)
  }

  async fetchShopInfo(shop: string, token: string): Promise<ShopInfo> {
    const data = await this.gql<{ shop: { currencyCode: string } }>(
      shop,
      token,
      `query { shop { currencyCode } }`,
    )
    // Conservative: treat as online-only unless physical locations are explicitly flagged.
    return {
      currency: data.shop.currencyCode,
      hasPhysicalLocations: false,
      freeShippingThreshold: null,
    }
  }

  async *orders(shop: string, token: string): AsyncGenerator<Order[]> {
    // Page sizes kept small so the calculated query cost stays under Shopify's 1000-point
    // single-query cap: orders(40) x lineItems(20) ≈ 922. (100 x 100 ≈ 10,000 → rejected.)
    // Cost is verifiable live via the `Shopify-GraphQL-Cost-Debug: 1` header.
    // totalPriceSet is the GROSS order total (before returns); refunds are subtracted ONCE
    // downstream via netRevenue. Using currentTotalPriceSet (net of returns) would
    // double-count refunds and inflate the return rate past 100%.
    const query = `query($cursor:String){ orders(first:40, after:$cursor, sortKey:CREATED_AT){
      pageInfo{ hasNextPage endCursor }
      nodes{ id createdAt
        totalPriceSet{ shopMoney{ amount currencyCode } }
        totalDiscountsSet{ shopMoney{ amount } }
        totalRefundedSet{ shopMoney{ amount } }
        customer{ id }
        shippingAddress{ city provinceCode countryCodeV2 zip latitude longitude }
        lineItems(first:20){ pageInfo{ hasNextPage endCursor } nodes{ quantity product{ id }
          originalUnitPriceSet{ shopMoney{ amount } }
          discountedUnitPriceSet{ shopMoney{ amount } } } }
      } } }`
    let cursor: string | null = null
    do {
      const data: { orders: { nodes: OrderNode[]; pageInfo: PageInfo } } = await this.gql(
        shop,
        token,
        query,
        { cursor },
      )
      const page: Order[] = []
      for (const n of data.orders.nodes) {
        const items: LineItemNode[] = [...(n.lineItems?.nodes ?? [])]
        let li = n.lineItems?.pageInfo
        while (li?.hasNextPage && li.endCursor) {
          // Rare path: >20 line items on one order — follow up with per-order pagination.
          const more = await this.gql<{
            order: { lineItems: { nodes: LineItemNode[]; pageInfo: PageInfo } } | null
          }>(shop, token, LINE_ITEMS_QUERY, { id: n.id, cursor: li.endCursor })
          if (!more.order) break // order deleted mid-sync — keep what we have
          items.push(...more.order.lineItems.nodes)
          li = more.order.lineItems.pageInfo
        }
        page.push(mapOrderNode(n, items))
      }
      yield page
      cursor = data.orders.pageInfo.hasNextPage ? data.orders.pageInfo.endCursor : null
    } while (cursor)
  }

  customers(shop: string, token: string): AsyncGenerator<Customer[]> {
    const query = `query($cursor:String){ customers(first:100, after:$cursor){
      pageInfo{ hasNextPage endCursor }
      nodes{ id email defaultAddress{ city provinceCode countryCodeV2 zip latitude longitude } } } }`
    interface CustNode {
      id: string
      email?: string | null
      defaultAddress?: GqlAddress | null
    }
    return this.paginate<CustNode, Customer>(
      shop,
      token,
      query,
      (d) => (d as { customers: { nodes: CustNode[]; pageInfo: PageInfo } }).customers,
      (n) => ({
        id: n.id,
        email: n.email ?? null,
        defaultAddress: mapAddress(n.defaultAddress),
        firstOrderAt: null,
      }),
    )
  }

  products(shop: string, token: string): AsyncGenerator<Product[]> {
    // First variant's inventoryItem.unitCost = COGS (needs read_inventory scope). Null when
    // cost isn't set → the margin analyzer emits "insufficient" rather than guessing.
    const query = `query($cursor:String){ products(first:100, after:$cursor){
      pageInfo{ hasNextPage endCursor }
      nodes{ id title productType
        variants(first:1){ nodes{ inventoryItem{ unitCost{ amount } } } } } } }`
    interface ProdNode {
      id: string
      title: string
      productType?: string | null
      variants?: { nodes: { inventoryItem?: { unitCost?: { amount?: string } | null } | null }[] }
    }
    return this.paginate<ProdNode, Product>(
      shop,
      token,
      query,
      (d) => (d as { products: { nodes: ProdNode[]; pageInfo: PageInfo } }).products,
      (n) => {
        const cost = n.variants?.nodes?.[0]?.inventoryItem?.unitCost?.amount
        return {
          id: n.id,
          title: n.title,
          type: n.productType ?? null,
          unitCost: cost ? num(cost) : null,
        }
      },
    )
  }

  // Physical retail locations (with coords where available). Whether the geo branch USES
  // these is governed by the store's hasPhysicalLocations toggle, not this fetch.
  locations(shop: string, token: string): AsyncGenerator<StoreLocation[]> {
    const query = `query($cursor:String){ locations(first:100, after:$cursor){
      pageInfo{ hasNextPage endCursor }
      nodes{ id name address{ city provinceCode latitude longitude } } } }`
    interface LocNode {
      id: string
      name: string
      address?: {
        city?: string | null
        provinceCode?: string | null
        latitude?: number | null
        longitude?: number | null
      } | null
    }
    return this.paginate<LocNode, StoreLocation>(
      shop,
      token,
      query,
      (d) => (d as { locations: { nodes: LocNode[]; pageInfo: PageInfo } }).locations,
      (n) => ({
        id: n.id,
        name: n.name,
        lat: n.address?.latitude ?? null,
        lng: n.address?.longitude ?? null,
        address: { city: n.address?.city ?? null, region: n.address?.provinceCode ?? null },
      }),
    )
  }
}
