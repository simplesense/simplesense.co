import type { Metadata } from 'next'
import { ScanForm } from './ScanForm'
import { AuditIntakeForm } from './AuditIntakeForm'

export const metadata: Metadata = {
  title: 'AgentReady — free agentic-commerce readiness scan',
  description:
    'A free scan of your product page for AI-agent readiness — schema.org validity, policy text, robots.txt access, login walls, and CAPTCHAs — plus a paid fix sprint.',
}

const CATEGORIES = [
  {
    icon: 'code-square',
    title: 'schema.org Product/Offer validity',
    body: 'Whether an agent (or a rich-results-eligible search listing) can actually parse your product’s name, price, and availability.',
  },
  {
    icon: 'file-text',
    title: 'Shipping/returns policy as text',
    body: 'Policies published as real page text an agent can read, not baked into an image.',
  },
  {
    icon: 'robot',
    title: 'robots.txt agent access',
    body: 'Whether GPTBot, ClaudeBot, PerplexityBot, and other named AI-agent crawlers are allowed in at all.',
  },
  {
    icon: 'door-closed',
    title: 'Login-walled product pages',
    body: 'An agent has no session or credentials — a login-walled PDP is invisible to it, however good the markup is.',
  },
  {
    icon: 'shield-exclamation',
    title: 'CAPTCHA on product pages',
    body: 'Bot-mitigation tooling applied too broadly blocks the same agents you want recommending you.',
  },
  {
    icon: 'eye',
    title: 'Static-fetch content coverage',
    body: 'Whether meaningful content survives a plain fetch — the closest honest proxy for “does this need JavaScript to render.”',
  },
]

export default function AgentReadyPage() {
  return (
    <>
      <section className="section" style={{ paddingTop: 150, textAlign: 'center' }}>
        <div className="sec-eyebrow">AgentReady</div>
        <h1 className="sec-title" style={{ maxWidth: '20ch', margin: '0 auto 20px' }}>
          Can AI agents actually <em>see</em> your store?
        </h1>
        <p style={{ maxWidth: '52ch', margin: '0 auto 32px', color: 'var(--ss-ink-soft)' }}>
          Free scan of one product page — schema.org validity, policy text, robots.txt access, and
          agent-hostile signals. No signup. Paid fix sprint available if we find gaps.
        </p>
        <ScanForm />
      </section>

      <section className="section" style={{ paddingTop: 8 }}>
        <div className="section-head">
          <div className="sec-eyebrow">What we check</div>
          <h2 className="sec-title">Six checks, every one grounded.</h2>
          <p>
            Static-fetch only — no JavaScript execution, no login walls bypassed. Where the scan
            can&rsquo;t verify something, it says so rather than guessing.
          </p>
        </div>
        <div className="reads">
          {CATEGORIES.map((c) => (
            <div key={c.title} className="read">
              <i
                className={`bi bi-${c.icon}`}
                style={{ color: 'var(--ss-blue-500)' }}
                aria-hidden="true"
              />
              <div className="n">{c.title}</div>
              <div className="d">{c.body}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="section" style={{ paddingTop: 8 }}>
        <div className="section-head">
          <div className="sec-eyebrow">Fix sprint</div>
          <h2 className="sec-title">Found gaps? We&rsquo;ll fix them.</h2>
          <p>
            JSON-LD templates, feed corrections, and policy-page fixes — delivered as PRs or a
            change doc.
          </p>
        </div>
        <AuditIntakeForm />
      </section>
    </>
  )
}
