'use client'
import { useEffect, useState, useCallback } from 'react'
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
  // `error` distinguishes a genuinely empty gallery from a load failure, so the
  // UI never claims "no NFTs" when both data sources were merely unreachable.
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const reload = useCallback(() => setReloadKey(k => k + 1), [])

  useEffect(() => {
    if (!connected || !address) {
      setNfts([])
      setError(null)
      return
    }

    let cancelled = false

    async function load(showSpinner: boolean) {
      if (showSpinner) { setNftsLoading(true); setError(null) }
      try {
        // Our claimed Genesis Artifact comes from a fresh source (get-artifacts)
        // so it shows before tonapi's laggy testnet indexer catches up; tonapi
        // supplies every other NFT. Both can return the SAME artifact — and
        // get-artifacts sometimes uses a synthetic address (when its on-chain
        // address lookup hiccups) while tonapi has the real one — so a plain
        // address dedup let the artifact appear twice. Dedup our Genesis items by
        // index instead, and prefer the entry with a real on-chain address.
        //
        // Track each source's success so we can tell "both sources returned
        // nothing" (genuinely empty) from "both sources FAILED" (network error):
        // the latter must surface an error + retry, not a false "no NFTs".
        const [generalRes, artifactsRes] = await Promise.all([
          getNftItems(address!).then(d => ({ ok: true, data: d })).catch(() => ({ ok: false, data: [] as NftItem[] })),
          getArtifacts(address!).then(d => ({ ok: true, data: d })).catch(() => ({ ok: false, data: [] as NftItem[] })),
        ])
        if (cancelled) return
        if (!generalRes.ok && !artifactsRes.ok) {
          // Every source failed — don't overwrite a last-good list with empty.
          if (showSpinner) setError('Could not load your NFTs.')
          return
        }
        const isGenesis = (n: NftItem) =>
          n.collectionName === 'ZUREON Founders' || (n.name || '').startsWith('ZUREON Genesis Artifact')
        const isSynthetic = (a: string) => a.startsWith('zureon-artifact-')
        const byKey = new Map<string, NftItem>()
        for (const n of [...artifactsRes.data, ...generalRes.data] as NftItem[]) {
          if (!n) continue
          const key = isGenesis(n) ? `genesis:${n.index}` : `addr:${n.address}`
          const existing = byKey.get(key)
          if (!existing) { byKey.set(key, n); continue }
          // Same artifact from both sources: keep the real-address version so the
          // detail link works, without adding a duplicate row.
          if (isSynthetic(existing.address) && !isSynthetic(n.address)) byKey.set(key, n)
        }
        setNfts([...byKey.values()])
        setError(null)
      } catch {
        if (!cancelled && showSpinner) setError('Could not load your NFTs.')
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
  }, [connected, address, setNfts, setNftsLoading, reloadKey])

  return { nfts, loading, error, reload }
}
