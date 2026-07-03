'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { useSwapQuote } from '@/hooks/useSwapQuote'
import { ScreenLayout } from '@/components/layout/ScreenLayout'
import { GlassCard } from '@/components/ui/GlassCard'
import { TON_ADDR, formatRate, parsePriceImpact } from '@/lib/stonfi'
import { SWAP_GAS_TON, USDT_ADDR } from '@/lib/constants'
import { buildSwapPendingReview } from '@/lib/stonfi-builder'

const NOT_ADDR = 'EQAvlWFDxGF2lXm67y4yzC17wYKD9A0guwPkMs1gOsM__NOT'

const BETA_ASSETS = [
  { contractAddress: TON_ADDR,  symbol: 'TON',  name: 'Toncoin', decimals: 9, logo: 'https://coin-images.coingecko.com/coins/images/17980/large/ton_symbol.png' },
  { contractAddress: USDT_ADDR, symbol: 'USDT', name: 'Tether',  decimals: 6, logo: 'https://coin-images.coingecko.com/coins/images/325/large/Tether.png' },
  { contractAddress: NOT_ADDR,  symbol: 'NOT',  name: 'Notcoin', decimals: 9, logo: 'https://assets.coingecko.com/coins/images/34982/large/notcoin.png' },
]

const TOKEN_COLORS: Record<string, string> = { TON: '00D4FF', USDT: '26A17B', NOT: 'F7B900' }
function tokenFallback(e: React.SyntheticEvent<HTMLImageElement>, symbol: string) {
  const c = TOKEN_COLORS[symbol] || '888888'
  const s = encodeURIComponent(symbol.slice(0, 3))
  e.currentTarget.onerror = null
  e.currentTarget.src = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><circle cx='16' cy='16' r='16' fill='%23${c}'/><text x='16' y='21' text-anchor='middle' font-size='11' font-weight='700' fill='white' font-family='sans-serif'>${s}</text></svg>`
}

export function SwapScreen() {
  const router     = useRouter()
  const wallet     = useStore(s => s.wallet)
  const tonPriceUsd = useStore(s => s.tonPriceUsd)
  const setPendingReview = useStore(s => s.setPendingReview)
  const { quote, loading: quoteLoading, error: quoteError, fetch: fetchQuote, reset } = useSwapQuote()

  const [fromSymbol, setFromSymbol] = useState('TON')
  const [toSymbol, setToSymbol] = useState('USDT')
  const [fromAmount, setFromAmount] = useState('')
  const [showFromSheet, setShowFromSheet] = useState(false)
  const [showToSheet, setShowToSheet] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fromAsset = BETA_ASSETS.find(a => a.symbol === fromSymbol) ?? BETA_ASSETS[0]
  const toAsset   = BETA_ASSETS.find(a => a.symbol === toSymbol)   ?? BETA_ASSETS[1]

  const amount = parseFloat(fromAmount) || 0
  const offerUnits = amount > 0 ? String(Math.round(amount * Math.pow(10, fromAsset.decimals))) : ''

  useEffect(() => {
    if (!offerUnits || amount <= 0) { reset(); return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchQuote({
        offerAddress: fromAsset.contractAddress,
        askAddress:   toAsset.contractAddress,
        offerUnits,
      })
    }, 600)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [offerUnits, fromAsset.contractAddress, toAsset.contractAddress])

  const receiveAmount = quote
    ? (Number(quote.askUnits) / Math.pow(10, toAsset.decimals)).toFixed(4)
    : '—'

  const impactLevel = quote ? parsePriceImpact(quote.priceImpact) : null
  const impactColor = impactLevel === 'low' ? 'text-primary-container' : impactLevel === 'medium' ? 'text-yellow-400' : 'text-error'

  function flipAssets() {
    const a = fromSymbol; const b = toSymbol
    setFromSymbol(b); setToSymbol(a); setFromAmount(''); reset()
  }

  function handleSwapSubmit() {
    if (!quote || !wallet.connected) return
    const toAmount = Number(quote.askUnits)    / Math.pow(10, toAsset.decimals)
    const minHuman = (Number(quote.minAskUnits) / Math.pow(10, toAsset.decimals)).toFixed(4)
    setPendingReview(buildSwapPendingReview({
      fromSymbol,
      toSymbol,
      fromAmount:          amount,
      toAmount,
      minReceivedHuman:    minHuman,
      priceImpact:         quote.priceImpact,
      feePercent:          quote.feePercent,
      fromContractAddress: fromAsset.contractAddress,
      toContractAddress:   toAsset.contractAddress,
      offerUnits,
      minAskUnits:         quote.minAskUnits,
      tonPriceUsd,
    }))
    router.push('/review')
  }

  const AssetSheet = ({ visible, onClose, onSelect, exclude }: { visible: boolean; onClose: () => void; onSelect: (s: string) => void; exclude: string }) => {
    if (!visible) return null
    return (
      <div className="fixed inset-0 z-[100]" onClick={onClose}>
        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute bottom-0 left-0 right-0 bg-[#1e1e1e] border-t border-white/10 rounded-t-3xl p-6" onClick={e => e.stopPropagation()}>
          <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-6" />
          <h3 className="text-base font-semibold text-on-surface mb-4">Select Token</h3>
          <div className="flex flex-col gap-2">
            {BETA_ASSETS.filter(a => a.symbol !== exclude).map(a => (
              <button key={a.symbol} onClick={() => { onSelect(a.symbol); onClose() }}
                className="flex items-center gap-sm p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors text-left">
                <img src={a.logo} alt={a.symbol} className="w-8 h-8 rounded-full object-cover" onError={e => tokenFallback(e, a.symbol)} />
                <div>
                  <div className="text-sm font-medium text-on-surface">{a.symbol}</div>
                  <div className="text-xs text-outline">{a.name}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <ScreenLayout showBack backHref="/dashboard">
      {/* Screen title */}
      <h1 className="text-2xl font-semibold text-on-surface">Swap</h1>

      {/* Swap card */}
      <GlassCard className="rounded-xl p-md flex flex-col gap-xs relative">
        {/* You Pay */}
        <div className="bg-surface-container/30 p-4 rounded-xl border border-white/5">
          <div className="text-xs text-outline mb-2">You Pay</div>
          <div className="flex items-center gap-sm">
            <button
              onClick={() => setShowFromSheet(true)}
              className="flex items-center gap-xs bg-surface-container/50 px-3 py-2 rounded-lg border border-white/5 hover:bg-surface-container/80 transition-colors flex-shrink-0"
            >
              <img src={fromAsset.logo} alt={fromSymbol} className="w-6 h-6 rounded-full object-cover" onError={e => tokenFallback(e, fromSymbol)} />
              <span className="text-sm font-semibold text-on-surface">{fromSymbol}</span>
              <span className="material-symbols-outlined text-outline text-[16px]">expand_more</span>
            </button>
            <input
              type="text"
              inputMode="decimal"
              value={fromAmount}
              onChange={e => {
                const v = e.target.value.replace(/[^0-9.]/g, '')
                if ((v.match(/\./g) || []).length <= 1) setFromAmount(v)
              }}
              placeholder="0.00"
              className="bg-transparent border-none outline-none flex-1 min-w-0 text-2xl font-semibold text-on-surface placeholder:text-outline/40 text-right"
            />
          </div>
          {fromSymbol === 'TON' && tonPriceUsd > 0 && amount > 0 && (
            <div className="text-xs text-outline mt-1 text-right">≈ ${(amount * tonPriceUsd).toFixed(2)}</div>
          )}
        </div>

        {/* Circular direction toggle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <button
            onClick={flipAssets}
            className="w-10 h-10 bg-[#141414] border-4 border-[#0a0a0a] rounded-full flex items-center justify-center hover:bg-[#1e1e1e] active:scale-90 transition-all shadow-[0_0_10px_rgba(0,212,255,0.1)]"
          >
            <span className="material-symbols-outlined text-primary-container text-[18px]">swap_vert</span>
          </button>
        </div>

        {/* You Receive */}
        <div className="bg-surface-container/30 p-4 rounded-xl border border-white/5 mt-2">
          <div className="text-xs text-outline mb-2">You Receive</div>
          <div className="flex items-center gap-sm">
            <button
              onClick={() => setShowToSheet(true)}
              className="flex items-center gap-xs bg-surface-container/50 px-3 py-2 rounded-lg border border-white/5 hover:bg-surface-container/80 transition-colors flex-shrink-0"
            >
              <img src={toAsset.logo} alt={toSymbol} className="w-6 h-6 rounded-full object-cover" onError={e => tokenFallback(e, toSymbol)} />
              <span className="text-sm font-semibold text-on-surface">{toSymbol}</span>
              <span className="material-symbols-outlined text-outline text-[16px]">expand_more</span>
            </button>
            <div className="flex-1 text-right text-2xl font-semibold text-on-surface">
              {quoteLoading
                ? <span className="text-on-surface-variant animate-pulse text-base">calculating...</span>
                : receiveAmount}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Rate rows */}
      <div className="px-2 flex flex-col gap-2">
        <div className="flex justify-between">
          <span className="text-xs text-outline">Rate</span>
          <span className="text-xs text-on-surface">
            {quote ? formatRate(quote.swapRate, fromSymbol, toSymbol) : `1 ${fromSymbol} = — ${toSymbol}`}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-xs text-outline">Network fee</span>
          <span className="text-xs text-on-surface">
            {tonPriceUsd > 0
              ? `~$${(SWAP_GAS_TON * tonPriceUsd).toFixed(2)}`
              : `~${SWAP_GAS_TON} TON`}
          </span>
        </div>
        {quote && (
          <div className="flex justify-between">
            <span className="text-xs text-outline">Price impact</span>
            <span className={`text-xs ${impactColor}`}>{parseFloat(quote.priceImpact).toFixed(2)}%</span>
          </div>
        )}
      </div>

      {/* Swap info */}
      <div className="bg-surface-variant/5 border border-surface-variant/20 rounded-xl p-3 flex items-start gap-sm">
        <span className="material-symbols-outlined text-outline text-[18px] mt-0.5">info</span>
        <p className="text-xs text-outline flex-1">
          {quote
            ? `Min received: ${(Number(quote.minAskUnits) / Math.pow(10, toAsset.decimals)).toFixed(4)} ${toSymbol}. Route via STON.fi · Beta · 3 pairs.`
            : 'Enter an amount to see the live rate from STON.fi. Beta · 3 pairs (TON/USDT/NOT).'}
        </p>
      </div>

      {quoteError && (
        <p className="text-error text-xs px-sm">{quoteError}</p>
      )}

      {/* Action */}
      <div className="flex flex-col gap-xs">
        <button
          disabled
          className="w-full bg-surface-container/40 text-on-surface-variant font-medium py-[14px] px-md rounded-xl flex items-center justify-center gap-xs cursor-not-allowed border border-white/5"
        >
          <span className="material-symbols-outlined text-[18px]">schedule</span>
          Swap — Coming in V2
        </button>
        <p className="text-[11px] text-on-surface-variant/50 text-center">
          DEX swaps are in development. Send &amp; Receive work on testnet now.
        </p>
      </div>

      {/* Asset sheets */}
      <AssetSheet visible={showFromSheet} onClose={() => setShowFromSheet(false)} onSelect={s => { setFromSymbol(s); reset() }} exclude={toSymbol} />
      <AssetSheet visible={showToSheet} onClose={() => setShowToSheet(false)} onSelect={s => { setToSymbol(s); reset() }} exclude={fromSymbol} />
    </ScreenLayout>
  )
}
