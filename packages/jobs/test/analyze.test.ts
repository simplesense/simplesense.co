import { describe, it, expect } from 'vitest'
import type { PrismaClient } from '@ss/db'
import { MockLlmClient } from '@ss/engine'
import { analyzeStore } from '../src/analyze'

const NOW = new Date('2026-06-01T00:00:00.000Z')
const recent = new Date('2026-05-01T00:00:00.000Z')

/** Orders concentrated enough to trigger the VIP/Pareto signal (top 2 of 6 ≈ 86%). */
const orderRows = [500, 400, 60, 40, 30, 20].map((total, i) => ({
  id: `o${i + 1}`,
  customerId: `c${i + 1}`,
  createdAt: recent,
  totalPrice: total,
  discountTotal: 0,
  refundedAmount: 0,
  currency: 'USD',
  sourceName: null,
  shipCity: null,
  shipRegion: null,
  shipCountry: null,
  shipZip: null,
  shipLat: null,
  shipLng: null,
  lineItems: [],
}))

function makeFakeDb() {
  const metricsCreated: unknown[] = []
  const recsCreated: unknown[] = []
  const runs: { id: string; status: string }[] = []
  const db = {
    store: {
      findUnique: () =>
        Promise.resolve({
          id: 'store1',
          currency: 'USD',
          hasPhysicalLocations: false,
          freeShippingThreshold: null,
          locations: [],
        }),
    },
    customer: { findMany: () => Promise.resolve([]) },
    product: { findMany: () => Promise.resolve([]) },
    order: { findMany: () => Promise.resolve(orderRows) },
    analysisRun: {
      create: ({ data }: { data: { storeId: string; status: string } }) => {
        const run = { id: `run${runs.length + 1}`, ...data }
        runs.push(run)
        return Promise.resolve(run)
      },
      update: ({ data }: { data: { status: string } }) => {
        const last = runs[runs.length - 1]
        if (last) last.status = data.status
        return Promise.resolve(last)
      },
    },
    metric: {
      createMany: ({ data }: { data: unknown[] }) => {
        metricsCreated.push(...data)
        return Promise.resolve({ count: data.length })
      },
    },
    recommendation: {
      create: ({ data }: { data: unknown }) => {
        recsCreated.push(data)
        return Promise.resolve({ id: `rec${recsCreated.length}` })
      },
    },
  }
  return { db: db as unknown as PrismaClient, metricsCreated, recsCreated, runs }
}

describe('analyzeStore — persists a grounded run', () => {
  it('loads, analyzes, and writes metrics + recommendations + a DONE run', async () => {
    const { db, metricsCreated, recsCreated, runs } = makeFakeDb()
    const res = await analyzeStore(db, 'store1', { llm: new MockLlmClient(), now: NOW })

    expect(res).not.toBeNull()
    expect(res?.recommendationCount).toBeGreaterThanOrEqual(1)
    expect(res?.rejectedCount).toBe(0)
    expect(recsCreated.length).toBe(res?.recommendationCount)
    expect(metricsCreated.length).toBeGreaterThan(0)
    expect(runs[runs.length - 1]?.status).toBe('DONE')
  })

  it('returns null for a missing store', async () => {
    const db = { store: { findUnique: () => Promise.resolve(null) } } as unknown as PrismaClient
    expect(await analyzeStore(db, 'nope', { llm: new MockLlmClient(), now: NOW })).toBeNull()
  })
})
