import type { Capture } from '@ss/crawler'

/**
 * S6 Capture archive (COMPOUND_ENGINEERING_PLAN.md §3): "append-only snapshot store
 * with SHA-256 hashes per artifact and a retention policy config, so M3's scan
 * findings are tamper-evident and age well (a finding a client disputes six weeks
 * later can be shown exactly as captured)." `key` is the caller's grouping identity
 * (typically the captured URL) — `getHistory(key)` is what lets a rule compare two
 * points in time for the SAME thing (e.g. review-count regression).
 */
export interface ArchivedCapture {
  id: string
  key: string
  capture: Capture
  /** ISO timestamp — when this record was appended, independent of `capture.fetchedAt`. */
  archivedAt: string
  /** Independently recomputed at archive time — never trusts a caller-supplied hash,
   *  so a mutated-in-transit Capture can't silently pass as tamper-evident. */
  sha256: string
  /** null = kept forever. */
  expiresAt: string | null
}

export interface RetentionPolicy {
  /** null = keep forever. */
  maxAgeDays: number | null
}

/**
 * Storage seam — `CaptureArchive` is the public API; a backend is just persistence.
 * Append-only by contract: no `update`/`delete` method exists for a single record.
 * `purgeExpired` is the one operation that removes data, and only records already past
 * their own declared `expiresAt` — never an arbitrary delete.
 */
export interface CaptureArchiveBackend {
  append(record: ArchivedCapture): Promise<void>
  /** Oldest first. */
  getHistory(key: string): Promise<ArchivedCapture[]>
  getAll(): Promise<ArchivedCapture[]>
  /** Returns the number of records removed. */
  purgeExpired(now: Date): Promise<number>
}
