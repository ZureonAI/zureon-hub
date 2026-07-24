'use client'
import { TonConnectUIProvider, useTonConnectUI, useTonWallet, useTonAddress } from '@tonconnect/ui-react'
import { useEffect, useRef } from 'react'
import { useStore } from '@/lib/store'
import { getAccount } from '@/lib/tonapi'
import { reportConnect, chainToNetwork } from '@/lib/track'
import { ArtifactClaimGate } from '@/components/artifact/ArtifactClaimGate'

const MANIFEST_URL = 'https://zureon.app/tonconnect-manifest.json'

// Bridges the TonConnect SDK <-> our Zustand store, and surfaces bridge errors.
//
// CRITICAL: this must live inside TonProvider (always mounted), NOT inside a
// screen-level component. Previously the only place that synced the store was
// <WalletButton>, which was never actually rendered anywhere — so the wallet
// would connect at the SDK level but `store.wallet.connected` stayed false
// forever, leaving every screen stuck on "No wallet connected".
function WalletBridge() {
  const [tonConnectUI] = useTonConnectUI()
  const wallet = useTonWallet()
  const address = useTonAddress()
  const setWallet = useStore(s => s.setWallet)
  const setConnectError = useStore(s => s.setConnectError)

  // Only report each distinct connected address once per session — the effect
  // below re-runs on unrelated re-renders, and the KPI endpoint is deduped
  // server-side anyway, so this just avoids needless requests.
  const reportedAddress = useRef<string | null>(null)

  // Sync SDK connection state into the global store on every change.
  useEffect(() => {
    if (wallet && address) {
      const walletName = (wallet as { device?: { appName?: string } }).device?.appName ?? null
      setWallet({ connected: true, address, walletName, balanceNano: null })
      setConnectError(null)
      getAccount(address)
        .then(acc => setWallet({ balanceNano: acc.balance }))
        .catch(() => {})

      // KPI metric: unique wallet connection. Fire-and-forget, never blocks UX.
      if (reportedAddress.current !== address) {
        reportedAddress.current = address
        const chain = (wallet as { account?: { chain?: string } }).account?.chain
        reportConnect(address, chainToNetwork(chain))
      }
    } else {
      setWallet({ connected: false, address: null, walletName: null, balanceNano: null })
      reportedAddress.current = null
    }
  }, [wallet, address, setWallet, setConnectError])

  // Surface bridge/connection failures as a readable message instead of a hang.
  useEffect(() => {
    const unsubscribe = tonConnectUI.onStatusChange(
      (w) => { if (w) setConnectError(null) },
      (err) => {
        console.error('[TonConnect] connection error:', err)
        setConnectError('Could not reach the wallet. Its bridge server may be down — try a different wallet or try again shortly.')
      }
    )
    return unsubscribe
  }, [tonConnectUI, setConnectError])

  return null
}

export function TonProvider({ children }: { children: React.ReactNode }) {
  return (
    <TonConnectUIProvider manifestUrl={MANIFEST_URL}>
      <WalletBridge />
      {children}
      <ArtifactClaimGate />
    </TonConnectUIProvider>
  )
}
