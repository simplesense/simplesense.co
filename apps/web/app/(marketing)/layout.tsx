import type { ReactNode } from 'react'
import './marketing.css'
// Loaded AFTER marketing.css on purpose: where the two define the same class, the new
// design system wins, while the ~70 classes only marketing.css defines (audit-sample,
// reads, section, price-card, scan-*, intake-*, legal-*) keep working on pages not yet
// converted. marketing.css goes away once every page is on the new system.
import './design-system.css'
import { MarketingNav, MarketingFooter } from '@/components/marketing-chrome'

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="page">
      <MarketingNav />
      {children}
      <MarketingFooter />
    </div>
  )
}
