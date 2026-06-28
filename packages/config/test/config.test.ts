import { describe, it, expect } from 'vitest'
import {
  SIGNAL_THRESHOLDS,
  TIERS,
  tierAllows,
  llmConfig,
  appEnv,
  assertServerEnv,
} from '../src/index'

describe('SIGNAL_THRESHOLDS', () => {
  it('are all sane ratios in (0, 1)', () => {
    for (const [k, v] of Object.entries(SIGNAL_THRESHOLDS)) {
      expect(v, k).toBeGreaterThan(0)
      expect(v, k).toBeLessThan(1)
    }
  })
})

describe('tiers', () => {
  it('prices match the $0 / $99 / $299 decision', () => {
    expect(TIERS.free.priceMonthly).toBe(0)
    expect(TIERS.basic.priceMonthly).toBe(99)
    expect(TIERS.pro.priceMonthly).toBe(299)
  })

  it('geo + Pareto is the wedge: entitled at Basic, teaser at Free', () => {
    expect(tierAllows('basic', 'geoPareto')).toBe(true)
    expect(tierAllows('pro', 'geoPareto')).toBe(true)
    expect(tierAllows('free', 'geoPareto')).toBe(false)
  })

  it('one-click execution is Pro-only; export is Basic+', () => {
    expect(tierAllows('pro', 'oneClickExecution')).toBe(true)
    expect(tierAllows('basic', 'oneClickExecution')).toBe(false)
    expect(tierAllows('basic', 'segmentExport')).toBe(true)
    expect(tierAllows('free', 'segmentExport')).toBe(false)
  })

  it('Pro unlocks multi-store + API; Basic does not', () => {
    expect(tierAllows('pro', 'multiStore')).toBe(true)
    expect(tierAllows('pro', 'apiAccess')).toBe(true)
    expect(tierAllows('basic', 'multiStore')).toBe(false)
    expect(tierAllows('basic', 'apiAccess')).toBe(false)
  })

  it('the free Audit is available in every tier', () => {
    expect(tierAllows('free', 'freeAudit')).toBe(true)
    expect(tierAllows('basic', 'freeAudit')).toBe(true)
    expect(tierAllows('pro', 'freeAudit')).toBe(true)
  })
})

describe('llmConfig / appEnv', () => {
  it('defaults to a cost-balanced model with no key (mock mode)', () => {
    const c = llmConfig({})
    expect(c.model).toBe('claude-sonnet-4-6')
    expect(c.maxTokens).toBe(4096)
    expect(c.hasApiKey).toBe(false)
  })

  it('honors env overrides', () => {
    const c = llmConfig({
      LLM_MODEL: 'claude-opus-4-8',
      LLM_MAX_TOKENS: '8000',
      ANTHROPIC_API_KEY: 'sk-x',
    })
    expect(c.model).toBe('claude-opus-4-8')
    expect(c.maxTokens).toBe(8000)
    expect(c.hasApiKey).toBe(true)
  })

  it('appEnv reports PGlite (null DATABASE_URL) by default', () => {
    expect(appEnv({}).databaseUrl).toBeNull()
  })
})

describe('assertServerEnv', () => {
  it('throws in production when required secrets are missing', () => {
    expect(() => assertServerEnv({ NODE_ENV: 'production' })).toThrow(/APP_ENCRYPTION_KEY/)
  })
  it('passes in production when required secrets are present', () => {
    expect(() =>
      assertServerEnv({
        NODE_ENV: 'production',
        APP_ENCRYPTION_KEY: 'k',
        DATABASE_URL: 'postgres://x',
      }),
    ).not.toThrow()
  })
  it('never throws outside production', () => {
    expect(() => assertServerEnv({ NODE_ENV: 'development' })).not.toThrow()
  })
})
