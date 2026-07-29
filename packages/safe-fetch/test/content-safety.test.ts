import { describe, it, expect } from 'vitest'
import { detectsCaptcha, looksLikeLoginPath } from '../src/content-safety'

describe('detectsCaptcha', () => {
  it('detects a reCAPTCHA script', () => {
    expect(detectsCaptcha('<script src="https://www.google.com/recaptcha/api.js"></script>')).toBe(
      true,
    )
  })
  it('detects an hCaptcha div', () => {
    expect(detectsCaptcha('<div class="h-captcha" data-sitekey="x"></div>')).toBe(true)
  })
  it('detects Cloudflare Turnstile', () => {
    expect(detectsCaptcha('<div class="cf-turnstile"></div>')).toBe(true)
  })
  it('detects Arkose Labs / FunCaptcha', () => {
    expect(detectsCaptcha('<script src="https://client-api.arkoselabs.com/x.js"></script>')).toBe(
      true,
    )
    expect(detectsCaptcha('<div id="funcaptcha"></div>')).toBe(true)
  })
  it('is case-insensitive', () => {
    expect(detectsCaptcha('<DIV CLASS="H-CAPTCHA"></DIV>')).toBe(true)
  })
  it('returns false for a page with no captcha markers', () => {
    expect(detectsCaptcha('<html><body>Buy now</body></html>')).toBe(false)
  })
})

describe('looksLikeLoginPath', () => {
  it('matches common login path conventions', () => {
    expect(looksLikeLoginPath('/login')).toBe(true)
    expect(looksLikeLoginPath('/account/sign-in')).toBe(true)
    expect(looksLikeLoginPath('/account/login')).toBe(true)
  })
  it('does not match an unrelated path', () => {
    expect(looksLikeLoginPath('/products/tee')).toBe(false)
  })
})
