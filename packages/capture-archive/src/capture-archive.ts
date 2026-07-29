import { randomUUID } from 'node:crypto'
import type { Capture } from '@ss/crawler'
import { hashCapture } from './hash'
import type { ArchivedCapture, CaptureArchiveBackend, RetentionPolicy } from './types'

const DAY_MS = 24 * 60 * 60 * 1000

/** Public API for S6 — wraps a storage backend with the tamper-evidence hashing and
 *  retention-expiry math, so no backend implementation has to get either right itself. */
export class CaptureArchive {
  constructor(
    private readonly backend: CaptureArchiveBackend,
    private readonly retention: RetentionPolicy,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async append(key: string, capture: Capture): Promise<ArchivedCapture> {
    const archivedAtMs = this.now().getTime()
    const record: ArchivedCapture = {
      id: randomUUID(),
      key,
      capture,
      archivedAt: new Date(archivedAtMs).toISOString(),
      sha256: hashCapture(capture),
      expiresAt:
        this.retention.maxAgeDays === null
          ? null
          : new Date(archivedAtMs + this.retention.maxAgeDays * DAY_MS).toISOString(),
    }
    await this.backend.append(record)
    return record
  }

  /** Oldest first — the shape a "did this change over time" rule wants to consume. */
  async getHistory(key: string): Promise<ArchivedCapture[]> {
    const history = await this.backend.getHistory(key)
    return [...history].sort((a, b) => a.archivedAt.localeCompare(b.archivedAt))
  }

  async getAll(): Promise<ArchivedCapture[]> {
    return this.backend.getAll()
  }

  async purgeExpired(): Promise<number> {
    return this.backend.purgeExpired(this.now())
  }
}
