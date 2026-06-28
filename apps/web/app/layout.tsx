import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import '@ss/ui/styles.css'
import './globals.css'

export const metadata: Metadata = {
  title: 'Simple Sense',
  description: 'The co-pilot that tells your store where to turn next.',
}

const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

export default function RootLayout({ children }: { children: ReactNode }) {
  const shell = (
    <html lang="en">
      <head>
        {/* Fonts: Instrument Serif (display) + Manrope (in-product) + Inter (UI/body). */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Manrope:wght@400..800&family=Inter:ital,wght@0,100..900;1,100..900&display=swap"
          rel="stylesheet"
        />
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
