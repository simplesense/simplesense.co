/**
 * Minimal robots.txt parser — groups consecutive `User-agent:` lines into one record
 * per the real spec (a group of agent lines shares the directives that follow, until
 * the next non-consecutive User-agent line), and only tracks `Disallow` (all this
 * rubric needs: "does this block agents entirely").
 */
export function parseRobotsDisallows(text: string): Record<string, string[]> {
  const disallowsByAgent: Record<string, string[]> = {}
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
      if (!(agent in disallowsByAgent)) disallowsByAgent[agent] = []
      continue
    }
    if (key === 'disallow') {
      groupClosed = true
      if (value === '') continue // "Disallow:" with no path means "disallow nothing"
      for (const agent of pendingAgents) {
        disallowsByAgent[agent] = [...(disallowsByAgent[agent] ?? []), value]
      }
      continue
    }
    groupClosed = true // any other directive (Allow, Crawl-delay, Sitemap, ...) also closes the group
  }
  return disallowsByAgent
}

/** `Disallow: /` (the whole site) among a set of disallow paths for one agent. */
export function disallowsEverything(paths: string[]): boolean {
  return paths.includes('/')
}

/**
 * AI-agent crawler user-agent tokens worth checking specifically (beyond `*`).
 * GPTBot/ChatGPT-User/OAI-SearchBot/OAI-AdsBot verified via developers.openai.com this
 * session; the rest are widely-documented industry-standard tokens, not individually
 * re-verified this session — see PARKING_LOT.md.
 */
export const KNOWN_AI_AGENT_BOTS = [
  'GPTBot',
  'ChatGPT-User',
  'OAI-SearchBot',
  'OAI-AdsBot',
  'ClaudeBot',
  'Google-Extended',
  'PerplexityBot',
  'CCBot',
]
