/**
 * robots.txt parsing + matching — groups consecutive `User-agent:` lines into one
 * record per the real spec (a group of agent lines shares the directives that follow,
 * until the next non-consecutive User-agent line). Shared by M2 AgentReady's rubric
 * (does robots.txt block AI-agent bots at all?) and the S1 crawler's own compliance
 * check (should *we* fetch this specific path?) — one parser, not two copies drifting
 * apart.
 */

export interface RobotsGroupRules {
  disallow: string[]
  allow: string[]
}

function parseRobotsGroupsInternal(text: string): Record<string, RobotsGroupRules> {
  const groups: Record<string, RobotsGroupRules> = {}
  let pendingAgents: string[] = []
  let groupClosed = false

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.split('#')[0]!.trim()
    if (!line) continue
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue
    const key = line.slice(0, colonIdx).trim().toLowerCase()
    const value = line.slice(colonIdx + 1).trim()

    if (key === 'user-agent') {
      if (groupClosed) {
        pendingAgents = []
        groupClosed = false
      }
      const agent = value.toLowerCase()
      pendingAgents.push(agent)
      if (!(agent in groups)) groups[agent] = { disallow: [], allow: [] }
      continue
    }
    if (key === 'disallow') {
      groupClosed = true
      if (value !== '') {
        for (const agent of pendingAgents) groups[agent]!.disallow.push(value)
      }
      continue
    }
    if (key === 'allow') {
      groupClosed = true
      if (value !== '') {
        for (const agent of pendingAgents) groups[agent]!.allow.push(value)
      }
      continue
    }
    groupClosed = true // any other directive (Crawl-delay, Sitemap, ...) also closes the group
  }
  return groups
}

/**
 * Every Disallow/Allow rule for every declared User-agent group. The crawler's own
 * per-path compliance check needs both (see `isPathBlocked`'s longest-match
 * precedence) — M2 AgentReady's "does this block everything" rubric check only ever
 * needed the Disallow list, so `parseRobotsDisallows` below stays a thin,
 * backward-compatible view over this same parse rather than a second implementation.
 */
export function parseRobotsGroups(text: string): Record<string, RobotsGroupRules> {
  return parseRobotsGroupsInternal(text)
}

/** Back-compat view of `parseRobotsGroups` for M2 AgentReady's rubric, which only
 *  ever asked "does this block everything for `*`/a named bot" — never needed Allow. */
export function parseRobotsDisallows(text: string): Record<string, string[]> {
  const groups = parseRobotsGroupsInternal(text)
  return Object.fromEntries(Object.entries(groups).map(([agent, g]) => [agent, g.disallow]))
}

/** `Disallow: /` (the whole site) among a set of disallow paths for one agent. */
export function disallowsEverything(paths: string[]): boolean {
  return paths.includes('/')
}

/**
 * Converts one robots.txt path RULE into a matcher regex, per the extended de-facto
 * spec real sites (Shopify included) rely on even though RFC 9309 doesn't formally
 * define it: `*` matches any run of characters, `$` anchors the END of the path (only
 * meaningful as the rule's last character) — everything else is a literal prefix
 * match. A naive `path.startsWith(rule)` (this file's earlier version) silently never
 * matches any rule containing `*`/`$`, since real paths essentially never contain
 * those characters literally — confirmed as a real bug via adversarial review this
 * session (e.g. Shopify's own `Disallow: /blogs/*+*` never fired).
 */
function robotsRuleToRegExp(rule: string): RegExp {
  const hasEndAnchor = rule.endsWith('$')
  const body = hasEndAnchor ? rule.slice(0, -1) : rule
  const pattern = body.replace(/[.*+?^${}()|[\]\\]/g, (c) => (c === '*' ? '.*' : `\\${c}`))
  return new RegExp(`^${pattern}${hasEndAnchor ? '$' : ''}`)
}

function matchLength(path: string, rule: string): number {
  return robotsRuleToRegExp(rule).test(path) ? rule.length : -1
}

/**
 * Real robots.txt precedence (Google's documented de-facto interpretation, which
 * Shopify and most real sites rely on): among every Allow/Disallow rule that matches
 * `path`, the LONGEST (most specific) raw rule wins, not "any Disallow blocks it" —
 * a site commonly writes `Disallow: /` + `Allow: /products/` to block crawling in
 * general while still permitting its storefront, and that carve-out must actually work
 * for a crawler whose whole purpose is reading product/review pages.
 */
export function isPathBlocked(path: string, rules: RobotsGroupRules): boolean {
  let bestLen = -1
  let bestIsAllow = true
  for (const rule of rules.disallow) {
    const len = matchLength(path, rule)
    if (len > bestLen) {
      bestLen = len
      bestIsAllow = false
    }
  }
  for (const rule of rules.allow) {
    const len = matchLength(path, rule)
    if (len > bestLen) {
      bestLen = len
      bestIsAllow = true
    }
  }
  return bestLen >= 0 && !bestIsAllow
}

/**
 * The "product token" a crawler is expected to identify itself by for robots.txt
 * group matching (RFC 9309 §2.2.1) — the bare name before any `/version` or
 * parenthetical comment, e.g. "SimpleSense-Crawler" out of
 * "SimpleSense-Crawler/0.1 (+https://simplesense.co)". Matching on the FULL descriptive
 * user-agent string (this file's earlier version) means a site's own
 * `User-agent: SimpleSense-Crawler` group can never match our real UA, silently
 * falling through to `*` (or nothing at all) — confirmed as a real bug via adversarial
 * review this session.
 */
export function robotsProductToken(userAgent: string): string {
  return userAgent.split('/')[0]!.trim()
}
