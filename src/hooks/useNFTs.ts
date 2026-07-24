'use client'
import { useEffect } from 'react'
import { useStore } from '@/lib/store'
import { getNftItems, getArtifacts } from '@/lib/tonapi'
import type { NftItem } from '@/types/nft'

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

    async function load(showSpinner: boolean) {
      if (showSpinner) setNftsLoading(true)
      try {
        // Our claimed Genesis Artifact comes from a fresh source (get-artifacts);
        // tonapi supplies any other NFTs but its testnet indexer lags, so a just-
        // minted artifact would otherwise be missing. Merge, artifact(s) first,
        // dedup by address (once tonapi finally indexes ours, the dup is dropped).
        const [general, artifacts] = await Promise.all([
          getNftItems(address!).catch(() => [] as NftItem[]),
          getArtifacts(address!).catch(() => [] as NftItem[]),
        ])
        const seen = new Set<string>()
        const merged: NftItem[] = []
        for (const n of [...artifacts, ...general] as NftItem[]) {
          if (!n || seen.has(n.address)) continue
          seen.add(n.address)
          merged.push(n)
        }
        if (!cancelled) setNfts(merged)
      } catch {
        if (!cancelled && showSpinner) setNfts([])
      } finally {
        if (!cancelled && showSpinner) setNftsLoading(false)
      }
    }

    // Poll so a freshly-claimed artifact appears within seconds and tonapi's
    // slower NFTs fill in when they land; refresh on tab focus too.
    load(true)
    const id = setInterval(() => load(false), 15000)
    const onFocus = () => load(false)
    window.addEventListener('focus', onFocus)
    return () => {
      cancelled = true
      clearInterval(id)
      window.removeEventListener('focus', onFocus)
    }
  }, [connected, address, setNfts, setNftsLoading])

  return { nfts, loading }
}
