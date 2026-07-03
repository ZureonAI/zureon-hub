'use client'
import { useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import type { TxResult } from '@/types/ton'

function shortHash(boc: string) {
  if (boc.length < 20) return boc
  return `${boc.slice(0, 8)}…${boc.slice(-6)}`
}

function tonViewerUrl(boc: string) {
  return `https://tonviewer.com/?search=${encodeURIComponent(boc)}`
}

interface Props {
  result: TxResult
  onDone: () => void
}

export function ConfirmationScreen({ result, onDone }: Props) {
  const [copied, setCopied] = useState(false)

  function copyBoc() {
    navigator.clipboard.writeText(result.boc).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const isSwap = result.txType === 'swap'
  const sd     = result.swapDetails

  return (
    <div className="bg-black text-on-surface min-h-screen flex flex-col font-sans antialiased">
      <main className="flex-1 flex flex-col items-center justify-center px-[16px] gap-lg">
        <div className="w-20 h-20 rounded-full bg-primary-container/15 border border-primary-container/30 flex items-center justify-center animate-fade-in">
          <span className="material-symbols-outlined text-primary-container text-[40px]">check_circle</span>
        </div>

        <div className="text-center">
          <div className="text-[22px] font-semibold text-white mb-xs">
            {isSwap ? 'Swap submitted' : 'Transaction sent'}
          </div>
          <div className="text-label-sm text-on-surface-variant">
            {isSwap && sd
              ? `${sd.fromAmount} ${sd.fromSymbol} → ${sd.toAmount.toFixed(4)} ${sd.toSymbol} via STON.fi`
              : result.amountTon !== undefined
              ? `${result.amountTon.toFixed(6)} TON sent`
              : 'Signed and broadcast to TON network'}
          </div>
          <div className="text-[11px] text-on-surface-variant/50 mt-xs">
            {new Date(result.timestamp).toLocaleTimeString()}
          </div>
        </div>

        <GlassCard className="w-full p-md flex flex-col gap-sm">
          <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant mb-xs">
            Transaction reference
          </div>
          <div className="flex items-center justify-between gap-sm">
            <span className="font-mono text-[12px] text-white truncate">{shortHash(result.boc)}</span>
            <button
              onClick={copyBoc}
              className="flex-shrink-0 glass-card px-sm py-[4px] rounded-full text-label-sm text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-xs"
            >
              <span className="material-symbols-outlined text-[14px]">
                {copied ? 'check' : 'content_copy'}
              </span>
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="text-[11px] text-on-surface-variant/60 leading-relaxed">
            Broadcast to the TON network. Usually confirms in 5–30 seconds.
            TonViewer may take up to 30 seconds to index it — if the link shows
            nothing yet, wait a moment and refresh.
          </p>
        </GlassCard>

        <a
          href={tonViewerUrl(result.boc)}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full glass-card border border-primary-container/30 text-primary-container text-label-md py-sm px-md rounded-xl flex items-center justify-center gap-xs hover:bg-primary-container/5 transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">open_in_new</span>
          View in TonViewer
        </a>

        <button
          onClick={onDone}
          className="w-full bg-primary-container text-black text-label-md py-[14px] px-md rounded-xl flex items-center justify-center gap-xs active:scale-[0.96] hover:opacity-90 transition-all"
        >
          Back to dashboard
        </button>
      </main>
    </div>
  )
}
