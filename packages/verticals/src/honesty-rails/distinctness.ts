import type { VerticalConfig } from '../types'

// Common English function words — excluded so the measurement reflects CONTENT
// distinctness (domain vocabulary), not shared articles/prepositions.
const STOPWORDS = new Set(
  'a an the of and or to in on for with your you we our is are do does what how why not never no yes this that it its from at by as be will can could would should have has had who which when where'.split(
    ' ',
  ),
)

function tokenize(text: string): Set<string> {
  const words = text.toLowerCase().match(/[a-z0-9']+/g) ?? []
  return new Set(words.filter((w) => !STOPWORDS.has(w) && w.length > 2))
}

/** The vertical-SPECIFIC text a config contributes — deliberately excludes shared
 *  components (how-it-works, trust row, nav/footer), which the addendum's §2.4
 *  anti-doorway contract explicitly allows to be shared. */
export function collectConfigText(config: VerticalConfig): string {
  return [
    config.hero.headline,
    config.hero.subhead,
    config.hero.proofLine,
    ...config.painPoints.map((p) => p.claim),
    ...config.faq.flatMap((f) => [f.q, f.a]),
    ...config.exampleMoves.map((m) => m.title),
    config.founderLine,
  ].join(' ')
}

/** Share (0-1) of `target`'s content words that appear in NONE of `others`. */
export function computeUniquenessShare(target: VerticalConfig, others: VerticalConfig[]): number {
  const targetWords = tokenize(collectConfigText(target))
  if (targetWords.size === 0) return 1
  const otherWords = new Set(others.flatMap((o) => [...tokenize(collectConfigText(o))]))
  const uniqueCount = [...targetWords].filter((w) => !otherWords.has(w)).length
  return uniqueCount / targetWords.size
}
