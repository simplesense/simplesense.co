import type {
  Address,
  AnalyzerContext,
  Customer,
  Metric,
  NormalizedStore,
  Order,
  Product,
  StoreLocation,
} from '../src/types'

/** Fixed clock for deterministic windowing. */
export const NOW = new Date('2026-06-01T00:00:00.000Z')
export const WINDOW_MONTHS = 24

/** A date comfortably inside the trailing-24m window. */
export function day(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`)
}

export function ctxOf(
  store: Partial<NormalizedStore>,
  over: Partial<AnalyzerContext> = {},
): AnalyzerContext {
  return {
    store: storeOf(store),
    now: NOW,
    windowMonths: WINDOW_MONTHS,
    ...over,
  }
}

export function storeOf(over: Partial<NormalizedStore> = {}): NormalizedStore {
  return {
    storeId: 's1',
    currency: 'USD',
    hasPhysicalLocations: false,
    locations: [],
    customers: [],
    products: [],
    orders: [],
    freeShippingThreshold: null,
    ...over,
  }
}

let orderSeq = 0
export function order(over: Partial<Order> = {}): Order {
  return {
    id: over.id ?? `o${++orderSeq}`,
    customerId: 'c1',
    createdAt: day('2025-09-01'),
    totalPrice: 100,
    discountTotal: 0,
    currency: 'USD',
    refundedAmount: 0,
    sourceName: null,
    shippingAddress: null,
    lineItems: [],
    ...over,
  }
}

export function product(over: Partial<Product> = {}): Product {
  return { id: over.id ?? 'p1', title: over.title ?? 'Product', ...over }
}

export function customer(over: Partial<Customer> = {}): Customer {
  return { id: over.id ?? 'c1', ...over }
}

export function location(over: Partial<StoreLocation> = {}): StoreLocation {
  return { id: over.id ?? 'l1', name: over.name ?? 'Store', ...over }
}

export function addr(over: Partial<Address> = {}): Address {
  return { ...over }
}

/** Find a metric by key or throw (keeps tests honest about which metric they assert). */
export function findMetric(metrics: Metric[], key: string): Metric {
  const m = metrics.find((x) => x.key === key)
  if (!m)
    throw new Error(`metric not found: ${key}. present: ${metrics.map((x) => x.key).join(', ')}`)
  return m
}

/** Numeric value of a metric by key (throws if missing). */
export function num(metrics: Metric[], key: string): number | null {
  return findMetric(metrics, key).valueNumeric
}
