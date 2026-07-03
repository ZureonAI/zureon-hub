'use client'
import { useEffect } from 'react'
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

  useEffect(() => {
    if (!connected || !address) {
      setJettons([])
      return
    }

    let cancelled = false

    async function load() {
      setJettonsLoading(true)
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
        if (!cancelled) setJettons([])
      } finally {
        if (!cancelled) setJettonsLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [connected, address, tonPriceUsd, setJettons, setJettonsLoading])

  return { jettons, loading }
}
