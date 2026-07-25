import type { ExampleMoveTemplate } from './types'

const TOKEN_RE = /\{\{computed\.([a-zA-Z0-9_]+)\}\}/g

/** Interpolates `{{computed.x}}` tokens against a resolved metrics map. Throws on a missing key — a silently-blank number is worse than a build failure. */
export function renderMoveTemplate(
  template: string,
  computed: Record<string, string | number>,
): string {
  return template.replace(TOKEN_RE, (_match, key: string) => {
    if (!(key in computed)) {
      throw new Error(`renderMoveTemplate: missing computed value for token "${key}"`)
    }
    return String(computed[key])
  })
}

export interface RenderedMove {
  title: string
  narrative: string
}

export function renderMoves(
  moves: ExampleMoveTemplate[],
  computed: Record<string, string | number>,
): RenderedMove[] {
  return moves.map((m) => ({
    title: m.title,
    narrative: renderMoveTemplate(m.narrativeTemplate, computed),
  }))
}

/**
 * §2.3's computed-token rule, made testable: does a RAW template (before
 * interpolation) contain a literal dollar amount or percentage, as opposed to a
 * `{{computed.x}}` token? Strips tokens first so a token immediately followed by a
 * literal `%` for display formatting (e.g. "{{computed.sharePct}}%") is allowed — the
 * number itself is still computed, only the unit symbol is static. What's banned is a
 * hand-typed number+unit combination like "20%" or "$500" appearing anywhere.
 */
export function hasLiteralDollarOrPercent(template: string): boolean {
  const withoutTokens = template.replace(TOKEN_RE, '')
  return /\$\d/.test(withoutTokens) || /\d%/.test(withoutTokens)
}
