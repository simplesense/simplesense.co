import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

/**
 * App-level secret encryption (AES-256-GCM) for OAuth tokens at rest (Prime Directive #2).
 * Key is a base64-encoded 32-byte value in APP_ENCRYPTION_KEY. Output format:
 * `iv.tag.ciphertext` (all base64). A random IV per call means identical plaintext yields
 * different ciphertext. Never log the key or plaintext.
 */
const ALGO = 'aes-256-gcm'

function keyBuffer(key?: string): Buffer {
  const raw = key ?? process.env.APP_ENCRYPTION_KEY
  if (!raw) throw new Error('APP_ENCRYPTION_KEY is not set')
  const buf = Buffer.from(raw, 'base64')
  if (buf.length !== 32) throw new Error('APP_ENCRYPTION_KEY must be a base64-encoded 32-byte key')
  return buf
}

export function encryptSecret(plaintext: string, key?: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGO, keyBuffer(key), iv)
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [iv.toString('base64'), tag.toString('base64'), enc.toString('base64')].join('.')
}

export function decryptSecret(payload: string, key?: string): string {
  const parts = payload.split('.')
  if (parts.length !== 3) throw new Error('malformed ciphertext')
  const [ivB, tagB, encB] = parts as [string, string, string]
  const decipher = createDecipheriv(ALGO, keyBuffer(key), Buffer.from(ivB, 'base64'))
  decipher.setAuthTag(Buffer.from(tagB, 'base64'))
  return Buffer.concat([decipher.update(Buffer.from(encB, 'base64')), decipher.final()]).toString(
    'utf8',
  )
}
