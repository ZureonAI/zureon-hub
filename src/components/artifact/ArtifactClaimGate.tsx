'use client'
/**
 * ArtifactClaimGate — watches the connected wallet and AUTO-OPENS the Genesis
 * Artifact claim modal the moment a milestone is reached (20 tx → Stage I,
 * 50 tx → Stage II). Mounted once inside TonProvider so it is always live,
 * regardless of which screen the user is on.
 *
 * Trigger uses a best-effort client tx count (see artifact.ts) — the claim
 * itself is re-verified on-chain server-side before anything is minted.
 *
 * Preview: append ?artifact=1 to any URL to force the modal open in a demo
 * state (Stage I, simulated claim). Lets the team QA / show it off without a
 * wallet that has 20 testnet transactions.
 */
import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTonWallet, useTonAddress } from '@tonconnect/ui-react'
import { chainToNetwork, type TrackNetwork } from '@/lib/track'
import {
  ARTIFACT_STAGES, MAX_TESTNET_STAGE, stageByNumber, qualifyingStage,
  countTransactions, getAckStage, setAckStage, claimArtifact,
} from '@/lib/artifact'
import { ClaimArtifactModal, type ClaimStatus } from './ClaimArtifactModal'

function errorMessage(code: string | undefined, txCount: number, required?: number): string {
  switch (code) {
    case 'not_eligible':   return `Not enough transactions yet${required ? ` — ${required} needed, you have ${txCount}` : ''}.`
    case 'already_claimed':return 'You have already claimed this stage.'
    case 'not_configured': return 'Claiming opens shortly — the collection is being finalized on-chain.'
    case 'rate_limit_exceeded': return 'Too many attempts. Please try again in a moment.'
    case 'invalid_address':return 'Wallet address not recognized. Reconnect and try again.'
    default:               return 'Something went wrong. Please try again.'
  }
}

export function ArtifactClaimGate() {
  const wallet = useTonWallet()
  const address = useTonAddress()
  const router = useRouter()

  const [open, setOpen] = useState(false)
  const [preview, setPreview] = useState(false)
  const [offeredStage, setOfferedStage] = useState(1)
  const [txCount, setTxCount] = useState(0)
  const [status, setStatus] = useState<ClaimStatus>('idle')
  const [errorMsg, setErrorMsg] = useState<string>()

  // Stages the user waved away this session — not persisted, so an unclaimed
  // milestone gently re-offers on the next visit until it is actually claimed.
  const dismissed = useRef<Set<number>>(new Set())

  // Preview mirrored into a ref so the eligibility effect (which runs right
  // after the preview effect on mount) can short-circuit synchronously —
  // otherwise its `!address → setOpen(false)` would stomp the preview open.
  const previewRef = useRef(false)

  const network: TrackNetwork = chainToNetwork(
    (wallet as { account?: { chain?: string } } | null)?.account?.chain,
  )

  // Preview flag (client-only; avoids SSR hydration mismatch).
  // The ?artifact=1 demo force-opens the modal and simulates a claim — it must
  // NEVER be reachable on the public production domain, where the modal has to
  // be gated by real on-chain activity. Allow it only on localhost and draft
  // (*.netlify.app) hosts so the team can still demo it there.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const host = window.location.hostname
    const previewAllowed = host === 'localhost' || host === '127.0.0.1' || host.endsWith('.netlify.app')
    if (previewAllowed && new URLSearchParams(window.location.search).get('artifact') === '1') {
      previewRef.current = true
      setPreview(true)
      setOfferedStage(1)
      setTxCount(20)
      setStatus('idle')
      setOpen(true)
    }
  }, [])

  // Evaluate eligibility whenever the connected wallet changes.
  useEffect(() => {
    if (previewRef.current) return
    if (!address) { setOpen(false); return }
    let cancelled = false
    ;(async () => {
      const count = await countTransactions(address)
      if (cancelled) return
      setTxCount(count)
      const eligible = qualifyingStage(count)              // highest testnet stage earned
      const acked = getAckStage(address)                    // highest stage already claimed
      const offered = acked + 1                             // claim/evolve strictly in order
      if (offered <= eligible && offered <= MAX_TESTNET_STAGE && !dismissed.current.has(offered)) {
        setOfferedStage(offered)
        setStatus('idle')
        setErrorMsg(undefined)
        setOpen(true)
      } else {
        setOpen(false)
      }
    })()
    return () => { cancelled = true }
  }, [address, preview])

  const close = useCallback(() => {
    if (status === 'claiming') return
    if (!preview) dismissed.current.add(offeredStage)
    setOpen(false)
  }, [status, preview, offeredStage])

  const handleClaim = useCallback(async () => {
    setStatus('claiming')
    setErrorMsg(undefined)

    // Preview: simulate the mint so the whole flow (incl. success) is demoable.
    if (preview) {
      setTimeout(() => setStatus('success'), 900)
      return
    }

    try {
      const res = await claimArtifact(address, network, offeredStage)
      if (res.ok) {
        setAckStage(address, offeredStage)
        setStatus('success')
      } else {
        setErrorMsg(errorMessage(res.error, res.txCount ?? txCount, res.required))
        setStatus('error')
      }
    } catch {
      setErrorMsg('Network error — could not reach the claim service. Please try again.')
      setStatus('error')
    }
  }, [preview, address, network, offeredStage, txCount])

  if (!open) return null

  const stage = stageByNumber(offeredStage) ?? ARTIFACT_STAGES[0]

  return (
    <ClaimArtifactModal
      stage={stage}
      txCount={txCount}
      status={status}
      errorMsg={errorMsg}
      isEvolve={offeredStage >= 2}
      onClaim={handleClaim}
      onClose={close}
      onViewGallery={() => { setOpen(false); router.push('/nfts') }}
    />
  )
}
