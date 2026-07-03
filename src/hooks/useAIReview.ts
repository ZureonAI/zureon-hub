'use client'
import { useState, useCallback, useRef } from 'react'
import { useStore } from '@/lib/store'
import type { PendingReview } from '@/types/ton'

const PROXY       = '/.netlify/functions/ai-proxy'
const TIMEOUT_MS  = 12_000  // 12s hard abort — Netlify functions 10s budget + margin
const SLOW_MSG_MS =  6_000  // show "Taking longer…" hint at 6s

interface AIMessage {
  role: 'user' | 'assistant'
  content: string
}

interface UseAIReviewResult {
  response: string
  loading: boolean
  error: string | null
  slow: boolean
  review: (tx: PendingReview) => Promise<void>
}

export function useAIReview(): UseAIReviewResult {
  const [response, setResponse] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [slow,     setSlow]     = useState(false)
  const wallet      = useStore(s => s.wallet)
  const tonPriceUsd = useStore(s => s.tonPriceUsd)
  const abortRef    = useRef<AbortController | null>(null)

  const review = useCallback(async (tx: PendingReview) => {
    // Cancel any in-flight request
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current  = controller

    setLoading(true)
    setError(null)
    setResponse('')
    setSlow(false)

    const question     = buildReviewPrompt(tx, tonPriceUsd)
    const walletContext = wallet.connected
      ? {
          connected:  true,
          address:    wallet.address,
          balance:    wallet.balanceNano ? (Number(wallet.balanceNano) / 1e9).toFixed(2) : '0',
          walletName: wallet.walletName,
        }
      : { connected: false }

    // Recipient address — server (ai-proxy) looks up status/balance/txCount via tonapi.
    // Client only computes derived flags from user-controlled inputs.
    const recipientAddress = tx.txType !== 'swap' ? tx.to : null

    // Derive amount-vs-balance ratio for AI risk hints
    const userBalanceTon = wallet.balanceNano ? Number(wallet.balanceNano) / 1e9 : 0
    const amountPercent  = userBalanceTon > 0 ? (tx.amountTon / userBalanceTon) * 100 : null

    // Detect potential typosquat: recipient address starts/ends very similar to user's own
    let lookAlikeUser = false
    if (wallet.address && tx.to && wallet.address !== tx.to) {
      const a = wallet.address
      const b = tx.to
      lookAlikeUser =
        a.slice(0, 6) === b.slice(0, 6) && a.slice(-4) === b.slice(-4)
    }

    // Show a "taking longer than expected" hint at 6 seconds
    const slowTimer = setTimeout(() => setSlow(true), SLOW_MSG_MS)

    // Hard client-side timeout at 12 seconds
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      const res = await fetch(PROXY, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        signal:  controller.signal,
        body: JSON.stringify({
          question,
          walletContext,
          recipientAddress,
          recipientContext: {
            amountPercent,
            lookAlikeUser,
          },
          history: [] as AIMessage[],
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string; detail?: string; retryAfter?: number }
        if (res.status === 429) {
          const wait = data.retryAfter ? ` Try again in ${data.retryAfter}s.` : ''
          throw new Error(`You're sending requests too fast.${wait}`)
        }
        throw new Error(data.detail || data.error || `HTTP ${res.status}`)
      }

      const data = await res.json() as { response: string }
      setResponse(data.response || '')
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('AI review timed out — you can still verify details manually.')
      } else {
        setError(err instanceof Error ? err.message : 'AI review failed')
      }
    } finally {
      clearTimeout(slowTimer)
      clearTimeout(timeoutId)
      setSlow(false)
      setLoading(false)
    }
  }, [wallet, tonPriceUsd])

  return { response, loading, error, slow, review }
}

function buildReviewPrompt(tx: PendingReview, tonPriceUsd: number): string {
  const usdValue = tonPriceUsd > 0
    ? ` (~$${(tx.amountTon * tonPriceUsd).toFixed(2)} USD)`
    : ''

  const isSwap = tx.txType === 'swap'
  const sd     = tx.swapDetails

  if (isSwap && sd) {
    const lines = [
      `Please review this TON SWAP transaction before I sign it:`,
      ``,
      `Transaction type: SWAP via STON.fi DEX`,
      `You pay:       ${sd.fromAmount} ${sd.fromSymbol}`,
      `You receive:   ~${sd.toAmount.toFixed(4)} ${sd.toSymbol}`,
      `Min received:  ${sd.minReceived} ${sd.toSymbol} (slippage protection)`,
      `Price impact:  ${parseFloat(sd.priceImpact).toFixed(2)}%`,
      `LP fee:        ${parseFloat(sd.feePercent).toFixed(2)}%`,
      `Protocol gas:  0.25 TON (STON.fi requirement)`,
      `Router:        ${sd.routerAddress}`,
      `Total deducted: ${tx.amountTon.toFixed(6)} TON${usdValue}`,
      ``,
      `Check: Is the router address legitimate? Is the price impact acceptable? Any red flags?`,
    ]
    return lines.join('\n')
  }

  const lines = [
    `Please review this TON SEND transaction before I sign it:`,
    ``,
    `Transaction type: SEND`,
    `To: ${tx.to}`,
    `Amount: ${tx.amountTon.toFixed(6)} TON${usdValue}`,
    `Network fee: ~${tx.feeTon.toFixed(6)} TON`,
  ]

  if (tx.comment) lines.push(`Memo: ${tx.comment}`)
  if (tx.recipient) lines.push(`Recipient label: ${tx.recipient}`)
  if (tx.jetton) {
    lines.push(`Token: ${tx.jetton.symbol} (${tx.jetton.name})`)
    lines.push(`Contract: ${tx.jetton.address}`)
  }

  lines.push(``, `Check: Does the address look valid? Any red flags? Is the fee normal?`)
  return lines.join('\n')
}
