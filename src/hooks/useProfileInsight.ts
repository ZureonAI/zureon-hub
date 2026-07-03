'use client'
import { useEffect, useState, useCallback } from 'react'
import { useStore } from '@/lib/store'

const ENDPOINT  = '/.netlify/functions/profile-insight'
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

interface CachedInsight {
  text: string
  ts:   number
  addr: string
}

interface JettonSlim {
  symbol: string
  balanceFormatted: string
}

interface ProfileInsightResult {
  text: string
  loading: boolean
  error: string | null
  refresh: () => void
}

function cacheKey(addr: string): string {
  return `zureon_profile_insight_${addr}`
}

function readCache(addr: string): CachedInsight | null {
  try {
    const raw = localStorage.getItem(cacheKey(addr))
    if (!raw) return null
    const c = JSON.parse(raw) as CachedInsight
    if (c.addr !== addr) return null
    if (Date.now() - c.ts > CACHE_TTL) return null
    return c
  } catch { return null }
}

function writeCache(addr: string, text: string) {
  try {
    const c: CachedInsight = { text, ts: Date.now(), addr }
    localStorage.setItem(cacheKey(addr), JSON.stringify(c))
  } catch { /* quota or private mode — silent */ }
}

export function useProfileInsight(): ProfileInsightResult {
  const wallet      = useStore(s => s.wallet)
  const jettons     = useStore(s => s.jettons)
  const tonPriceUsd = useStore(s => s.tonPriceUsd)

  const [text,    setText]    = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [nonce,   setNonce]   = useState(0)

  const refresh = useCallback(() => setNonce(n => n + 1), [])

  useEffect(() => {
    if (!wallet.connected || !wallet.address) { setText(''); return }

    const tonBalance = wallet.balanceNano ? Number(wallet.balanceNano) / 1e9 : 0
    if (tonBalance <= 0 && jettons.length === 0) { setText(''); return }

    // Cache check (skip on manual refresh)
    if (nonce === 0) {
      const cached = readCache(wallet.address)
      if (cached) { setText(cached.text); return }
    }

    let aborted = false
    const ac = new AbortController()
    setLoading(true)
    setError(null)

    const jettonsSlim: JettonSlim[] = jettons.map(j => ({
      symbol:           j.symbol,
      balanceFormatted: j.balanceFormatted,
    }))

    fetch(ENDPOINT, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      signal:  ac.signal,
      body: JSON.stringify({
        tonBalance,
        tonPriceUsd: tonPriceUsd > 0 ? tonPriceUsd : null,
        jettons:     jettonsSlim,
      }),
    })
      .then(async res => {
        if (!res.ok) {
          const d = await res.json().catch(() => ({})) as { error?: string }
          throw new Error(d.error || `HTTP ${res.status}`)
        }
        return res.json() as Promise<{ insight: string }>
      })
      .then(data => {
        if (aborted) return
        const insight = data.insight || ''
        setText(insight)
        if (insight && wallet.address) writeCache(wallet.address, insight)
      })
      .catch(err => {
        if (aborted || err?.name === 'AbortError') return
        setError(err instanceof Error ? err.message : 'insight failed')
      })
      .finally(() => { if (!aborted) setLoading(false) })

    return () => { aborted = true; ac.abort() }
  }, [wallet.connected, wallet.address, wallet.balanceNano, jettons.length, tonPriceUsd, nonce])

  return { text, loading, error, refresh }
}
