import { describe, it, expect } from 'vitest'
import { encryptSecret, decryptSecret } from '../src/crypto'

const KEY = Buffer.from('0123456789abcdef0123456789abcdef').toString('base64') // 32 bytes

describe('secret encryption (AES-256-GCM)', () => {
  it('round-trips a token', () => {
    const token = 'shpat_super_secret_value'
    expect(decryptSecret(encryptSecret(token, KEY), KEY)).toBe(token)
  })

  it('produces different ciphertext each call (random IV)', () => {
    expect(encryptSecret('x', KEY)).not.toBe(encryptSecret('x', KEY))
  })

  it('fails to decrypt tampered ciphertext', () => {
    const enc = encryptSecret('secret', KEY)
    const tampered = enc.slice(0, -2) + (enc.endsWith('A') ? 'B' : 'A')
    expect(() => decryptSecret(tampered, KEY)).toThrow()
  })

  it('rejects a wrong-length key', () => {
    expect(() => encryptSecret('x', Buffer.from('short').toString('base64'))).toThrow(/32-byte/)
  })
})
