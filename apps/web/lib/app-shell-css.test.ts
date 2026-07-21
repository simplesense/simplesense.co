import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

const css = readFileSync(new URL('../app/app-shell.css', import.meta.url), 'utf8')

describe('app-shell.css responsive contract', () => {
  it('has exactly one 900px breakpoint block', () => {
    expect(css.match(/@media \(max-width: 900px\)/g)).toHaveLength(1)
  })

  it('references layout tokens instead of hardcoding shell dimensions', () => {
    expect(css).toContain('var(--sidebar-width)')
    expect(css).toContain('var(--topbar-height)')
    expect(css).toContain('var(--container-max)')
    expect(css).not.toContain('16.5rem')
    expect(css).not.toContain('1500')
  })

  it('defines the previously-missing .ss-nav-item hover state', () => {
    expect(css).toContain('.ss-nav-item:hover')
  })

  it('collapses to an icon rail and single-column move grid under the breakpoint', () => {
    const mobile = css.slice(css.indexOf('@media (max-width: 900px)'))
    expect(mobile).toContain('width: 56px')
    expect(mobile).toMatch(/\.ss-nav-label\s*\{\s*display: none/)
    expect(mobile).toMatch(/\.ss-move-grid\s*\{\s*grid-template-columns: minmax\(0, 1fr\)/)
    expect(mobile).toMatch(/\.ss-move-rail\s*\{\s*position: static/)
  })
})
