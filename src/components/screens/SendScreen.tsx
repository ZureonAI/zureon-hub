'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { ScreenLayout } from '@/components/layout/ScreenLayout'
import { GlassCard } from '@/components/ui/GlassCard'
import { tokenFallback } from '@/lib/token-icon-fallback'

const TON_ADDRESS_RE = /^[EU][QU][A-Za-z0-9_-]{46}$|^-?[0-9]+:[A-Fa-f0-9]{64}$/

// Jetton send requires a separate TEP-74 transfer payload — landing in V2.
// USDT/NOT shown in selector with explicit "Coming in V2" lock so users know they're on the roadmap.
const ASSETS = [
  { symbol: 'TON',  name: 'Toncoin',  logo: 'https://coin-images.coingecko.com/coins/images/17980/large/ton_symbol.png', enabled: true  },
  { symbol: 'USDT', name: 'Tether',   logo: 'https://coin-images.coingecko.com/coins/images/325/large/Tether.png',        enabled: false },
  { symbol: 'NOT',  name: 'Notcoin',  logo: 'https://assets.coingecko.com/coins/images/34982/large/notcoin.png',          enabled: false },
]

export function SendScreen() {
  const router = useRouter()
  const wallet = useStore(s => s.wallet)
  const tonPriceUsd = useStore(s => s.tonPriceUsd)
  const setPendingReview = useStore(s => s.setPendingReview)

  const [to, setTo]         = useState('')
  const [amount, setAmount] = useState('')
  const [comment, setComment] = useState('')
  const [errors, setErrors] = useState<{ to?: string; amount?: string }>({})
  const [selectedAsset, setSelectedAsset] = useState(ASSETS[0])
  const [showAssetSheet, setShowAssetSheet] = useState(false)

  // Prefill recipient from a scanned QR (ScanScreen hands off via ?to=...).
  // Read from window.location directly — avoids the useSearchParams Suspense
  // requirement on a fully client-rendered, statically-exported page.
  useEffect(() => {
    const scanned = new URLSearchParams(window.location.search).get('to')
    if (scanned) setTo(scanned)
  }, [])

  const tonBalance = wallet.balanceNano ? Number(wallet.balanceNano) / 1e9 : 0
  const amountNum = parseFloat(amount) || 0
  const amountUsd = tonPriceUsd > 0 && selectedAsset.symbol === 'TON' ? amountNum * tonPriceUsd : null
  const fee = 0.005

  function validate(): boolean {
    const e: typeof errors = {}
    if (!TON_ADDRESS_RE.test(to.trim())) e.to = 'Invalid TON address format'
    if (!amountNum || amountNum <= 0) e.amount = 'Enter an amount'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleReview() {
    if (!validate()) return
    setPendingReview({
      to: to.trim(),
      amount: String(Math.round(amountNum * 1e9)),
      amountTon: amountNum,
      amountUsd: amountUsd ?? 0,
      fee: String(Math.round(fee * 1e9)),
      feeTon: fee,
      comment: comment.trim() || undefined,
    })
    router.push('/review')
  }

  return (
    <ScreenLayout showBack backHref="/dashboard">
      {/* Screen title */}
      <div className="flex items-center gap-sm">
        <h1 className="font-semibold text-xl text-on-surface">Send Assets</h1>
      </div>

      {/* AI network hint */}
      <div className="bg-surface-variant/5 border border-surface-variant/20 rounded-xl p-3 flex items-start gap-sm">
        <span className="material-symbols-outlined text-outline-variant text-[18px] mt-0.5">info</span>
        <p className="text-xs text-outline flex-1">Network congestion is low. Expected confirmation in ~12 seconds.</p>
      </div>

      {/* Recipient */}
      <GlassCard className="rounded-xl p-md flex flex-col gap-xs">
        <div className="flex items-center justify-between">
          <label className="text-xs text-outline">Recipient Address</label>
          <button
            type="button"
            onClick={() => router.push('/scan')}
            aria-label="Scan QR code"
            className="text-primary-container active:scale-[0.92] transition-transform p-[13px] -m-[13px]"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">qr_code_scanner</span>
          </button>
        </div>
        <div className={`flex items-center gap-sm border-b-2 pb-sm transition-colors ${errors.to ? 'border-error' : 'border-surface-container focus-within:border-primary-container'}`}>
          <input
            type="text"
            value={to}
            onChange={e => { setTo(e.target.value); setErrors(p => ({ ...p, to: undefined })) }}
            placeholder="EQA... or UQA..."
            className="bg-transparent border-none outline-none w-full text-sm text-on-surface placeholder:text-outline"
          />
        </div>
        {errors.to && <span className="text-error text-xs">{errors.to}</span>}
      </GlassCard>

      {/* Asset & Amount */}
      <GlassCard className="rounded-xl p-md flex flex-col gap-md">
        {/* Asset selector */}
        <div
          onClick={() => setShowAssetSheet(true)}
          className="flex justify-between items-center bg-surface-container/30 p-3 rounded-lg border border-white/5 cursor-pointer hover:bg-surface-container/50 transition-colors"
        >
          <div className="flex items-center gap-sm">
            <img src={selectedAsset.logo} alt={selectedAsset.symbol} className="w-8 h-8 rounded-full object-cover" onError={e => tokenFallback(e, selectedAsset.symbol)} />
            <div>
              <div className="text-sm font-medium text-on-surface">{selectedAsset.symbol}</div>
              <div className="text-xs text-outline">{selectedAsset.name}</div>
            </div>
          </div>
          <span className="material-symbols-outlined text-outline text-[20px]">expand_more</span>
        </div>

        {/* Amount */}
        <div>
          <label className="text-xs text-outline mb-xs block">Amount</label>
          <div className="flex items-baseline gap-sm">
            <input
              type="number"
              value={amount}
              onChange={e => { setAmount(e.target.value); setErrors(p => ({ ...p, amount: undefined })) }}
              placeholder="0"
              className="bg-transparent border-none outline-none text-4xl font-semibold text-on-surface w-2/3 placeholder:text-outline/40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-lg text-outline">{selectedAsset.symbol}</span>
          </div>
          {amountUsd !== null && amountNum > 0 && (
            <span className="text-xs text-outline">≈ ${amountUsd.toFixed(2)} USD</span>
          )}
          {errors.amount && <span className="text-error text-xs block mt-xs">{errors.amount}</span>}
        </div>

        {/* Memo */}
        <div className="flex flex-col gap-xs">
          <label className="text-xs text-outline">Memo <span className="text-outline/50">(optional)</span></label>
          <input
            type="text"
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Add a note"
            maxLength={120}
            className="bg-surface-container/30 border border-white/5 rounded-lg px-sm py-xs text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary-container/40"
          />
        </div>
      </GlassCard>

      {/* Transaction preview */}
      <GlassCard className="rounded-xl p-md flex flex-col gap-2">
        <div className="flex justify-between">
          <span className="text-on-surface-variant text-sm">You send:</span>
          <span className="text-white text-sm font-medium">{amountNum > 0 ? `${amountNum} ${selectedAsset.symbol}` : '—'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-on-surface-variant text-sm">To:</span>
          <span className="text-white text-sm font-medium font-mono">{to ? `${to.slice(0, 6)}...${to.slice(-4)}` : '—'}</span>
        </div>
        <div className="h-px w-full bg-white/5 my-1" />
        <div className="flex justify-between">
          <span className="text-on-surface-variant text-sm">Network fee:</span>
          <span className="text-primary-container text-sm font-medium">~{fee} TON</span>
        </div>
      </GlassCard>

      {/* Remaining balance hint */}
      {amountNum > 0 && selectedAsset.symbol === 'TON' && (
        <div className="bg-surface-variant/5 border border-surface-variant/20 rounded-xl p-3 flex items-start gap-sm">
          <span className="material-symbols-outlined text-outline text-[18px] mt-0.5">account_balance_wallet</span>
          <p className="text-xs text-outline flex-1">
            After this transaction you&apos;ll have ~{Math.max(0, tonBalance - amountNum - fee).toFixed(4)} TON remaining.
          </p>
        </div>
      )}

      {/* Action */}
      <button
        onClick={handleReview}
        disabled={!wallet.connected}
        className="w-full bg-primary-container text-black font-medium py-[14px] px-md rounded-xl flex items-center justify-center gap-xs active:scale-[0.96] hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_10px_rgba(0,212,255,0.08)]"
      >
        Review with AI &amp; Sign
        <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
      </button>

      {!wallet.connected && (
        <p className="text-center text-xs text-outline">Connect your wallet first to send.</p>
      )}

      {/* Asset selector bottom sheet */}
      {showAssetSheet && (
        <div className="fixed inset-0 z-[100]" onClick={() => setShowAssetSheet(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div
            className="absolute bottom-0 left-0 right-0 bg-[#1e1e1e] border-t border-white/10 rounded-t-3xl p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-6" />
            <h3 className="text-base font-semibold text-on-surface mb-4">Select Asset</h3>
            <div className="flex flex-col gap-2">
              {ASSETS.map(asset => (
                <button
                  key={asset.symbol}
                  onClick={() => {
                    if (!asset.enabled) return
                    setSelectedAsset(asset); setShowAssetSheet(false)
                  }}
                  disabled={!asset.enabled}
                  className={`flex items-center gap-sm p-3 rounded-xl transition-colors ${
                    !asset.enabled
                      ? 'bg-white/[0.02] border border-white/5 opacity-50 cursor-not-allowed'
                      : selectedAsset.symbol === asset.symbol
                        ? 'bg-primary-container/10 border border-primary-container/30'
                        : 'bg-white/5 border border-white/5 hover:bg-white/10'
                  }`}
                >
                  <img src={asset.logo} alt={asset.symbol} className="w-9 h-9 rounded-full object-cover" onError={e => tokenFallback(e, asset.symbol)} />
                  <div className="text-left flex-1 min-w-0">
                    <div className="text-sm font-medium text-on-surface">{asset.symbol}</div>
                    <div className="text-xs text-outline">{asset.name}</div>
                  </div>
                  {!asset.enabled ? (
                    <span className="ml-auto text-[10px] font-bold uppercase tracking-wider px-2 py-[3px] rounded-full bg-white/5 text-on-surface-variant border border-white/10">
                      V2
                    </span>
                  ) : selectedAsset.symbol === asset.symbol ? (
                    <span className="material-symbols-outlined text-primary-container ml-auto text-[18px]">check</span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </ScreenLayout>
  )
}
