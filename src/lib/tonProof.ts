'use client'
/**
 * Client side of the TonConnect ton_proof handshake (see
 * netlify/functions/verify-ton-proof.js for the server side and the full
 * rationale). Flow:
 *   1. Before the wallet-connect modal opens, fetch a single-use payload and
 *      attach it as the tonProof connect request parameter (done in
 *      TonProvider.tsx) — the wallet signs it as part of connecting.
 *   2. Once connected, if the wallet returned a proof, verify it server-side
 *      and cache the resulting address-bound token here.
 *   3. claimArtifact() attaches that token so claim-nft.js can confirm the
 *      caller actually controls the wallet it's claiming for.
 */

export interface TonProofPayload {
  timestamp: number
  domain: { lengthBytes: number; value: string }
  payload: string
  signature: string
}

const REQUEST_ENDPOINT = '/.netlify/functions/request-ton-proof'
const VERIFY_ENDPOINT = '/.netlify/functions/verify-ton-proof'
const TOKEN_KEY_PREFIX = 'zureon.tonproof.token.'

// 8s cap so a hung request-ton-proof call can't leave the wallet-connect flow
// stuck in TonConnect's `{state:'loading'}` forever — on any failure
// (including a timeout) the caller falls back to a proof-less connect.
const PAYLOAD_FETCH_TIMEOUT_MS = 8000

export async function fetchTonProofPayload(): Promise<string | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), PAYLOAD_FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(REQUEST_ENDPOINT, { signal: controller.signal })
    if (!res.ok) return null
    const data = await res.json() as { ok?: boolean; payload?: string }
    return data.ok && data.payload ? data.payload : null
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

export async function verifyTonProof(
  address: string, publicKey: string, proof: TonProofPayload,
): Promise<string | null> {
  try {
    const res = await fetch(VERIFY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, publicKey, proof }),
    })
    const data = await res.json() as { ok?: boolean; token?: string }
    return data.ok && data.token ? data.token : null
  } catch {
    return null
  }
}

export function storeProofToken(address: string, token: string): void {
  try { localStorage.setItem(TOKEN_KEY_PREFIX + address, token) } catch { /* ignore */ }
}

export function getProofToken(address: string): string | null {
  try { return localStorage.getItem(TOKEN_KEY_PREFIX + address) } catch { return null }
}

export function clearProofToken(address: string): void {
  try { localStorage.removeItem(TOKEN_KEY_PREFIX + address) } catch { /* ignore */ }
}
