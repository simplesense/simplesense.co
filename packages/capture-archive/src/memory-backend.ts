import type { ArchivedCapture, CaptureArchiveBackend } from './types'

/** In-process backend — the default for tests and short-lived runs. Nothing persists
 *  past the process, which is exactly right for a unit test and exactly wrong for
 *  production use (see `json-file-backend.ts` or a future DB-backed implementation). */
export class InMemoryCaptureArchiveBackend implements CaptureArchiveBackend {
  private readonly records: ArchivedCapture[] = []

  async append(record: ArchivedCapture): Promise<void> {
    this.records.push(record)
  }

  async getHistory(key: string): Promise<ArchivedCapture[]> {
    return this.records.filter((r) => r.key === key)
  }

  async getAll(): Promise<ArchivedCapture[]> {
    return [...this.records]
  }

  async purgeExpired(now: Date): Promise<number> {
    const nowMs = now.getTime()
    const before = this.records.length
    for (let i = this.records.length - 1; i >= 0; i--) {
      const expiresAt = this.records[i]!.expiresAt
      if (expiresAt !== null && new Date(expiresAt).getTime() <= nowMs) {
        this.records.splice(i, 1)
      }
    }
    return before - this.records.length
  }
}
