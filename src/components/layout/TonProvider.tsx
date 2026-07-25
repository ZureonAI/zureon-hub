'use client'
import { TonConnectUIProvider, useTonConnectUI, useTonWallet, useTonAddress } from '@tonconnect/ui-react'
import { useEffect, useRef } from 'react'
import { useStore } from '@/lib/store'
import { getBalance } from '@/lib/tonapi'
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

  // Live balance: poll while connected so a deposit/send reflects within a few
  // seconds instead of only at connect time. Uses getBalance (toncenter-first),
  // since tonapi's testnet indexer can lag minutes behind an already-confirmed
  // deposit. Also refetches immediately when the tab regains focus (e.g. after
  // the user tops up in their wallet app and switches back).
  useEffect(() => {
    if (!wallet || !address) return
    let cancelled = false
    let lastBal: string | null = null
    const refresh = () => {
      getBalance(address)
        .then(bal => {
          // null = read failed → keep last-good (no stale fallback). Only write
          // to the store when the value actually changed, so a steady balance
          // doesn't re-render the dashboard on every poll.
          if (cancelled || bal === null || bal === lastBal) return
          lastBal = bal
          setWallet({ balanceNano: bal })
        })
        .catch(() => {})
    }
    refresh()
    const id = setInterval(refresh, 8000)
    const onFocus = () => refresh()
    window.addEventListener('focus', onFocus)
    return () => {
      cancelled = true
      clearInterval(id)
      window.removeEventListener('focus', onFocus)
    }
  }, [wallet, address, setWallet])

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
