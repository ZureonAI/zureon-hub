'use client'
import { useEffect, useRef } from 'react'
import { type ArtifactStage, stageByNumber } from '@/lib/artifact'

export type ClaimStatus = 'idle' | 'claiming' | 'success' | 'error'

interface Props {
  stage: ArtifactStage        // the stage being offered
  txCount: number
  status: ClaimStatus
  errorMsg?: string
  isEvolve?: boolean          // stage 2+ reads as "evolve", stage 1 as "claim"
  onClaim: () => void
  onClose: () => void
  onViewGallery?: () => void
}

export function ClaimArtifactModal({
  stage, txCount, status, errorMsg, isEvolve, onClaim, onClose, onViewGallery,
}: Props) {
  const claimBtnRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const next = stageByNumber(stage.stage + 1)
  const busy = status === 'claiming'

  // Esc to dismiss (but never mid-mint) + focus the primary action on open +
  // a focus trap so Tab/Shift+Tab cycle within the dialog instead of leaking to
  // the page underneath the scrim (WCAG 2.4.3 / 2.1.2 — keyboard users must not
  // land on obscured controls while a modal is open).
  useEffect(() => {
    claimBtnRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) { onClose(); return }
      if (e.key !== 'Tab') return
      const root = dialogRef.current
      if (!root) return
      const focusable = root.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement as HTMLElement | null
      // Wrap around at both ends; also pull focus back in if it has escaped
      // the dialog entirely (e.g. focus was on the page body).
      if (e.shiftKey) {
        if (active === first || !root.contains(active)) { e.preventDefault(); last.focus() }
      } else {
        if (active === last || !root.contains(active)) { e.preventDefault(); first.focus() }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [busy, onClose])

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center pb-6 sm:pb-0"
      style={{ background: 'rgba(0,0,0,0.66)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
      onClick={() => { if (!busy) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="artifact-modal-title"
    >
      <div
        ref={dialogRef}
        className="relative w-full max-w-[420px] mx-4 bg-[#1A1A1A] border border-primary-container/20 rounded-[22px] overflow-hidden"
        style={{ animation: 'fadeIn 0.35s ease-out forwards', boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,212,255,0.04)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close (hidden while minting so the flow can't be half-abandoned) */}
        {!busy && (
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        )}

        {/* ── Artwork ── */}
        <div className="relative flex items-center justify-center pt-[28px] pb-[8px]">
          <div
            className="absolute w-[220px] h-[220px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.22) 0%, rgba(0,212,255,0) 70%)', filter: 'blur(6px)' }}
            aria-hidden="true"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={stage.image}
            alt={`ZUREON Genesis Artifact — ${stage.title}`}
            width={200}
            height={200}
            className="relative w-[200px] h-[200px] object-contain drop-shadow-[0_0_24px_rgba(0,212,255,0.25)]"
            style={{ animation: status === 'success' ? 'pulse 1.4s ease-in-out infinite' : undefined }}
          />
        </div>

        <div className="px-[24px] pb-[24px] text-center">
          {status === 'success' ? (
            /* ── Success ── */
            <>
              <div className="w-12 h-12 rounded-full bg-primary-container/12 border border-primary-container/25 flex items-center justify-center mx-auto mb-[14px]">
                <span className="material-symbols-outlined text-primary-container text-[26px]">check</span>
              </div>
              <div className="text-[11px] font-bold tracking-[0.15em] text-primary-container uppercase mb-[8px]">
                {isEvolve ? 'Artifact evolved' : 'Artifact claimed'}
              </div>
              <div id="artifact-modal-title" className="text-[18px] font-semibold text-white leading-snug mb-[10px]">
                {stage.title} is now yours
              </div>
              <p className="text-[13px] text-white/55 leading-relaxed mb-[20px]">
                It lives on-chain in your wallet. {next ? `Keep going — ${next.title} unlocks at ${next.minTx ?? ''}${next.minTx ? ' transactions' : ' mainnet launch'}.` : ''}
              </p>
              <button
                onClick={onViewGallery}
                className="w-full bg-primary-container text-black font-medium py-[14px] px-md rounded-xl flex items-center justify-center gap-xs active:scale-[0.96] hover:opacity-90 transition-all shadow-[0_0_10px_rgba(0,212,255,0.08)]"
              >
                <span className="material-symbols-outlined text-[18px]">image</span>
                View in gallery
              </button>
              <button onClick={onClose} className="w-full mt-[8px] py-[12px] rounded-xl text-white/50 text-[13px] font-medium hover:bg-white/5 transition-colors">
                Done
              </button>
            </>
          ) : (
            /* ── Offer / claiming / error ── */
            <>
              <div className="text-[11px] font-bold tracking-[0.15em] text-primary-container uppercase mb-[8px]">
                {isEvolve ? 'Milestone reached' : 'Milestone unlocked'} · Stage {stage.label}
              </div>
              <div id="artifact-modal-title" className="text-[20px] font-semibold text-white leading-snug mb-[10px]">
                {stage.title}
              </div>
              <p className="text-[13px] text-white/55 leading-relaxed mb-[16px]">
                {stage.blurb}
              </p>

              {/* Progress — the milestone that unlocked this stage, reached */}
              <div className="mb-[20px] text-left">
                <div className="flex items-center justify-between text-[11px] mb-[6px]">
                  <span className="text-white/60">{stage.network} transactions</span>
                  <span className="text-primary-container font-semibold">
                    {Math.min(txCount, stage.minTx ?? txCount)} / {stage.minTx ?? '—'}
                  </span>
                </div>
                <div className="h-[6px] rounded-full bg-white/8 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary-container"
                    style={{ width: '100%', boxShadow: '0 0 12px rgba(0,212,255,0.5)' }}
                  />
                </div>
                {next && (
                  <div className="text-[11px] text-white/55 mt-[8px]">
                    Next: {next.title} {next.minTx ? `at ${next.minTx} transactions` : 'at mainnet launch'}
                  </div>
                )}
              </div>

              {status === 'error' && (
                <div className="mb-[14px] text-[12px] text-error bg-error-container/15 border border-error/20 rounded-lg px-3 py-2 text-left">
                  {errorMsg || 'Something went wrong. Please try again.'}
                </div>
              )}

              <button
                ref={claimBtnRef}
                onClick={onClaim}
                disabled={busy}
                className="w-full bg-primary-container text-black font-semibold py-[15px] px-md rounded-xl flex items-center justify-center gap-xs active:scale-[0.96] hover:opacity-90 transition-all shadow-[0_0_14px_rgba(0,212,255,0.14)] disabled:opacity-60 disabled:active:scale-100"
              >
                {busy ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                    {isEvolve ? 'Evolving…' : 'Claiming…'}
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">{isEvolve ? 'auto_awesome' : 'workspace_premium'}</span>
                    {status === 'error' ? 'Try again' : stage.cta}
                  </>
                )}
              </button>
              {!busy && (
                <button onClick={onClose} className="w-full mt-[8px] py-[12px] rounded-xl text-white/50 text-[13px] font-medium hover:bg-white/5 transition-colors">
                  Later
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
