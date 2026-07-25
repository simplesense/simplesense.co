import { describe, it, expect, vi, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { buildAgentReadySnapshot } from '../../src/agent-ready/build-snapshot'
import { runRulebook, agentReady } from '@ss/rulebooks'

const { agentReadyRulebook, computeAgentReadyScore } = agentReady

afterEach(() => {
  vi.unstubAllGlobals()
})

const productHtml = readFileSync(
  new URL('../../../../fixtures/agent-ready/case-01/product.html', import.meta.url),
  'utf8',
)
const policyHtml = readFileSync(
  new URL('../../../../fixtures/agent-ready/case-01/policy.html', import.meta.url),
  'utf8',
)
const robotsTxt = readFileSync(
  new URL('../../../../fixtures/agent-ready/case-01/robots.txt', import.meta.url),
  'utf8',
)

const PUBLIC_IP = '93.184.216.34'

/**
 * "Trail Runner Jacket" fixture (fixtures/agent-ready/case-01): a realistic PDP with a
 * deliberate, single planted gap — a reCAPTCHA widget — everything else clean. Proves
 * the full chassis (safeFetch -> buildAgentReadySnapshot -> rulebook -> score) end to
 * end against real (fixture) HTML, independent of live internet state.
 */
describe('M2 AgentReady — end-to-end chassis (fixture case-01)', () => {
  it('scores 5 of 6 checks passing — every rule but the CAPTCHA gate', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(productHtml, { status: 200 }))
      .mockResolvedValueOnce(new Response(policyHtml, { status: 200 }))
      .mockResolvedValueOnce(new Response(robotsTxt, { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const snapshot = await buildAgentReadySnapshot(
      'https://trailco.example.com/products/runner-jacket',
      {
        lookup: () => Promise.resolve([PUBLIC_IP]),
      },
    )
    const findings = runRulebook(agentReadyRulebook, snapshot)
    expect(findings).toHaveLength(6)

    const byId = Object.fromEntries(findings.map((f) => [f.ruleId, f]))
    expect(byId['agent_ready.product_schema']!.passed).toBe(true)
    expect(byId['agent_ready.policy_text']!.passed).toBe(true)
    expect(byId['agent_ready.robots_agent_access']!.passed).toBe(true)
    expect(byId['agent_ready.login_wall']!.passed).toBe(true)
    expect(byId['agent_ready.render_transparency']!.passed).toBe(true)
    // The one planted gap:
    expect(byId['agent_ready.captcha_gate']!.passed).toBe(false)
    expect(byId['agent_ready.captcha_gate']!.evidence?.summary).toContain('CAPTCHA widget')

    const { score, passedCount, assessedCount } = computeAgentReadyScore(findings)
    expect(assessedCount).toBe(6)
    expect(passedCount).toBe(5)
    expect(score).toBe(83) // round(5/6 * 100)
  })
})
