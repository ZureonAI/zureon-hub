'use client'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { ScreenLayout } from '@/components/layout/ScreenLayout'
import { GlassCard } from '@/components/ui/GlassCard'
import { TokenIcon } from '@/components/ui/TokenIcon'
import { TxRow } from '@/components/ui/TxRow'
import { formatTon } from '@/lib/tonapi'
import { useTransactions } from '@/hooks/useTransactions'

export function AssetDetail({ symbol }: { symbol: string }) {
  const router = useRouter()
  const wallet = useStore(s => s.wallet)
  const jettons = useStore(s => s.jettons)
  const tonPriceUsd = useStore(s => s.tonPriceUsd)
  const { txs, loading: txLoading } = useTransactions(wallet.address ?? undefined)

  const isTon = symbol === 'TON'
  const jetton = !isTon ? jettons.find(j => j.symbol === symbol) : null

  const name = isTon ? 'Toncoin' : jetton?.name ?? symbol
  const balance = isTon
    ? (wallet.balanceNano ? formatTon(wallet.balanceNano) : '—')
    : (jetton ? `${jetton.balanceFormatted} ${jetton.symbol}` : '—')

  const usd = isTon && wallet.balanceNano && tonPriceUsd > 0
    ? `$${(Number(wallet.balanceNano) / 1e9 * tonPriceUsd).toFixed(2)}`
    : null

  // Only show transactions that actually involve THIS asset — real on-chain
  // data from the wallet, filtered client-side (no fabricated history).
  const assetTxs = txs.filter(tx => {
    const a = tx.actions[0]
    if (!a) return false
    if (isTon) return !!a.TonTransfer
    return a.JettonTransfer?.jetton?.symbol === symbol
  })

  return (
    <ScreenLayout showBack backHref="/dashboard">
      {/* Balance hero */}
      <GlassCard className="p-lg flex flex-col items-center gap-md">
        {isTon ? (
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center border border-primary-container/40"
            style={{ background: 'radial-gradient(circle at 30% 30%, #00D4FF33, #00D4FF0a)' }}
          >
            <span className="font-bold text-primary-container text-[22px]">TON</span>
          </div>
        ) : (
          <TokenIcon src={jetton?.image} symbol={symbol} size={64} />
        )}
        <div className="text-center">
          <div className="text-label-md text-on-surface-variant uppercase tracking-wider mb-xs">{name}</div>
          <div className="text-display text-white">{balance}</div>
          {usd && <div className="text-headline-md text-on-surface-variant mt-xs">{usd}</div>}
          {isTon && tonPriceUsd > 0 && (
            <div className="text-label-sm text-primary-container mt-sm">
              ${tonPriceUsd.toFixed(2)} / TON · live
            </div>
          )}
        </div>
      </GlassCard>

      <div className="flex gap-md">
        <button
          onClick={() => router.push('/send')}
          className="flex-1 bg-primary-container text-black text-label-md py-sm px-md rounded-xl flex items-center justify-center gap-xs active:scale-[0.96] hover:opacity-90 transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">send</span>
          Send
        </button>
        <button
          onClick={() => router.push('/receive')}
          className="flex-1 glass-card text-on-surface text-label-md py-sm px-md rounded-xl flex items-center justify-center gap-xs active:scale-[0.96] hover:bg-white/5 transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">call_received</span>
          Receive
        </button>
      </div>

      {!isTon && jetton && (
        <GlassCard className="p-md flex flex-col gap-sm">
          <div className="text-label-sm text-on-surface-variant uppercase tracking-wider">Contract</div>
          <div className="font-mono text-[11px] text-on-surface break-all">{jetton.jettonAddress}</div>
        </GlassCard>
      )}

      {/* Per-asset activity — real on-chain transactions for this token */}
      {wallet.connected && (
        <section className="flex flex-col gap-md">
          <h3 className="text-headline-md text-on-surface tracking-tight">Activity</h3>

          {txLoading && (
            <div className="flex flex-col gap-md" aria-busy="true">
              {[0, 1, 2].map(i => (
                <div key={i} className="glass-card rounded-[16px] p-[16px] flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-md">
                    <div className="w-9 h-9 rounded-full bg-white/10" />
                    <div className="flex flex-col gap-[6px]">
                      <div className="w-24 h-3 rounded bg-white/10" />
                      <div className="w-16 h-2 rounded bg-white/[0.06]" />
                    </div>
                  </div>
                  <div className="w-14 h-3 rounded bg-white/10" />
                </div>
              ))}
            </div>
          )}

          {!txLoading && assetTxs.length === 0 && (
            <div className="glass-card rounded-[16px] p-[20px] flex flex-col items-center gap-sm text-center">
              <span className="material-symbols-outlined text-outline text-[28px]">receipt_long</span>
              <div className="text-label-sm text-on-surface-variant">No {symbol} transactions yet</div>
            </div>
          )}

          {!txLoading && assetTxs.length > 0 && (
            <div className="flex flex-col gap-md">
              {assetTxs.map(tx => <TxRow key={tx.event_id} tx={tx} walletAddress={wallet.address ?? ''} />)}
            </div>
          )}
        </section>
      )}
    </ScreenLayout>
  )
}
