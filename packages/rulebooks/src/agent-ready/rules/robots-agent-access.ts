import type { Rule } from '../../types'
import type { AgentReadySnapshot } from '../types'

/** Founding rule #3: does robots.txt block AI agents from reading this store at all? */
export const robotsAgentAccessRule: Rule<AgentReadySnapshot> = {
  id: 'agent_ready.robots_agent_access',
  title: 'robots.txt agent access',
  severity: 'high',
  citation: { label: 'SimpleSense AgentReady benchmark v0 — named AI-agent user-agent tokens' },
  remediationTemplate:
    'Remove a blanket `Disallow: /` for `User-agent: *`, or explicitly allow the named AI-agent bots you want indexing/recommending your store.',
  version: '0.1.0',
  addedBecause:
    'Founding rule — a store can have perfect structured data and still be invisible to agents if robots.txt blocks them outright.',
  detect(snapshot) {
    if (!snapshot.robotsTxt.fetchedOk) {
      return { status: 'insufficient', insufficientReason: 'robots.txt could not be fetched.' }
    }
    const { disallowsAll, blockedAgentBots } = snapshot.robotsTxt
    if (disallowsAll) {
      return {
        status: 'triggered',
        passed: false,
        evidence: {
          summary:
            'robots.txt disallows everything for all user-agents (`User-agent: *` / `Disallow: /`).',
          metrics: { disallowsAll: true, blockedAgentBotCount: blockedAgentBots.length },
        },
        action:
          'Remove the blanket disallow, or add explicit Allow rules for search/agent crawlers.',
      }
    }
    if (blockedAgentBots.length > 0) {
      return {
        status: 'triggered',
        passed: false,
        evidence: {
          summary: `robots.txt explicitly blocks ${blockedAgentBots.length} named AI-agent bot(s): ${blockedAgentBots.join(', ')}.`,
          metrics: {
            disallowsAll: false,
            blockedAgentBotCount: blockedAgentBots.length,
            blockedAgentBots: blockedAgentBots.join(', '),
          },
        },
        action: `Decide deliberately: if you want these agents recommending your store, remove the Disallow rule(s) for ${blockedAgentBots.join(', ')}.`,
      }
    }
    return {
      status: 'triggered',
      passed: true,
      evidence: {
        summary: 'robots.txt does not block general crawling or any named AI-agent bot.',
        metrics: { disallowsAll: false, blockedAgentBotCount: 0 },
      },
      action: 'No gap here — robots.txt is agent-friendly.',
    }
  },
}
