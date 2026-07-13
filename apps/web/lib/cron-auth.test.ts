import { describe, it, expect } from 'vitest'
import { isAuthorizedCron } from './cron-auth'

describe('isAuthorizedCron', () => {
  it('accepts the correct secret with a Bearer prefix', () => {
    expect(isAuthorizedCron('Bearer testsecret', 'testsecret')).toBe(true)
  })

  it('accepts the correct secret without a Bearer prefix', () => {
    expect(isAuthorizedCron('testsecret', 'testsecret')).toBe(true)
  })

  it('rejects the wrong secret', () => {
    expect(isAuthorizedCron('Bearer wrong', 'testsecret')).toBe(false)
  })

  it('rejects an empty header', () => {
    expect(isAuthorizedCron('', 'testsecret')).toBe(false)
  })

  it('rejects a null header', () => {
    expect(isAuthorizedCron(null, 'testsecret')).toBe(false)
  })

  it('rejects when the configured secret is null, even if the header matches empty string', () => {
    expect(isAuthorizedCron('', null)).toBe(false)
  })

  it('rejects when the configured secret is an empty string', () => {
    expect(isAuthorizedCron('Bearer testsecret', '')).toBe(false)
  })
})
