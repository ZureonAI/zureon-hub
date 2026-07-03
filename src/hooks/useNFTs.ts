'use client'
import { useEffect } from 'react'
import { useStore } from '@/lib/store'
import { getNftItems } from '@/lib/tonapi'

export function useNFTs() {
  const address = useStore(s => s.wallet.address)
  const connected = useStore(s => s.wallet.connected)
  const setNfts = useStore(s => s.setNfts)
  const setNftsLoading = useStore(s => s.setNftsLoading)
  const nfts = useStore(s => s.nfts)
  const loading = useStore(s => s.nftsLoading)

  useEffect(() => {
    if (!connected || !address) {
      setNfts([])
      return
    }

    let cancelled = false

    async function load() {
      setNftsLoading(true)
      try {
        const items = await getNftItems(address!)
        if (!cancelled) setNfts(items)
      } catch {
        if (!cancelled) setNfts([])
      } finally {
        if (!cancelled) setNftsLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [connected, address, setNfts, setNftsLoading])

  return { nfts, loading }
}
