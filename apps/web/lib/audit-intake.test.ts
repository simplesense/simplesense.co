import { describe, it, expect } from 'vitest'
import { validateIntake } from './audit-intake'

const valid = {
  companyName: 'Acme Co.',
  contactName: 'Jane Doe',
  email: 'jane@acme.com',
  notes: null,
}

describe('validateIntake', () => {
  it('accepts a valid submission', () => {
    const result = validateIntake(valid)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data).toEqual({
        companyName: 'Acme Co.',
        contactName: 'Jane Doe',
        email: 'jane@acme.com',
        notes: null,
      })
    }
  })

  it('rejects a missing company name', () => {
    const result = validateIntake({ ...valid, companyName: '' })
    expect(result).toEqual({ ok: false, error: 'Company, name, and email are required.' })
  })

  it('rejects a missing contact name', () => {
    const result = validateIntake({ ...valid, contactName: '   ' })
    expect(result.ok).toBe(false)
  })

  it('rejects a missing email', () => {
    const result = validateIntake({ ...valid, email: null })
    expect(result.ok).toBe(false)
  })

  it('rejects a malformed email', () => {
    const result = validateIntake({ ...valid, email: 'not-an-email' })
    expect(result).toEqual({ ok: false, error: "That email address doesn't look right." })
  })

  it('trims whitespace from all fields', () => {
    const result = validateIntake({
      companyName: '  Acme Co.  ',
      contactName: '  Jane Doe  ',
      email: '  jane@acme.com  ',
      notes: '  some notes  ',
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.companyName).toBe('Acme Co.')
      expect(result.data.notes).toBe('some notes')
    }
  })

  it('caps field lengths to prevent abuse (company 200, notes 2000)', () => {
    const result = validateIntake({
      ...valid,
      companyName: 'x'.repeat(500),
      notes: 'y'.repeat(3000),
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.companyName).toHaveLength(200)
      expect(result.data.notes).toHaveLength(2000)
    }
  })

  it('normalizes an empty notes field to null rather than an empty string', () => {
    const result = validateIntake({ ...valid, notes: '   ' })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.notes).toBeNull()
    }
  })
})
