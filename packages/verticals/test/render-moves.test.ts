import { describe, it, expect } from 'vitest'
import { renderMoveTemplate, renderMoves, hasLiteralDollarOrPercent } from '../src/render-moves'

describe('renderMoveTemplate', () => {
  it('interpolates a single token', () => {
    expect(renderMoveTemplate('{{computed.x}} of revenue', { x: 20 })).toBe('20 of revenue')
  })

  it('interpolates multiple distinct tokens', () => {
    expect(renderMoveTemplate('{{computed.a}} of {{computed.b}}', { a: 'X', b: 'Y' })).toBe(
      'X of Y',
    )
  })

  it('interpolates a repeated token consistently', () => {
    expect(renderMoveTemplate('{{computed.x}} and {{computed.x}} again', { x: 5 })).toBe(
      '5 and 5 again',
    )
  })

  it('throws on a token with no matching computed value', () => {
    expect(() => renderMoveTemplate('{{computed.missing}}', {})).toThrow(/missing computed value/i)
  })

  it('leaves plain text with no tokens untouched', () => {
    expect(renderMoveTemplate('no tokens here', {})).toBe('no tokens here')
  })
})

describe('renderMoves', () => {
  it('renders title and interpolated narrative for each move', () => {
    const result = renderMoves(
      [{ title: 'Move 1', narrativeTemplate: '{{computed.x}}% of revenue' }],
      { x: 20 },
    )
    expect(result).toEqual([{ title: 'Move 1', narrative: '20% of revenue' }])
  })
})

describe('hasLiteralDollarOrPercent', () => {
  it('flags a literal percentage', () => {
    expect(hasLiteralDollarOrPercent('20% of revenue')).toBe(true)
  })

  it('flags a literal dollar amount', () => {
    expect(hasLiteralDollarOrPercent('worth $500/yr')).toBe(true)
  })

  it('allows a token followed by a literal % formatting symbol', () => {
    expect(hasLiteralDollarOrPercent('{{computed.sharePct}}% of revenue')).toBe(false)
  })

  it('allows a token with no adjacent literal number/unit', () => {
    expect(hasLiteralDollarOrPercent('{{computed.count}} customers lapsed')).toBe(false)
  })

  it('allows plain text with no numbers at all', () => {
    expect(hasLiteralDollarOrPercent('build a VIP segment')).toBe(false)
  })
})
