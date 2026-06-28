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
    cursor: string | null,
  ): Promise<T> {
    const res = await fetch(
      `https://${normalizeShop(shop)}/admin/api/${API_VERSION}/graphql.json`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'X-Shopify-Access-Token': token },
        body: JSON.stringify({ query, variables: { cursor } }),
      },
    )
    if (!res.ok) throw new Error(`Shopify GraphQL ${res.status}: ${await res.text()}`)
    const json = (await res.json()) as { data?: T; errors?: unknown }
    if (!json.data) throw new Error(`Shopify GraphQL error: ${JSON.stringify(json.errors)}`)
    return json.data
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
      const data = await this.gql<unknown>(shop, token, query, cursor)
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
      null,
    )
    // Conservative: treat as online-only unless physical locations are explicitly flagged.
    return {
      currency: data.shop.currencyCode,
      hasPhysicalLocations: false,
      freeShippingThreshold: null,
    }
  }

  orders(shop: string, token: string): AsyncGenerator<Order[]> {
    const query = `query($cursor:String){ orders(first:100, after:$cursor, sortKey:CREATED_AT){
      pageInfo{ hasNextPage endCursor }
      nodes{ id createdAt
        currentTotalPriceSet{ shopMoney{ amount currencyCode } }
        totalDiscountsSet{ shopMoney{ amount } }
        totalRefundedSet{ shopMoney{ amount } }
        customer{ id }
        shippingAddress{ city provinceCode countryCodeV2 zip latitude longitude }
        lineItems(first:100){ nodes{ quantity product{ id }
          originalUnitPriceSet{ shopMoney{ amount } }
          discountedUnitPriceSet{ shopMoney{ amount } } } }
      } } }`
    interface OrderNode {
      id: string
      createdAt: string
      currentTotalPriceSet?: MoneyBag
      totalDiscountsSet?: MoneyBag
      totalRefundedSet?: MoneyBag
      customer?: { id: string } | null
      shippingAddress?: GqlAddress | null
      lineItems?: {
        nodes: {
          quantity: number
          product?: { id: string } | null
          originalUnitPriceSet?: MoneyBag
          discountedUnitPriceSet?: MoneyBag
        }[]
      }
    }
    return this.paginate<OrderNode, Order>(
      shop,
      token,
      query,
      (d) => (d as { orders: { nodes: OrderNode[]; pageInfo: PageInfo } }).orders,
      (n) => ({
        id: n.id,
        customerId: n.customer?.id ?? null,
        createdAt: new Date(n.createdAt),
        totalPrice: num(n.currentTotalPriceSet?.shopMoney?.amount),
        discountTotal: num(n.totalDiscountsSet?.shopMoney?.amount),
        refundedAmount: num(n.totalRefundedSet?.shopMoney?.amount),
        currency: n.currentTotalPriceSet?.shopMoney?.currencyCode ?? 'USD',
        sourceName: null,
        shippingAddress: mapAddress(n.shippingAddress),
        lineItems: (n.lineItems?.nodes ?? []).map((li) => {
          const unit = num(li.originalUnitPriceSet?.shopMoney?.amount)
          const disc = unit - num(li.discountedUnitPriceSet?.shopMoney?.amount)
          return {
            productId: li.product?.id ?? null,
            quantity: li.quantity,
            price: unit,
            discount: Math.max(0, disc) * li.quantity,
          }
        }),
      }),
    )
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
    const query = `query($cursor:String){ products(first:100, after:$cursor){
      pageInfo{ hasNextPage endCursor }
      nodes{ id title productType } } }`
    interface ProdNode {
      id: string
      title: string
      productType?: string | null
    }
    return this.paginate<ProdNode, Product>(
      shop,
      token,
      query,
      (d) => (d as { products: { nodes: ProdNode[]; pageInfo: PageInfo } }).products,
      (n) => ({ id: n.id, title: n.title, type: n.productType ?? null, unitCost: null }),
    )
  }

  // Conservative: no physical locations surfaced (online-only treatment). A future
  // "I have physical stores" setting enables trade-area / BOPIS.
  // eslint-disable-next-line require-yield
  async *locations(): AsyncGenerator<StoreLocation[]> {
    return
  }
}
