import type { ReactNode } from 'react'
import './marketing.css'
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
