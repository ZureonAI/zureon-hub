import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { TonProvider } from '@/components/layout/TonProvider'
import { StorageBoot } from '@/components/layout/StorageBoot'
import { DemoFrameSync } from '@/components/layout/DemoFrameSync'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  title: 'ZUREON HUB — Interactive Demo',
  description: 'AI-powered TON wallet interface. Review every transaction with Claude before signing.',
}

// viewport-fit: 'cover' lets the app draw into the iPhone Pro safe-area zones;
// ScreenLayout/BottomNav then pad by env(safe-area-inset-*) so nothing hides
// under the Dynamic Island or home indicator.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        {/*
          Hand-written, not the Metadata API's `icons`/`manifest`/`appleWebApp`
          fields — verified those do NOT get basePath-prefixed for this app
          (next.config.ts basePath: '/hub-dist') and, separately,
          `appleWebApp.capable` didn't even emit apple-mobile-web-app-capable
          at all on this Next.js version. Every path below is prefixed by
          hand instead of trusting either behavior.

          apple-mobile-web-app-capable is the actual fix for the "cramped on
          small phones" gap flagged 2026-07-12: iOS ignores the manifest's
          "display": "standalone" for Add to Home Screen without it, and
          keeps showing full Safari chrome (address bar + toolbar) even from
          a home-screen icon.
        */}
        <link rel="icon" href="/hub-dist/images/favicon.png" />
        <link rel="manifest" href="/hub-dist/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="/hub-dist/images/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ZUREON HUB" />
      </head>
      <body className={inter.className}>
        <StorageBoot />
        <DemoFrameSync />
        <ErrorBoundary>
          <TonProvider>
            {children}
          </TonProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
