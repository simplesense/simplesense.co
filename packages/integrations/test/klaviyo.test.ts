import { describe, it, expect, vi, afterEach } from 'vitest'
import { RealKlaviyoClient, MockKlaviyoClient, createKlaviyoClient } from '../src/klaviyo/client'

describe('MockKlaviyoClient', () => {
  it('returns a fully-populated, deterministic snapshot', async () => {
    const c = new MockKlaviyoClient()
    const snap = await c.getAccountSnapshot('Acme Co.')
    expect(snap.accountName).toBe('Acme Co.')
    expect(snap.flows).toHaveLength(6)
    expect(snap.campaigns.length).toBeGreaterThan(0)
    expect(snap.listHealth.hasSunsetFlow).toBe(false) // the mock's sunset flow is archived, not live
    expect(snap.cadence.spamComplaintRatePct).not.toBeNull()
    expect(snap.segments.hasAtRiskSegment).toBe(false)
  })
})

describe('createKlaviyoClient', () => {
  it('returns MockKlaviyoClient when no API key is supplied', () => {
    expect(createKlaviyoClient(null)).toBeInstanceOf(MockKlaviyoClient)
  })
  it('returns RealKlaviyoClient when an API key is supplied', () => {
    expect(createKlaviyoClient('pk_test_123')).toBeInstanceOf(RealKlaviyoClient)
  })
})

describe('RealKlaviyoClient', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('requests /flows with the documented auth + revision headers', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: [
            { id: 'f1', attributes: { name: 'Welcome Series', status: 'live', archived: false } },
            { id: 'f2', attributes: { name: 'Old Flow', status: 'draft', archived: true } },
          ],
        }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const client = new RealKlaviyoClient({ apiKey: 'test_key' })
    const snap = await client.getAccountSnapshot('Acme Co.')

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('https://a.klaviyo.com/api/flows')
    const headers = init.headers as Record<string, string>
    expect(headers.Authorization).toBe('Klaviyo-API-Key test_key')
    expect(headers.revision).toMatch(/^\d{4}-\d{2}-\d{2}/)

    expect(snap.flows).toHaveLength(2)
    expect(snap.flows[0]).toMatchObject({
      id: 'f1',
      name: 'Welcome Series',
      canonicalType: 'welcome',
      status: 'live',
    })
    expect(snap.flows[1]).toMatchObject({ id: 'f2', status: 'archived' })
  })

  it('leaves unverified snapshot fields null rather than guessing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ data: [] }) }),
    )
    const client = new RealKlaviyoClient({ apiKey: 'test_key' })
    const snap = await client.getAccountSnapshot('Acme Co.')
    expect(snap.campaigns).toEqual([])
    expect(snap.cadence.spamComplaintRatePct).toBeNull()
    expect(snap.segments.hasVipSegment).toBeNull()
  })

  it('throws on a non-ok response rather than silently returning empty data', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 }))
    const client = new RealKlaviyoClient({ apiKey: 'bad_key' })
    await expect(client.getAccountSnapshot('Acme Co.')).rejects.toThrow(/401/)
  })
})
