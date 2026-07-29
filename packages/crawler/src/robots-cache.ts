import {
  parseRobotsGroups,
  isPathBlocked,
  robotsProductToken,
  type RobotsGroupRules,
} from '@ss/safe-fetch'

/**
 * Result of trying to fetch one origin's robots.txt. `{ status: 'fetched' }` covers
 * both "here's the body" and a real 404 (no robots.txt published — safeFetch reports
 * that as a normal 200/404 response, `ok: true`, not a failure). `{ status:
 * 'unavailable' }` is for when the fetch itself genuinely failed — timeout, DNS error,
 * blocked IP, or exceeding safeFetch's byte cap — which must NOT be treated the same
 * as "no restrictions declared" (confirmed as a real fail-open bug via adversarial
 * review this session): if we can't verify what robots.txt says, we don't guess.
 */
export type RobotsFetchResult = { status: 'fetched'; body: string } | { status: 'unavailable' }
export type RobotsFetcher = (origin: string) => Promise<RobotsFetchResult>

export type RobotsCheckResult = 'allowed' | 'blocked' | 'unavailable'

const EMPTY_RULES: RobotsGroupRules = { disallow: [], allow: [] }

/**
 * Fetches and caches one origin's robots.txt for the lifetime of a `Crawler` instance
 * (a single crawl run) — refetching per-URL would waste a request per capture for
 * something that almost never changes mid-run, and this crawler never runs long enough
 * for staleness to matter. The in-flight fetch itself is also shared (not just the
 * final result) — two concurrent checks against the same not-yet-cached origin await
 * the SAME fetch rather than each firing their own (a real, confirmed extra-request
 * bug via adversarial review this session).
 */
export class RobotsCache {
  private readonly cache = new Map<string, Record<string, RobotsGroupRules> | 'unavailable'>()
  private readonly inFlight = new Map<
    string,
    Promise<Record<string, RobotsGroupRules> | 'unavailable'>
  >()

  constructor(private readonly fetchRobotsTxt: RobotsFetcher) {}

  private groupsFor(origin: string): Promise<Record<string, RobotsGroupRules> | 'unavailable'> {
    const cached = this.cache.get(origin)
    if (cached !== undefined) return Promise.resolve(cached)
    const pending = this.inFlight.get(origin)
    if (pending) return pending

    const fetchPromise = this.fetchRobotsTxt(origin).then((result) => {
      const value = result.status === 'fetched' ? parseRobotsGroups(result.body) : 'unavailable'
      this.cache.set(origin, value)
      this.inFlight.delete(origin)
      return value
    })
    this.inFlight.set(origin, fetchPromise)
    return fetchPromise
  }

  /** Whether `path` is off-limits for `userAgent` — checks the named agent's own
   *  product-token group first (RFC 9309 §2.2.1: our real user-agent string, e.g.
   *  "SimpleSense-Crawler/0.1 (+https://...)", is matched by its bare product token,
   *  not the whole descriptive string — a real bug this session, since a robots.txt
   *  group named for us specifically could never have matched otherwise), falling back
   *  to `*` (the real robots.txt precedence: a more specific User-agent group, if
   *  present at all, replaces the wildcard group rather than adding to it). Returns
   *  'unavailable' — never a silent "allowed" — when robots.txt genuinely couldn't be
   *  fetched. */
  async isDisallowed(origin: string, path: string, userAgent: string): Promise<RobotsCheckResult> {
    const groups = await this.groupsFor(origin)
    if (groups === 'unavailable') return 'unavailable'
    const ourToken = robotsProductToken(userAgent).toLowerCase()
    const rules = groups[ourToken] ?? groups['*'] ?? EMPTY_RULES
    return isPathBlocked(path, rules) ? 'blocked' : 'allowed'
  }
}
