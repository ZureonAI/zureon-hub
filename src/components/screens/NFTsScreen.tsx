'use client'
import { useStore } from '@/lib/store'
import { useNFTs } from '@/hooks/useNFTs'
import { useTonConnectUI } from '@tonconnect/ui-react'
import { ScreenLayout } from '@/components/layout/ScreenLayout'
import { GlassCard } from '@/components/ui/GlassCard'
import { NftCard } from '@/components/ui/NftCard'

export function NFTsScreen() {
  const wallet = useStore(s => s.wallet)
  const { nfts, loading } = useNFTs()
  const [tonConnectUI] = useTonConnectUI()

  return (
    <ScreenLayout showBack backHref="/dashboard">
      <div className="flex flex-col gap-xs">
        <h1 className="text-2xl font-semibold text-on-surface">NFT Gallery</h1>
        <p className="text-label-sm text-on-surface-variant">
          NFTs held in your wallet, read directly from the TON blockchain.
        </p>
      </div>

      {!wallet.connected && (
        <GlassCard className="p-[24px] flex flex-col items-center gap-md text-center">
          <div className="w-12 h-12 rounded-full bg-primary-container/15 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary-container text-[24px]">image</span>
          </div>
          <div className="flex flex-col gap-xs">
            <div className="text-label-md text-white">No wallet connected</div>
            <div className="text-label-sm text-on-surface-variant max-w-[280px]">
              Connect your TON wallet to see the NFTs you hold.
            </div>
          </div>
          <button
            onClick={() => { if (!tonConnectUI.connected) tonConnectUI.openModal() }}
            className="w-full bg-primary-container text-black font-medium py-[14px] px-md rounded-xl flex items-center justify-center gap-xs active:scale-[0.96] hover:opacity-90 transition-all shadow-[0_0_10px_rgba(0,212,255,0.08)]"
          >
            <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
            Connect TON Wallet
          </button>
        </GlassCard>
      )}

      {wallet.connected && loading && (
        <div className="grid grid-cols-2 gap-md" aria-label="Loading NFTs" aria-busy="true">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="glass-card rounded-[16px] aspect-square animate-pulse bg-white/[0.04]" />
          ))}
        </div>
      )}

      {wallet.connected && !loading && nfts.length === 0 && (
        <GlassCard className="p-[24px] flex flex-col items-center gap-sm text-center">
          <span className="material-symbols-outlined text-outline text-[28px]">image</span>
          <div className="text-label-sm text-on-surface-variant">No NFTs in this wallet yet</div>
        </GlassCard>
      )}

      {wallet.connected && !loading && nfts.length > 0 && (
        <div className="grid grid-cols-2 gap-md">
          {nfts.map(n => <NftCard key={n.address} nft={n} />)}
        </div>
      )}
    </ScreenLayout>
  )
}
