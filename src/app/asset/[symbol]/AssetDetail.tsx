'use client'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { ScreenLayout } from '@/components/layout/ScreenLayout'
import { GlassCard } from '@/components/ui/GlassCard'
import { TokenIcon } from '@/components/ui/TokenIcon'
import { formatTon } from '@/lib/tonapi'

export function AssetDetail({ symbol }: { symbol: string }) {
  const router = useRouter()
  const wallet = useStore(s => s.wallet)
  const jettons = useStore(s => s.jettons)
  const tonPriceUsd = useStore(s => s.tonPriceUsd)

  const isTon = symbol === 'TON'
  const jetton = !isTon ? jettons.find(j => j.symbol === symbol) : null

  const name = isTon ? 'Toncoin' : jetton?.name ?? symbol
  const balance = isTon
    ? (wallet.balanceNano ? formatTon(wallet.balanceNano) : '—')
    : (jetton ? `${jetton.balanceFormatted} ${jetton.symbol}` : '—')

  const usd = isTon && wallet.balanceNano && tonPriceUsd > 0
    ? `$${(Number(wallet.balanceNano) / 1e9 * tonPriceUsd).toFixed(2)}`
    : null

  return (
    <ScreenLayout showBack backHref="/dashboard">
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
    </ScreenLayout>
  )
}
