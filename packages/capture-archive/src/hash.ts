import { createHash } from 'node:crypto'
import type { Capture } from '@ss/crawler'

/**
 * Independently recomputes the tamper-evidence hash from a Capture's actual bytes —
 * the archive never just trusts `capture.sha256` as-given, even though the crawler
 * computes it the same way, so a record's hash is always traceable to THIS archive's
 * own computation, not a value that merely passed through unchecked.
 */
export function hashCapture(capture: Capture): string {
  return createHash('sha256').update(capture.html).update(capture.screenshotBase64).digest('hex')
}
