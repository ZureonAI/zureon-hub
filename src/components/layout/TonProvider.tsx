'use client'
import { TonConnectUIProvider } from '@tonconnect/ui-react'

const MANIFEST_URL = 'https://zureon.app/tonconnect-manifest.json'

export function TonProvider({ children }: { children: React.ReactNode }) {
  return (
    <TonConnectUIProvider manifestUrl={MANIFEST_URL}>
      {children}
    </TonConnectUIProvider>
  )
}
