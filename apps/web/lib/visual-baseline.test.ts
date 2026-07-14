import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const read = (rel: string) =>
  readFileSync(fileURLToPath(new URL(`../../../${rel}`, import.meta.url)), 'utf8')

describe('visual baseline: component classes, focus ring, fonts, contrast', () => {
  it('components.css defines the shared interactive classes with hover states', () => {
    const css = read('packages/ui/src/components.css')
    for (const sel of [
      '.ss-btn-primary:hover',
      '.ss-btn-primary:active',
      '.ss-btn-ghost:hover',
      '.ss-nav-item:hover',
      '.ss-link:hover',
      '.ss-link--muted',
    ])
      expect(css).toContain(sel)
    expect(read('packages/ui/src/styles.css')).toContain("@import './components.css'")
  })

  it('base.css uses an outline focus ring and guards reduced motion', () => {
    const css = read('packages/ui/src/tokens/base.css')
    expect(css).toContain('outline: 2px solid var(--ss-blue-500)')
    expect(css).toContain('outline-offset: 2px')
    expect(css).toContain('prefers-reduced-motion')
    expect(css).not.toContain('box-shadow: var(--focus-ring)')
  })

  it('muted token passes AA (darkened) and aliases are untouched', () => {
    const css = read('packages/ui/src/tokens/colors.css')
    expect(css).toContain('--ss-muted: #6d6455')
    expect(css).toContain('--text-muted: var(--ss-muted)')
  })

  it('layout.tsx uses next/font and no Google Fonts <link>', () => {
    const layout = read('apps/web/app/layout.tsx')
    expect(layout).toContain("from 'next/font/google'")
    expect(layout).not.toContain('fonts.googleapis.com')
    expect(layout).toContain('bootstrap-icons.min.css') // icon font must survive
  })

  it('typography tokens consume the next/font variables with fallbacks', () => {
    const css = read('packages/ui/src/tokens/typography.css')
    expect(css).toContain("var(--font-instrument-serif, 'Instrument Serif')")
    expect(css).toContain("var(--font-inter, 'Inter')")
    expect(css).toContain("var(--font-manrope, 'Manrope')")
  })
})
