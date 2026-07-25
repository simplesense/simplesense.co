export interface SafeFetchOptions {
  /** Default 10s. */
  timeoutMs?: number
  /** Default 3. */
  maxRedirects?: number
  /** Default 2MB — the rubric only needs HTML/headers, never a large asset. */
  maxBytes?: number
  /**
   * Injectable for testing (avoids real DNS in unit tests) — returns every resolved
   * address for a hostname. Defaults to `dns.promises.lookup(hostname, { all: true })`.
   */
  lookup?: (hostname: string) => Promise<string[]>
}

export type SafeFetchResult =
  | {
      ok: true
      status: number
      headers: Record<string, string>
      body: string
      finalUrl: string
    }
  | {
      ok: false
      reason: string
    }
