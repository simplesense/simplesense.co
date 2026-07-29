import { describe, it, expect } from 'vitest'
import { InMemoryCaptureArchiveBackend } from '../src/memory-backend'
import type { ArchivedCapture } from '../src/types'
import { fakeCapture } from './fixtures'

function record(overrides: Partial<ArchivedCapture> = {}): ArchivedCapture {
  return {
    id: 'id-1',
    key: 'key',
    capture: fakeCapture(),
    archivedAt: '2026-07-01T00:00:00.000Z',
    sha256: 'hash',
    expiresAt: null,
    ...overrides,
  }
}

describe('InMemoryCaptureArchiveBackend', () => {
  it('getHistory filters by key', async () => {
    const backend = new InMemoryCaptureArchiveBackend()
    await backend.append(record({ id: 'a', key: 'k1' }))
    await backend.append(record({ id: 'b', key: 'k2' }))
    await backend.append(record({ id: 'c', key: 'k1' }))
    expect((await backend.getHistory('k1')).map((r) => r.id)).toEqual(['a', 'c'])
  })

  it('getAll returns everything appended', async () => {
    const backend = new InMemoryCaptureArchiveBackend()
    await backend.append(record({ id: 'a' }))
    await backend.append(record({ id: 'b' }))
    expect((await backend.getAll()).map((r) => r.id)).toEqual(['a', 'b'])
  })

  it('purgeExpired removes only records at/past their expiresAt and reports the count', async () => {
    const backend = new InMemoryCaptureArchiveBackend()
    await backend.append(record({ id: 'expired', expiresAt: '2026-01-01T00:00:00.000Z' }))
    await backend.append(record({ id: 'exactly-now', expiresAt: '2026-06-01T00:00:00.000Z' }))
    await backend.append(record({ id: 'future', expiresAt: '2027-01-01T00:00:00.000Z' }))
    await backend.append(record({ id: 'forever', expiresAt: null }))

    const removed = await backend.purgeExpired(new Date('2026-06-01T00:00:00.000Z'))
    expect(removed).toBe(2)
    expect((await backend.getAll()).map((r) => r.id).sort()).toEqual(['forever', 'future'])
  })
})
