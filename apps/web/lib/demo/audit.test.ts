import { describe, it, expect } from 'vitest'
import { buildAudit, findPiiLeaks } from './audit'

describe('public Audit (the wedge)', () => {
  it('curates 2–3 grounded moves with headline stats', async () => {
    const audit = await buildAudit('demo')
    expect(audit.moves.length).toBeGreaterThanOrEqual(2)
    expect(audit.moves.length).toBeLessThanOrEqual(3)
    expect(audit.stats.length).toBeGreaterThan(0)
    expect(audit.headline).toContain('Wildflower')
  })

  it('contains NO customer PII (no emails, no raw customer ids/addresses)', async () => {
    const audit = await buildAudit('demo')
    expect(findPiiLeaks(audit)).toEqual([])

    const json = JSON.stringify(audit)
    expect(json).not.toMatch(/@/) // no email addresses
    expect(json).not.toMatch(/"customerId"/) // no raw customer identifiers
    expect(json).not.toMatch(/San Francisco|Los Angeles/) // no raw ship-to city strings
  })
})
