import { describe, it, expect } from 'vitest'
import { normalizeShopInput } from './shop-input'

describe('normalizeShopInput', () => {
  it('completes a bare store name', () => {
    expect(normalizeShopInput('mystore')).toBe('mystore.myshopify.com')
  })
  it('passes a full domain through', () => {
    expect(normalizeShopInput('mystore.myshopify.com')).toBe('mystore.myshopify.com')
  })
  it('strips protocol, path, whitespace and case (mirrors server normalizeShop)', () => {
    expect(normalizeShopInput('  https://MyStore.myshopify.com/admin  ')).toBe(
      'mystore.myshopify.com',
    )
  })
  it('returns empty string unchanged', () => {
    expect(normalizeShopInput('   ')).toBe('')
  })
})
