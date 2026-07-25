'use client'
import { useState, useEffect } from 'react'
import { getTransactions } from '@/lib/tonapi'

export interface TxEvent {
  event_id: string
  timestamp: number
  actions: Array<{
    type: string
    status: string
    TonTransfer?: {
      sender: { address: string }
      recipient: { address: string }
      amount: number
      comment?: string
    }
    JettonTransfer?: {
      sender?: { address: string }
      recipient?: { address: string }
      amount: string
      jetton: { symbol: string; decimals: number }
    }
  }>
  is_scam: boolean
  in_progress: boolean
}

export function useTransactions(address: string | undefined) {
  const [txs, setTxs] = useState<TxEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!address) { setTxs([]); return }
    let cancelled = false
    // Clear any previous wallet's list so switching accounts (or entering the
    // screen) shows the loading skeleton, never the prior wallet's stale txs.
    setTxs([])
    let lastSig = ''

    const load = (showSpinner: boolean) => {
      if (showSpinner) setLoading(true)
      getTransactions(address, 10)
        .then(events => {
          if (cancelled) return
          // null = toncenter read failed → keep the last-good list untouched
          // (no stale tonapi fallback, so the list can't flip fresh↔cached).
          if (events !== null) {
            const list = events as TxEvent[]
            // Only re-render when the list actually changed, so a poll over
            // unchanged data doesn't visibly "refresh" the screen.
            const sig = list.map(e => e.event_id).join('|')
            if (sig !== lastSig) { lastSig = sig; setTxs(list) }
            setError(null)
          }
        })
        .catch(err => {
          // Keep the last good list on a transient poll failure; only surface an
          // error on the very first load when we have nothing to show.
          if (!cancelled && showSpinner) setError(err.message)
        })
        .finally(() => {
          if (!cancelled && showSpinner) setLoading(false)
        })
    }

    // Poll so a new send/receive appears within a few seconds, matching the live
    // balance. Refetch on tab focus too (user returns after topping up).
    load(true)
    const id = setInterval(() => load(false), 8000)
    const onFocus = () => load(false)
    window.addEventListener('focus', onFocus)
    return () => {
      cancelled = true
      clearInterval(id)
      window.removeEventListener('focus', onFocus)
    }
  }, [address])

  return { txs, loading, error }
}
