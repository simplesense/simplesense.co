import { appendFile, readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import type { ArchivedCapture, CaptureArchiveBackend } from './types'

/**
 * Append-only JSON-lines file on disk — one record per line, so `append()` is a single
 * O(1) write rather than a read-modify-write of the whole store. `purgeExpired` is the
 * one operation that reads and rewrites the full file, which is fine: it's an
 * infrequent sweep, not a per-capture cost.
 */
export class JsonFileCaptureArchiveBackend implements CaptureArchiveBackend {
  constructor(private readonly filePath: string) {}

  private async readAll(): Promise<ArchivedCapture[]> {
    let text: string
    try {
      text = await readFile(this.filePath, 'utf8')
    } catch (err) {
      if (err instanceof Error && 'code' in err && err.code === 'ENOENT') return []
      throw err
    }
    return text
      .split('\n')
      .filter((line) => line.trim() !== '')
      .map((line) => JSON.parse(line) as ArchivedCapture)
  }

  async append(record: ArchivedCapture): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true })
    await appendFile(this.filePath, `${JSON.stringify(record)}\n`, 'utf8')
  }

  async getHistory(key: string): Promise<ArchivedCapture[]> {
    const all = await this.readAll()
    return all.filter((r) => r.key === key)
  }

  async getAll(): Promise<ArchivedCapture[]> {
    return this.readAll()
  }

  async purgeExpired(now: Date): Promise<number> {
    const all = await this.readAll()
    const nowMs = now.getTime()
    const kept = all.filter((r) => r.expiresAt === null || new Date(r.expiresAt).getTime() > nowMs)
    await writeFile(
      this.filePath,
      kept.map((r) => JSON.stringify(r)).join('\n') + (kept.length > 0 ? '\n' : ''),
      'utf8',
    )
    return all.length - kept.length
  }
}
