'use client'
/**
 * ZUREON Genesis Artifact — client-side stage model + claim helpers.
 *
 * Mirror of netlify/functions/_nft-config.js (thresholds + labels), kept as a
 * separate copy because the backend module is CommonJS and reads process.env —
 * it cannot be imported into the static Next app. Keep the two in sync when
 * tuning stages.
 *
 * IMPORTANT: everything here is for the UX trigger only (deciding when to *offer*
 * the claim). Eligibility is re-verified on-chain by the claim-nft function
 * before anything is minted — the client count is never trusted as proof.
 */
import { getTransactions } from '@/lib/tonapi'
import type { TrackNetwork } from '@/lib/track'
import { getProofToken } from '@/lib/tonProof'

export interface ArtifactStage {
  stage: number
  key: string
  label: string
  minTx: number | null
  network: TrackNetwork
  image: string
  title: string
  blurb: string
  cta: string
}

// Public assets live in hub-app/public/nft and are served under the app's
// basePath (/hub-dist), matching how layout.tsx references its icons.
const IMG = (file: string) => `/hub-dist/nft/${file}`

export const ARTIFACT_STAGES: ArtifactStage[] = [
  {
    stage: 1, key: 'sealed', label: 'I · Sealed', minTx: 20, network: 'testnet',
    image: IMG('stage-1.png'), title: 'Genesis Cube', cta: 'Claim your artifact',
    blurb: 'Twenty on-chain transactions have crystallized the core. Claim the sealed Genesis Cube — the first form of an artifact only you can complete.',
  },
  {
    stage: 2, key: 'awakening', label: 'II · Awakening', minTx: 50, network: 'testnet',
    image: IMG('stage-2.png'), title: 'Awakening', cta: 'Evolve your artifact',
    blurb: 'Fifty transactions in. The cube unseals, light breaks through — the same artifact, evolving. No new mint, no gas.',
  },
  {
    stage: 3, key: 'ascension', label: 'III · Ascension', minTx: null, network: 'mainnet',
    image: IMG('stage-3.png'), title: 'Mainnet Pioneer', cta: 'Coming at mainnet',
    blurb: 'The finale. The artifact completes only when ZUREON reaches mainnet — a piece reserved for the pioneers who were here first.',
  },
]

// Highest stage mintable/evolvable during the testnet phase (stage 3 = mainnet).
export const MAX_TESTNET_STAGE = 2

export function stageByNumber(n: number): ArtifactStage | undefined {
  return ARTIFACT_STAGES.find(s => s.stage === n)
}

// Highest testnet stage a given (client-observed) tx count qualifies for.
// 0 = not yet at stage 1.
export function qualifyingStage(txCount: number): number {
  let q = 0
  for (const s of ARTIFACT_STAGES) {
    if (s.network !== 'testnet' || s.minTx == null) continue
    if (txCount >= s.minTx) q = s.stage
  }
  return q
}

/**
 * Best-effort client tx count for the trigger. tonapi returns recent events
 * (capped at `limit`); good enough to know a threshold has been crossed. Never
 * throws — a failure just yields 0 (no premature offer). Server re-verifies.
 */
export async function countTransactions(address: string): Promise<number> {
  try {
    const events = (await getTransactions(address, 100)) as unknown[]
    return Array.isArray(events) ? events.length : 0
  } catch {
    return 0
  }
}

// Highest stage this wallet has ALREADY claimed, per the server's on-chain-
// backed record (get-artifacts). This is the source of truth for "already
// claimed" — unlike getAckStage below it works across devices (localStorage is
// per-device, so a wallet claimed on phone A would otherwise be re-offered on
// phone B). Returns 0 if nothing claimed. Never throws.
export async function getClaimedStage(address: string): Promise<number> {
  try {
    const res = await fetch(`/.netlify/functions/get-artifacts?address=${encodeURIComponent(address)}`)
    if (!res.ok) return 0
    const data = await res.json() as { items?: Array<{ stage?: number }> }
    const stages = (data.items || []).map(i => Number(i.stage) || 0)
    return stages.length ? Math.max(...stages) : 0
  } catch {
    return 0
  }
}

// ── Per-wallet "already acknowledged" memory ─────────────────────────────
// Stops the modal from re-opening on every mount once the user has seen (and
// claimed or dismissed) a given stage. Keyed by address so switching wallets
// re-evaluates. Best-effort: SSR / disabled storage just means it may re-offer.
const ackKey = (address: string) => `zureon.artifact.ack.${address}`

export function getAckStage(address: string): number {
  try {
    const v = Number(localStorage.getItem(ackKey(address)))
    return Number.isInteger(v) && v > 0 ? v : 0
  } catch { return 0 }
}

export function setAckStage(address: string, stage: number): void {
  try { localStorage.setItem(ackKey(address), String(stage)) } catch { /* ignore */ }
}

// ── Claim API ────────────────────────────────────────────────────────────
const CLAIM_ENDPOINT = '/.netlify/functions/claim-nft'

export interface ClaimResult {
  ok: boolean
  stage?: number
  itemAddress?: string
  error?: string
  txCount?: number
  required?: number
}

/**
 * Ask the backend to claim/evolve to `targetStage`. The server verifies the
 * on-chain tx count, dedupes, and (stage 1) mints or (stage 2) advances the
 * stage. Returns a structured result; throws only on a hard network failure.
 */
export async function claimArtifact(
  address: string, network: TrackNetwork, targetStage: number,
): Promise<ClaimResult> {
  // Proves this client actually controls `address` (see lib/tonProof.ts) —
  // claim-nft.js rejects with `proof_required` if this is missing/expired.
  const proofToken = getProofToken(address)
  const res = await fetch(CLAIM_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(proofToken ? { Authorization: `Bearer ${proofToken}` } : {}),
    },
    body: JSON.stringify({ address, network, targetStage }),
  })
  let data: ClaimResult
  try { data = await res.json() as ClaimResult } catch { data = { ok: false, error: 'bad_response' } }
  if (!res.ok && data.ok === undefined) data.ok = false
  return data
}
