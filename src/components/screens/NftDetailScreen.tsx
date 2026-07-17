'use client'
import { useState, useEffect } from 'react'
import { useStore } from '@/lib/store'
import { useNFTs } from '@/hooks/useNFTs'
import { ScreenLayout } from '@/components/layout/ScreenLayout'
import { GlassCard } from '@/components/ui/GlassCard'
import Image from 'next/image'

function AddressRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <div className="flex flex-col gap-[2px]">
      <span className="text-[11px] text-outline uppercase tracking-wider">{label}</span>
      <div className="flex items-center gap-xs">
        <span className="font-mono text-[12px] text-white truncate">{value}</span>
        <button onClick={copy} aria-label={`Copy ${label.toLowerCase()}`} className="text-outline hover:text-on-surface transition-colors flex-shrink-0 p-[6px] -m-[6px]">
          <span className="material-symbols-outlined text-[14px]">{copied ? 'check' : 'content_copy'}</span>
        </button>
      </div>
    </div>
  )
}

export function NftDetailScreen() {
  const wallet = useStore(s => s.wallet)
  const { nfts, loading } = useNFTs()
  const [address, setAddress] = useState<string | null>(null)

  // Read from window.location directly — same reasoning as SendScreen: avoids
  // the useSearchParams Suspense requirement on a fully client-rendered,
  // statically-exported page. NFT addresses can't be enumerated at build
  // time the way /asset/[symbol]'s fixed token list can, so this lives at a
  // plain /nft route with the address in the query string instead of a
  // dynamic path segment.
  useEffect(() => {
    setAddress(new URLSearchParams(window.location.search).get('address'))
  }, [])

  const nft = address ? nfts.find(n => n.address === address) : undefined

  return (
    <ScreenLayout showBack backHref="/nfts">
      {!wallet.connected && (
        <GlassCard className="p-[24px] flex flex-col items-center gap-sm text-center">
          <span className="material-symbols-outlined text-outline text-[28px]">image</span>
          <div className="text-label-sm text-on-surface-variant">Connect your wallet to view this NFT.</div>
        </GlassCard>
      )}

      {wallet.connected && loading && (
        <div className="flex flex-col gap-md" aria-label="Loading NFT" aria-busy="true">
          <div className="aspect-square rounded-[16px] bg-white/[0.04] animate-pulse" />
          <div className="h-4 w-1/2 rounded bg-white/10 animate-pulse" />
        </div>
      )}

      {wallet.connected && !loading && !nft && (
        <GlassCard className="p-[24px] flex flex-col items-center gap-sm text-center">
          <span className="material-symbols-outlined text-outline text-[28px]">search_off</span>
          <div className="text-label-sm text-on-surface-variant">NFT not found in this wallet.</div>
        </GlassCard>
      )}

      {wallet.connected && !loading && nft && (
        <>
          <div className="aspect-square rounded-[16px] bg-white/[0.04] relative overflow-hidden">
            {nft.image ? (
              <Image src={nft.image} alt={nft.name} fill unoptimized className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="material-symbols-outlined text-outline text-[48px]">image</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-xs">
            <h1 className="text-headline-md text-on-surface tracking-tight">{nft.name}</h1>
            {nft.collectionName && (
              <div className="text-label-sm text-on-surface-variant">{nft.collectionName}</div>
            )}
          </div>

          <GlassCard className="rounded-xl p-md flex flex-col gap-md">
            <AddressRow label="Item address" value={nft.address} />
            {nft.collectionAddress && <AddressRow label="Collection address" value={nft.collectionAddress} />}
          </GlassCard>

          {/* Sending NFTs isn't wired up yet — same "Coming in V2" gate used
              for jetton sends in SendScreen, kept consistent rather than
              silently omitting the action. */}
          <button
            disabled
            className="w-full bg-white/5 text-on-surface-variant font-medium py-[14px] px-md rounded-xl flex items-center justify-center gap-xs opacity-50 cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[18px]">schedule</span>
            Send — Coming in V2
          </button>
        </>
      )}
    </ScreenLayout>
  )
}
