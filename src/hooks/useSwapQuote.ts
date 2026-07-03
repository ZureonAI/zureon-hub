'use client'
import { useState, useCallback } from 'react'
import { getSwapQuote, type StonfiQuote } from '@/lib/stonfi'

interface UseSwapQuoteResult {
  quote: StonfiQuote | null
  loading: boolean
  error: string | null
  fetch: (params: {
    offerAddress: string
    askAddress: string
    offerUnits: string
    slippage?: string
  }) => Promise<void>
  reset: () => void
}

export function useSwapQuote(): UseSwapQuoteResult {
  const [quote, setQuote] = useState<StonfiQuote | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async (params: {
    offerAddress: string
    askAddress: string
    offerUnits: string
    slippage?: string
  }) => {
    setLoading(true)
    setError(null)
    try {
      const q = await getSwapQuote(params)
      setQuote(q)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Quote failed')
      setQuote(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setQuote(null)
    setError(null)
  }, [])

  return { quote, loading, error, fetch, reset }
}
