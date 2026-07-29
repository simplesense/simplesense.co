import { describe, it, expect } from 'vitest'
import { CaptureArchive } from '../src/capture-archive'
import { InMemoryCaptureArchiveBackend } from '../src/memory-backend'
import { hashCapture } from '../src/hash'
import { fakeCapture } from './fixtures'

describe('CaptureArchive.append', () => {
  it('independently recomputes the hash — never trusts the Capture-supplied one', async () => {
    const archive = new CaptureArchive(new InMemoryCaptureArchiveBackend(), { maxAgeDays: null })
    const capture = fakeCapture({ sha256: 'a-lie' })
    const record = await archive.append('https://example.com/reviews', capture)
    expect(record.sha256).toBe(hashCapture(capture))
    expect(record.sha256).not.toBe('a-lie')
  })

  it('sets expiresAt from the retention policy', async () => {
    const now = new Date('2026-07-01T00:00:00.000Z')
    const archive = new CaptureArchive(
      new InMemoryCaptureArchiveBackend(),
      { maxAgeDays: 30 },
      () => now,
    )
    const record = await archive.append('key', fakeCapture())
    expect(record.expiresAt).toBe('2026-07-31T00:00:00.000Z')
  })

  it('never expires when maxAgeDays is null', async () => {
    const archive = new CaptureArchive(new InMemoryCaptureArchiveBackend(), { maxAgeDays: null })
    const record = await archive.append('key', fakeCapture())
    expect(record.expiresAt).toBeNull()
  })

  it('assigns each record a unique id', async () => {
    const archive = new CaptureArchive(new InMemoryCaptureArchiveBackend(), { maxAgeDays: null })
    const a = await archive.append('key', fakeCapture())
    const b = await archive.append('key', fakeCapture())
    expect(a.id).not.toBe(b.id)
  })
})

describe('CaptureArchive.getHistory', () => {
  it('returns only records for the requested key, oldest first', async () => {
    let clock = new Date('2026-07-01T00:00:00.000Z').getTime()
    const archive = new CaptureArchive(
      new InMemoryCaptureArchiveBackend(),
      { maxAgeDays: null },
      () => new Date(clock),
    )
    await archive.append('other-key', fakeCapture())
    clock += 1000
    const first = await archive.append('key', fakeCapture({ html: 'first' }))
    clock += 1000
    const second = await archive.append('key', fakeCapture({ html: 'second' }))

    const history = await archive.getHistory('key')
    expect(history.map((r) => r.id)).toEqual([first.id, second.id])
    expect(history[0]!.capture.html).toBe('first')
    expect(history[1]!.capture.html).toBe('second')
  })

  it('returns an empty array for a key with no history', async () => {
    const archive = new CaptureArchive(new InMemoryCaptureArchiveBackend(), { maxAgeDays: null })
    expect(await archive.getHistory('never-seen')).toEqual([])
  })
})

describe('CaptureArchive.purgeExpired', () => {
  it('removes only records past their own expiry, not everything', async () => {
    let clock = new Date('2026-01-01T00:00:00.000Z').getTime()
    const archive = new CaptureArchive(
      new InMemoryCaptureArchiveBackend(),
      { maxAgeDays: 10 },
      () => new Date(clock),
    )
    await archive.append('key', fakeCapture())
    clock += 20 * 24 * 60 * 60 * 1000 // 20 days later — the first append has expired (10-day retention)
    const fresh = await archive.append('key', fakeCapture())

    const removed = await archive.purgeExpired()
    expect(removed).toBe(1)
    const remaining = await archive.getAll()
    expect(remaining.map((r) => r.id)).toEqual([fresh.id])
  })

  it('never removes a record with no expiry', async () => {
    const archive = new CaptureArchive(new InMemoryCaptureArchiveBackend(), { maxAgeDays: null })
    await archive.append('key', fakeCapture())
    expect(await archive.purgeExpired()).toBe(0)
  })
})
