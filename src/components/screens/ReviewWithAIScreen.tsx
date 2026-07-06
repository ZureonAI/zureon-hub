'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTonConnectUI, CHAIN } from '@tonconnect/ui-react'
import { beginCell } from '@ton/core'
import { useStore } from '@/lib/store'
import { useAIReview } from '@/hooks/useAIReview'
import { buildSwapMessages } from '@/lib/stonfi-builder'
import { GlassCard } from '@/components/ui/GlassCard'
import { ConfirmationScreen } from '@/components/screens/ConfirmationScreen'
import type { TxResult } from '@/types/ton'

export function ReviewWithAIScreen() {
  const router = useRouter()
  const [tonConnectUI]   = useTonConnectUI()
  const pendingReview    = useStore(s => s.pendingReview)
  const setPendingReview = useStore(s => s.setPendingReview)
  const tonPriceUsd      = useStore(s => s.tonPriceUsd)
  const wallet           = useStore(s => s.wallet)
  const { response, loading, error, slow, review } = useAIReview()

  const [txResult,        setTxResult]        = useState<TxResult | null>(null)
  const [signing,         setSigning]          = useState(false)
  const [signError,       setSignError]        = useState<string | null>(null)
  const [confirmReal,     setConfirmReal]      = useState(false) // irreversible-transaction double-confirm (testnet)
  const signingRef = useRef(false)

  useEffect(() => {
    if (pendingReview) review(pendingReview)
  }, []) // run once on mount

  async function handleSign() {
    // Require explicit confirmation before signing (irreversible on-chain action)
    if (!confirmReal) {
      setConfirmReal(true)
      return
    }

    if (!pendingReview || signingRef.current) return
    signingRef.current = true
    setSigning(true)
    setSignError(null)
    try {
      const isSwapTx = pendingReview.txType === 'swap'
      const sd = pendingReview.swapDetails

      let messages: Array<{ address: string; amount: string; payload?: string }>

      if (isSwapTx && sd) {
        if (!wallet.address) throw new Error('Wallet not connected')
        messages = await buildSwapMessages({
          fromContractAddress: sd.fromContractAddress,
          toContractAddress:   sd.toContractAddress,
          offerUnits:          sd.offerUnits,
          minAskUnits:         sd.minAskUnits,
          userAddress:         wallet.address,
        })
      } else {
        messages = [{
          address: pendingReview.to,
          amount:  String(Math.round(pendingReview.amountTon * 1e9)),
          ...(pendingReview.comment
            ? { payload: buildCommentPayload(pendingReview.comment) }
            : {}),
        }]
      }

      const result = await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 360,
        network: CHAIN.TESTNET,
        messages,
      })
      setTxResult({
        boc:         result.boc,
        txType:      pendingReview.txType || 'send',
        toAddress:   pendingReview.to,
        amountTon:   pendingReview.amountTon,
        swapDetails: pendingReview.swapDetails,
        timestamp:   Date.now(),
      })
      setPendingReview(null)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      if (!msg.toLowerCase().includes('reject') && !msg.toLowerCase().includes('cancel')) {
        setSignError(msg.length < 120 ? msg : 'Transaction failed. Please try again.')
      }
    } finally {
      signingRef.current = false
      setSigning(false)
    }
  }

  if (txResult) {
    return (
      <ConfirmationScreen
        result={txResult}
        onDone={() => router.push('/dashboard')}
      />
    )
  }

  const isSwap  = pendingReview?.txType === 'swap'
  const sd      = pendingReview?.swapDetails
  const usdValue = pendingReview && tonPriceUsd > 0
    ? `~$${(pendingReview.amountTon * tonPriceUsd).toFixed(2)}`
    : null

  return (
    <div className="bg-black text-on-surface min-h-screen flex flex-col font-sans antialiased">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 flex items-center gap-md px-6 h-[60px] bg-black/80 backdrop-blur-2xl border-b border-white/10">
        <button
          onClick={() => router.back()}
          aria-label="Go back"
          className="text-on-surface-variant hover:text-on-surface transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex items-center gap-sm">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="16" cy="16" rx="12" ry="5.5" stroke="#00D4FF" strokeWidth="1.2" opacity="0.9"/>
            <ellipse cx="16" cy="16" rx="12" ry="5.5" stroke="#00D4FF" strokeWidth="1.2" opacity="0.9" transform="rotate(60 16 16)"/>
            <ellipse cx="16" cy="16" rx="12" ry="5.5" stroke="#00D4FF" strokeWidth="1.2" opacity="0.9" transform="rotate(120 16 16)"/>
            <text x="16" y="20.5" fontFamily="Inter, system-ui, sans-serif" fontSize="9" fontWeight="700" fill="#00D4FF" textAnchor="middle" letterSpacing="0.5">Z</text>
          </svg>
          <div>
            <div className="text-label-md font-semibold text-white">
              {isSwap ? 'Review Swap with AI' : 'Review with AI'}
            </div>
            <div className="text-[10px] text-on-surface-variant">Powered by Claude</div>
          </div>
        </div>
      </header>

      <main className="pt-[80px] pb-[120px] px-[16px] flex flex-col gap-md">
        {/* Irreversible-transaction double-confirm warning */}
        {confirmReal && (
          <div className="flex flex-col gap-sm p-md rounded-xl border border-error/40 bg-error/5">
            <div className="flex items-center gap-sm">
              <span className="material-symbols-outlined text-error text-[20px]">warning</span>
              <span className="text-error font-semibold text-label-md">Confirm before signing</span>
            </div>
            <p className="text-on-surface-variant text-[13px] leading-relaxed">
              This will send funds on <span className="text-white font-medium">TON testnet</span>. The action is irreversible. Double-check the address and amount above before confirming.
            </p>
            <p className="text-on-surface-variant/60 text-[11px]">
              Tap &ldquo;Confirm &amp; Sign&rdquo; below to proceed, or Cancel to go back.
            </p>
          </div>
        )}

        {/* Transaction summary */}
        {pendingReview ? (
          <GlassCard className="p-md flex flex-col gap-sm">
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary-container mb-xs">
              {isSwap ? 'Swap to review' : 'Transaction to review'}
            </div>

            {isSwap && sd ? (
              <>
                <div className="flex items-center justify-between py-sm border border-white/5 rounded-xl px-md bg-white/[0.02]">
                  <div className="text-center">
                    <div className="text-[11px] text-on-surface-variant mb-[2px]">You pay</div>
                    <div className="text-white font-semibold">{sd.fromAmount} {sd.fromSymbol}</div>
                  </div>
                  <span className="material-symbols-outlined text-primary-container">arrow_forward</span>
                  <div className="text-center">
                    <div className="text-[11px] text-on-surface-variant mb-[2px]">You receive</div>
                    <div className="text-white font-semibold">~{sd.toAmount.toFixed(4)} {sd.toSymbol}</div>
                  </div>
                </div>
                <Row label="Min received"   value={<span className="text-white">{sd.minReceived} {sd.toSymbol}</span>} />
                <Row label="Price impact"   value={<span className={parseFloat(sd.priceImpact) > 5 ? 'text-error' : parseFloat(sd.priceImpact) > 1 ? 'text-yellow-400' : 'text-primary-container'}>{parseFloat(sd.priceImpact).toFixed(2)}%</span>} />
                <Row label="LP fee"         value={<span className="text-on-surface-variant">{parseFloat(sd.feePercent).toFixed(2)}%</span>} />
                <Row label="Protocol gas"   value={<span className="text-on-surface-variant">0.25 TON</span>} />
                <Row label="Router"         value={<span className="font-mono text-[11px] text-on-surface-variant break-all">{sd.routerAddress.slice(0, 12)}…</span>} />
              </>
            ) : (
              <>
                <Row label="To" value={
                  <span className="font-mono text-[12px] break-all text-white">{pendingReview.to}</span>
                } />
                <Row label="Amount" value={
                  <span className="text-white">
                    {pendingReview.amountTon.toFixed(6)} TON
                    {usdValue && <span className="text-on-surface-variant"> {usdValue}</span>}
                  </span>
                } />
                <Row label="Network fee" value={
                  <span className="text-on-surface-variant">~{pendingReview.feeTon.toFixed(6)} TON</span>
                } />
                {pendingReview.comment && (
                  <Row label="Memo" value={<span className="text-white">{pendingReview.comment}</span>} />
                )}
                {pendingReview.jetton && (
                  <Row label="Token" value={<span className="text-white">{pendingReview.jetton.symbol}</span>} />
                )}
              </>
            )}
          </GlassCard>
        ) : (
          <GlassCard className="p-md text-on-surface-variant text-label-sm">
            No pending transaction. Go back and fill in details.
          </GlassCard>
        )}

        {/* AI analysis */}
        <GlassCard className="p-md flex flex-col gap-sm">
          <div className="flex items-center gap-sm mb-xs">
            <div className="w-8 h-8 rounded-full bg-primary-container/15 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-primary-container text-[18px]">smart_toy</span>
            </div>
            <div>
              <div className="text-label-md font-semibold text-white">ZUREON AI Analysis</div>
              <div className="text-[10px] text-on-surface-variant">Claude Haiku</div>
            </div>
          </div>

          {loading && (
            <div className="flex flex-col gap-xs py-sm">
              <div className="flex items-center gap-sm text-on-surface-variant text-label-sm">
                <div className="flex gap-[4px]">
                  <span className="typing-dot w-2 h-2 rounded-full bg-primary-container" />
                  <span className="typing-dot w-2 h-2 rounded-full bg-primary-container" />
                  <span className="typing-dot w-2 h-2 rounded-full bg-primary-container" />
                </div>
                Analysing {isSwap ? 'swap' : 'transaction'}...
              </div>
              {slow && (
                <div className="text-[11px] text-on-surface-variant/60">
                  Taking a bit longer than usual — almost there...
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="flex items-start gap-sm">
              <span className="material-symbols-outlined text-yellow-500 text-[16px] mt-[1px]">warning</span>
              <div className="text-yellow-500/80 text-label-sm py-sm leading-relaxed">
                {error} — you can still verify details manually and proceed.
              </div>
            </div>
          )}

          {response && (
            <div className="text-on-surface text-[14px] leading-relaxed whitespace-pre-wrap animate-fade-in">
              {response}
            </div>
          )}

          {!loading && !response && !error && (
            <div className="text-on-surface-variant text-label-sm py-sm">
              AI analysis will appear here.
            </div>
          )}
        </GlassCard>

        {/* Sign error */}
        {signError && (
          <div className="flex items-center gap-sm px-md py-sm rounded-xl border border-error/30 bg-error/5">
            <span className="material-symbols-outlined text-error text-[18px]">error</span>
            <span className="text-error text-label-sm">{signError}</span>
          </div>
        )}

        <p className="text-[11px] text-on-surface-variant/60 text-center leading-relaxed">
          AI may make mistakes. Always verify the transaction details shown in your wallet —
          your wallet displays the actual amount, recipient, and payload that will be signed.
          ZUREON never holds your keys.
        </p>
      </main>

      {/* Action bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-xl border-t border-white/10 p-md flex gap-md z-40">
        <button
          onClick={() => router.back()}
          className="flex-1 glass-card border border-white/10 text-on-surface text-label-md py-sm px-md rounded-xl flex items-center justify-center gap-xs active:scale-[0.96] hover:bg-white/5 transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
          Cancel
        </button>
        <button
          onClick={handleSign}
          disabled={!pendingReview || signing}
          className={`flex-[2] text-label-md py-sm px-md rounded-xl flex items-center justify-center gap-xs active:scale-[0.96] hover:opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
            confirmReal
              ? 'bg-error text-white'
              : 'bg-primary-container text-black'
          }`}
        >
          {signing ? (
            <>
              <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
              Waiting for wallet…
            </>
          ) : confirmReal ? (
            <>
              <span className="material-symbols-outlined text-[18px]">warning</span>
              Confirm &amp; Sign in Wallet
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[18px]">
                {isSwap ? 'swap_horiz' : 'send'}
              </span>
              {isSwap ? 'Sign & Swap in Wallet' : 'Sign & Send in Wallet'}
            </>
          )}
        </button>
      </div>
    </div>
  )
}

// Encode a text comment as a TON transfer payload (0x00000000 opcode + UTF-8 text)
function buildCommentPayload(comment: string): string {
  return beginCell()
    .storeUint(0, 32)
    .storeStringTail(comment)
    .endCell()
    .toBoc()
    .toString('base64')
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start gap-md py-[8px] border-b border-white/5 last:border-0">
      <span className="text-label-sm text-on-surface-variant flex-shrink-0">{label}</span>
      <div className="text-right text-label-sm">{value}</div>
    </div>
  )
}
