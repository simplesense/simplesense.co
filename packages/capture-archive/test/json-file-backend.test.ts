import { describe, it, expect, afterEach } from 'vitest'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { JsonFileCaptureArchiveBackend } from '../src/json-file-backend'
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

let dirsToClean: string[] = []
afterEach(async () => {
  await Promise.all(dirsToClean.map((d) => rm(d, { recursive: true, force: true })))
  dirsToClean = []
})

async function tempFilePath(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'ss-capture-archive-test-'))
  dirsToClean.push(dir)
  return join(dir, 'nested', 'archive.jsonl') // nested — proves append() creates parent dirs
}

describe('JsonFileCaptureArchiveBackend', () => {
  it('getAll on a file that does not exist yet returns an empty array, not an error', async () => {
    const backend = new JsonFileCaptureArchiveBackend(await tempFilePath())
    expect(await backend.getAll()).toEqual([])
  })

  it('round-trips an appended record through the file', async () => {
    const backend = new JsonFileCaptureArchiveBackend(await tempFilePath())
    await backend.append(record({ id: 'a' }))
    const all = await backend.getAll()
    expect(all).toHaveLength(1)
    expect(all[0]!.id).toBe('a')
    expect(all[0]!.capture.html).toBe(record().capture.html)
  })

  it('creates parent directories on first append', async () => {
    const path = await tempFilePath()
    const backend = new JsonFileCaptureArchiveBackend(path)
    await expect(backend.append(record())).resolves.toBeUndefined()
  })

  it('getHistory filters by key across multiple appends', async () => {
    const backend = new JsonFileCaptureArchiveBackend(await tempFilePath())
    await backend.append(record({ id: 'a', key: 'k1' }))
    await backend.append(record({ id: 'b', key: 'k2' }))
    await backend.append(record({ id: 'c', key: 'k1' }))
    expect((await backend.getHistory('k1')).map((r) => r.id)).toEqual(['a', 'c'])
  })

  it('purgeExpired rewrites the file with only unexpired records', async () => {
    const backend = new JsonFileCaptureArchiveBackend(await tempFilePath())
    await backend.append(record({ id: 'expired', expiresAt: '2026-01-01T00:00:00.000Z' }))
    await backend.append(record({ id: 'kept', expiresAt: null }))
    const removed = await backend.purgeExpired(new Date('2026-06-01T00:00:00.000Z'))
    expect(removed).toBe(1)
    expect((await backend.getAll()).map((r) => r.id)).toEqual(['kept'])
  })

  it('purgeExpired down to zero records leaves a valid, re-readable empty file', async () => {
    const backend = new JsonFileCaptureArchiveBackend(await tempFilePath())
    await backend.append(record({ id: 'expired', expiresAt: '2026-01-01T00:00:00.000Z' }))
    await backend.purgeExpired(new Date('2026-06-01T00:00:00.000Z'))
    expect(await backend.getAll()).toEqual([])
  })
})
