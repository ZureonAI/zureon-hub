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
    setLoading(true)
    setError(null)
    getTransactions(address, 10)
      .then(events => {
        if (!cancelled) setTxs(events as TxEvent[])
      })
      .catch(err => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [address])

  return { txs, loading, error }
}
