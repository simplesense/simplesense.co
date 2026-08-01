import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Newsreader, Public_Sans } from 'next/font/google'
import '@ss/ui/styles.css'
import './globals.css'
import './app-shell.css'

// Design system (2026-08-01 rebrand): Newsreader for editorial display, Public Sans for
// everything functional. Both are variable fonts, so no explicit weight list is needed.
// The token NAMES in packages/ui/src/tokens/typography.css are unchanged, so every
// component already consuming var(--font-display)/var(--font-sans) picks these up.
const newsreader = Newsreader({
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-newsreader',
  display: 'swap',
})
const publicSans = Public_Sans({
  subsets: ['latin'],
  variable: '--font-public-sans',
  display: 'swap',
})

const DESCRIPTION =
  'Simple Sense reads your whole Shopify store and tells you the few moves to make this week — what to do, why, and the dollar impact. Every number earned from your own data.'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? 'https://simplesense.co'),
  title: {
    default: 'Simple Sense — the prescriptive operator brain for e-commerce',
    template: '%s · Simple Sense',
  },
  description: DESCRIPTION,
  openGraph: {
    type: 'website',
    siteName: 'Simple Sense',
    title: 'Simple Sense — stop drowning in data, start executing',
    description: DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Simple Sense — stop drowning in data, start executing',
    description: DESCRIPTION,
  },
}

const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

export default function RootLayout({ children }: { children: ReactNode }) {
  const shell = (
    <html lang="en" className={`${newsreader.variable} ${publicSans.variable}`}>
      <head>
        {/* Bootstrap Icons webfont (vendored locally under /public). */}
        <link rel="stylesheet" href="/vendor/bootstrap-icons/font/bootstrap-icons.min.css" />
      </head>
      <body>{children}</body>
    </html>
  )
  return hasClerk ? (
    <ClerkProvider signUpForceRedirectUrl="/onboarding" signInForceRedirectUrl="/app">
      {shell}
    </ClerkProvider>
  ) : (
    shell
  )
}
