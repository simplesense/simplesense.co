import { describe, it, expect } from 'vitest'
import { parseRobotsDisallows, disallowsEverything } from '../../src/agent-ready/robots-txt'

describe('parseRobotsDisallows', () => {
  it('parses a single-agent group', () => {
    const txt = 'User-agent: *\nDisallow: /admin\nDisallow: /cart\n'
    expect(parseRobotsDisallows(txt)).toEqual({ '*': ['/admin', '/cart'] })
  })

  it('groups consecutive User-agent lines into one shared record', () => {
    const txt = 'User-agent: GPTBot\nUser-agent: ClaudeBot\nDisallow: /\n'
    expect(parseRobotsDisallows(txt)).toEqual({ gptbot: ['/'], claudebot: ['/'] })
  })

  it('starts a new group after a non-User-agent directive closes the previous one', () => {
    const txt = 'User-agent: A\nDisallow: /x\nUser-agent: B\nDisallow: /y\n'
    expect(parseRobotsDisallows(txt)).toEqual({ a: ['/x'], b: ['/y'] })
  })

  it('records an agent with zero disallows when it has none', () => {
    const txt = 'User-agent: GPTBot\nAllow: /\n'
    expect(parseRobotsDisallows(txt)).toEqual({ gptbot: [] })
  })

  it('ignores comments and blank lines', () => {
    const txt = '# comment\n\nUser-agent: *\n# another comment\nDisallow: /admin\n'
    expect(parseRobotsDisallows(txt)).toEqual({ '*': ['/admin'] })
  })

  it('treats "Disallow:" with no path as disallowing nothing', () => {
    const txt = 'User-agent: *\nDisallow:\n'
    expect(parseRobotsDisallows(txt)).toEqual({ '*': [] })
  })

  it('is case-insensitive on the agent token', () => {
    const txt = 'User-agent: GptBot\nDisallow: /\n'
    expect(parseRobotsDisallows(txt)).toEqual({ gptbot: ['/'] })
  })
})

describe('disallowsEverything', () => {
  it('is true when "/" is among the disallowed paths', () => {
    expect(disallowsEverything(['/admin', '/'])).toBe(true)
  })
  it('is false for a partial disallow list', () => {
    expect(disallowsEverything(['/admin', '/cart'])).toBe(false)
  })
  it('is false for an empty list', () => {
    expect(disallowsEverything([])).toBe(false)
  })
})
