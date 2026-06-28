import { describe, it, expect } from 'vitest'
import type { PrismaClient } from '@ss/db'
import { scheduleOutcome, measureOutcome } from '../src/outcome'

describe('scheduleOutcome', () => {
  it('captures the tracked-metric baseline and schedules measurement', async () => {
    let created:
      { baselineValue: number | null; status: string; measurementWindowDays: number } | undefined
    const db = {
      recommendation: {
        findUnique: () =>
          Promise.resolve({ storeId: 's1', evidenceMetricIds: ['pareto.top20_revenue_share'] }),
      },
      analysisRun: { findFirst: () => Promise.resolve({ id: 'run1' }) },
      metric: { findFirst: () => Promise.resolve({ valueNumeric: 0.7 }) },
      recommendationOutcome: {
        create: ({ data }: { data: typeof created }) => {
          created = data
          return Promise.resolve({ id: 'oc1', ...data })
        },
      },
    } as unknown as PrismaClient

    await scheduleOutcome(db, 'rec1', { now: new Date('2026-06-01T00:00:00Z') })
    expect(created?.baselineValue).toBe(0.7)
    expect(created?.status).toBe('SCHEDULED')
    expect(created?.measurementWindowDays).toBe(30)
  })
})

describe('measureOutcome', () => {
  it('computes the grounded lift against the captured baseline', async () => {
    let updated:
      { liftValue: number | null; status: string; measuredValue: number | null } | undefined
    const db = {
      recommendationOutcome: {
        findUnique: () => Promise.resolve({ baselineValue: 0.7 }),
        update: ({ data }: { data: typeof updated }) => {
          updated = data
          return Promise.resolve({ id: 'oc1', ...data })
        },
      },
    } as unknown as PrismaClient

    await measureOutcome(db, 'oc1', 0.84) // +20% → MEASURED
    expect(updated?.status).toBe('MEASURED')
    expect(updated?.measuredValue).toBe(0.84)
    expect(updated?.liftValue).toBeCloseTo(0.14, 4)
  })
})
