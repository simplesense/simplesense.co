import { describe, it, expect } from 'vitest'
import { sniffHeader, cell, parseAmount, parseQuantity } from '../src/sniff'

describe('sniffHeader', () => {
  it('matches aliases case- and whitespace-insensitively', () => {
    const idx = sniffHeader(['  Order Name ', 'Email Address'], {
      orderName: ['Order Name', 'Name'],
      email: ['email', 'Email Address'],
    })
    expect(idx).toEqual({ orderName: 0, email: 1 })
  })

  it('omits a field entirely when no alias matches', () => {
    const idx = sniffHeader(['Name'], { orderName: ['Name'], sku: ['SKU'] })
    expect(idx).toEqual({ orderName: 0 })
  })

  it('prefers the first alias that matches when multiple would', () => {
    const idx = sniffHeader(['Reason', 'Return Reason'], {
      reason: ['Return Reason', 'Reason'],
    })
    expect(idx).toEqual({ reason: 1 })
  })
})

describe('cell', () => {
  it('returns trimmed value at the sniffed index', () => {
    expect(cell(['a', '  b  ', 'c'], 1)).toBe('b')
  })
  it('returns empty string when the column was not found', () => {
    expect(cell(['a', 'b'], undefined)).toBe('')
  })
  it('returns empty string for a short row missing that column', () => {
    expect(cell(['a'], 3)).toBe('')
  })
})

describe('parseAmount', () => {
  it('parses a plain number', () => {
    expect(parseAmount('12.50')).toBe(12.5)
  })
  it('strips a leading dollar sign and thousands commas', () => {
    expect(parseAmount('$1,234.50')).toBe(1234.5)
  })
  it('returns null for an empty string', () => {
    expect(parseAmount('')).toBeNull()
  })
  it('returns null for non-numeric text', () => {
    expect(parseAmount('N/A')).toBeNull()
  })
})

describe('parseQuantity', () => {
  it('parses a positive integer', () => {
    expect(parseQuantity('3')).toBe(3)
  })
  it('rejects a non-integer', () => {
    expect(parseQuantity('1.5')).toBeNull()
  })
  it('returns null for an empty string', () => {
    expect(parseQuantity('')).toBeNull()
  })
})
