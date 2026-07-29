/** Re-exported so existing call sites (`from './robots-txt'`) don't change — the real
 *  parser now lives in @ss/safe-fetch, shared with the S1 crawler's own compliance check. */
export { parseRobotsDisallows, disallowsEverything } from '@ss/safe-fetch'

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
