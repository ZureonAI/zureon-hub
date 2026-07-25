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
        // Our claimed Genesis Artifact comes from a fresh source (get-artifacts)
        // so it shows before tonapi's laggy testnet indexer catches up; tonapi
        // supplies every other NFT. Both can return the SAME artifact — and
        // get-artifacts sometimes uses a synthetic address (when its on-chain
        // address lookup hiccups) while tonapi has the real one — so a plain
        // address dedup let the artifact appear twice. Dedup our Genesis items by
        // index instead, and prefer the entry with a real on-chain address.
        const [general, artifacts] = await Promise.all([
          getNftItems(address!).catch(() => [] as NftItem[]),
          getArtifacts(address!).catch(() => [] as NftItem[]),
        ])
        const isGenesis = (n: NftItem) =>
          n.collectionName === 'ZUREON Founders' || (n.name || '').startsWith('ZUREON Genesis Artifact')
        const isSynthetic = (a: string) => a.startsWith('zureon-artifact-')
        const byKey = new Map<string, NftItem>()
        for (const n of [...artifacts, ...general] as NftItem[]) {
          if (!n) continue
          const key = isGenesis(n) ? `genesis:${n.index}` : `addr:${n.address}`
          const existing = byKey.get(key)
          if (!existing) { byKey.set(key, n); continue }
          // Same artifact from both sources: keep the real-address version so the
          // detail link works, without adding a duplicate row.
          if (isSynthetic(existing.address) && !isSynthetic(n.address)) byKey.set(key, n)
        }
        if (!cancelled) setNfts([...byKey.values()])
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
