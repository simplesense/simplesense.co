import { describe, it, expect } from 'vitest'
import { runRulebook } from '../../src/engine'
import { agentReadyRulebook } from '../../src/agent-ready/rulebook'
import { snapshot, findFinding } from './factory'

describe('productSchemaRule', () => {
  it('is insufficient when the page could not be fetched', () => {
    const f = findFinding(
      runRulebook(
        agentReadyRulebook,
        snapshot({ productPage: { ...snapshot().productPage, fetchedOk: false } }),
      ),
      'agent_ready.product_schema',
    )
    expect(f.status).toBe('insufficient')
  })

  it('reports no gap for a complete, valid Product schema', () => {
    const f = findFinding(runRulebook(agentReadyRulebook, snapshot()), 'agent_ready.product_schema')
    expect(f.status).toBe('triggered')
    expect(f.action).toMatch(/no gap/i)
  })

  it('flags a page with no Product schema at all', () => {
    const snap = snapshot({
      productPage: {
        ...snapshot().productPage,
        productSchema: {
          found: false,
          hasName: false,
          hasOffers: false,
          hasAggregateRating: false,
          hasReview: false,
          offer: null,
        },
      },
    })
    const f = findFinding(runRulebook(agentReadyRulebook, snap), 'agent_ready.product_schema')
    expect(f.evidence?.metrics.found).toBe(false)
  })

  it('flags an invalid availability value', () => {
    const snap = snapshot({
      productPage: {
        ...snapshot().productPage,
        productSchema: {
          found: true,
          hasName: true,
          hasOffers: true,
          hasAggregateRating: false,
          hasReview: false,
          offer: {
            hasPrice: true,
            priceCurrency: 'USD',
            availability: 'Available Now',
            validAvailability: false,
          },
        },
      },
    })
    const f = findFinding(runRulebook(agentReadyRulebook, snap), 'agent_ready.product_schema')
    expect(f.evidence?.summary).toContain('invalid availability value')
  })
})

describe('policyTextRule', () => {
  it('is insufficient when the page could not be fetched', () => {
    const f = findFinding(
      runRulebook(
        agentReadyRulebook,
        snapshot({ productPage: { ...snapshot().productPage, fetchedOk: false } }),
      ),
      'agent_ready.policy_text',
    )
    expect(f.status).toBe('insufficient')
  })

  it('flags no policy link found', () => {
    const f = findFinding(
      runRulebook(
        agentReadyRulebook,
        snapshot({ policyPage: { found: false, fetchedOk: null, visibleTextLength: null } }),
      ),
      'agent_ready.policy_text',
    )
    expect(f.evidence?.metrics.found).toBe(false)
  })

  it('flags a policy page under the text-length floor', () => {
    const f = findFinding(
      runRulebook(
        agentReadyRulebook,
        snapshot({ policyPage: { found: true, fetchedOk: true, visibleTextLength: 40 } }),
      ),
      'agent_ready.policy_text',
    )
    expect(f.evidence?.summary).toContain('40 characters')
  })

  it('reports no gap for a substantial policy page', () => {
    const f = findFinding(runRulebook(agentReadyRulebook, snapshot()), 'agent_ready.policy_text')
    expect(f.action).toMatch(/no gap/i)
  })
})

describe('robotsAgentAccessRule', () => {
  it('is insufficient when robots.txt could not be fetched', () => {
    const f = findFinding(
      runRulebook(
        agentReadyRulebook,
        snapshot({ robotsTxt: { fetchedOk: false, disallowsAll: false, blockedAgentBots: [] } }),
      ),
      'agent_ready.robots_agent_access',
    )
    expect(f.status).toBe('insufficient')
  })

  it('flags a blanket disallow', () => {
    const f = findFinding(
      runRulebook(
        agentReadyRulebook,
        snapshot({ robotsTxt: { fetchedOk: true, disallowsAll: true, blockedAgentBots: [] } }),
      ),
      'agent_ready.robots_agent_access',
    )
    expect(f.evidence?.summary).toContain('disallows everything')
  })

  it('flags named AI-agent bots blocked without a blanket disallow', () => {
    const f = findFinding(
      runRulebook(
        agentReadyRulebook,
        snapshot({
          robotsTxt: {
            fetchedOk: true,
            disallowsAll: false,
            blockedAgentBots: ['GPTBot', 'ClaudeBot'],
          },
        }),
      ),
      'agent_ready.robots_agent_access',
    )
    expect(f.evidence?.metrics.blockedAgentBotCount).toBe(2)
  })

  it('reports no gap when nothing is blocked', () => {
    const f = findFinding(
      runRulebook(agentReadyRulebook, snapshot()),
      'agent_ready.robots_agent_access',
    )
    expect(f.action).toMatch(/no gap/i)
  })
})

