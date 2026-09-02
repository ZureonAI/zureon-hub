'use client'
import { useEffect, useState, useCallback } from 'react'
import { useStore } from '@/lib/store'
import { getJettonBalances } from '@/lib/tonapi'

export function useJettons() {
  const address = useStore(s => s.wallet.address)
  const connected = useStore(s => s.wallet.connected)
  const tonPriceUsd = useStore(s => s.tonPriceUsd)
  const setJettons = useStore(s => s.setJettons)
  const setJettonsLoading = useStore(s => s.setJettonsLoading)
  const jettons = useStore(s => s.jettons)
  const loading = useStore(s => s.jettonsLoading)
  // `error` lets the UI tell a genuinely empty wallet apart from a failed load —
  // a wallet app must never render "no tokens" when the network just hiccuped.
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const reload = useCallback(() => setReloadKey(k => k + 1), [])

  useEffect(() => {
    if (!connected || !address) {
      setJettons([])
      setError(null)
      return
    }

    let cancelled = false

    async function load() {
      setJettonsLoading(true)
      setError(null)
      try {
        const raw = await getJettonBalances(address!)
        if (cancelled) return
        // Filter out zero-balance jettons, sort by balance descending
        const filtered = raw
          .filter(j => BigInt(j.balance) > 0n)
          .sort((a, b) => {
            const aVal = Number(BigInt(a.balance)) / Math.pow(10, a.decimals)
            const bVal = Number(BigInt(b.balance)) / Math.pow(10, b.decimals)
            return bVal - aVal
          })
        setJettons(filtered)
      } catch {
        // Surface the failure instead of masking it as an empty wallet; keep any
        // previously-loaded list untouched so a poll blip doesn't wipe the view.
        if (!cancelled) setError('Could not load your tokens.')
      } finally {
        if (!cancelled) setJettonsLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [connected, address, tonPriceUsd, setJettons, setJettonsLoading, reloadKey])

  return { jettons, loading, error, reload }
}
