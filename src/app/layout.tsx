import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { TonProvider } from '@/components/layout/TonProvider'
import { StorageBoot } from '@/components/layout/StorageBoot'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  title: 'ZUREON HUB — Interactive Demo',
  description: 'AI-powered TON wallet interface. Review every transaction with Claude before signing.',
  icons: {
    icon: '/images/favicon.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={inter.className}>
        <StorageBoot />
        <ErrorBoundary>
          <TonProvider>
            {children}
          </TonProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