describe('loginWallRule', () => {
  it('is insufficient when the page could not be fetched', () => {
    const f = findFinding(
      runRulebook(
        agentReadyRulebook,
        snapshot({ productPage: { ...snapshot().productPage, fetchedOk: false } }),
      ),
      'agent_ready.login_wall',
    )
    expect(f.status).toBe('insufficient')
  })

  it('flags a login-walled page', () => {
    const f = findFinding(
      runRulebook(
        agentReadyRulebook,
        snapshot({ productPage: { ...snapshot().productPage, looksLoginWalled: true } }),
      ),
      'agent_ready.login_wall',
    )
    expect(f.evidence?.metrics.looksLoginWalled).toBe(true)
  })

  it('reports no gap for a publicly viewable page', () => {
    const f = findFinding(runRulebook(agentReadyRulebook, snapshot()), 'agent_ready.login_wall')
    expect(f.action).toMatch(/no gap/i)
  })
})

describe('captchaGateRule', () => {
  it('is insufficient when the page could not be fetched', () => {
    const f = findFinding(
      runRulebook(
        agentReadyRulebook,
        snapshot({ productPage: { ...snapshot().productPage, fetchedOk: false } }),
      ),
      'agent_ready.captcha_gate',
    )
    expect(f.status).toBe('insufficient')
  })

  it('flags a CAPTCHA on the product page', () => {
    const f = findFinding(
      runRulebook(
        agentReadyRulebook,
        snapshot({ productPage: { ...snapshot().productPage, hasCaptcha: true } }),
      ),
      'agent_ready.captcha_gate',
    )
    expect(f.evidence?.metrics.hasCaptcha).toBe(true)
  })

  it('reports no gap when there is no CAPTCHA', () => {
    const f = findFinding(runRulebook(agentReadyRulebook, snapshot()), 'agent_ready.captcha_gate')
    expect(f.action).toMatch(/no gap/i)
  })
})

describe('renderTransparencyRule', () => {
  it('is insufficient when the page could not be fetched', () => {
    const f = findFinding(
      runRulebook(
        agentReadyRulebook,
        snapshot({ productPage: { ...snapshot().productPage, fetchedOk: false } }),
      ),
      'agent_ready.render_transparency',
    )
    expect(f.status).toBe('insufficient')
  })

  it('flags low text + no schema as consistent with client-side rendering', () => {
    const snap = snapshot({
      productPage: {
        ...snapshot().productPage,
        visibleTextLength: 50,
        productSchema: {
          found: false,
          hasName: false,
          hasOffers: false,
          hasAggregateRating: false,
          hasReview: false,
          offer: null,
        },
      },
    })
    const f = findFinding(runRulebook(agentReadyRulebook, snap), 'agent_ready.render_transparency')
    expect(f.evidence?.summary).toContain('cannot execute JavaScript to confirm')
  })

  it('does not flag low text when structured Product data is still present', () => {
    const snap = snapshot({ productPage: { ...snapshot().productPage, visibleTextLength: 50 } })
    const f = findFinding(runRulebook(agentReadyRulebook, snap), 'agent_ready.render_transparency')
    expect(f.action).toMatch(/no gap/i)
  })

  it('reports no gap for ample visible text', () => {
    const f = findFinding(
      runRulebook(agentReadyRulebook, snapshot()),
      'agent_ready.render_transparency',
    )
    expect(f.action).toMatch(/no gap/i)
  })
})
