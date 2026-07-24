'use client'
import { useEffect, useRef } from 'react'
import { useStore } from '@/lib/store'

export function useTonPrice() {
  const setTonPrice = useStore(s => s.setTonPrice)
  const calledRef = useRef(false)

  useEffect(() => {
    if (calledRef.current) return
    calledRef.current = true

    async function fetch_() {
      // Primary: tonapi aggregated rate. Binance's TONUSDT `ticker/price` is a
      // single thin-market last-trade that sticks on round numbers (sat at
      // exactly $1.60 while the real aggregated price moved) — it looked frozen.
      // tonapi tracks the market, isn't geo-blocked like an exchange, and is
      // already this app's data source. Price of TON is a real-world value, so
      // we read MAINNET rates even though the app itself runs on testnet.
      try {
        const res = await fetch('https://tonapi.io/v2/rates?tokens=ton&currencies=usd')
        if (res.ok) {
          const data = await res.json() as { rates?: { TON?: { prices?: { USD?: number } } } }
          const price = data?.rates?.TON?.prices?.USD
          if (typeof price === 'number' && price > 0) { setTonPrice(price); return }
        }
      } catch {
        // fall through to Binance
      }
      // Fallback: Binance last trade (still better than nothing if tonapi is down).
      try {
        const res = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=TONUSDT')
        const data = await res.json() as { price: string }
        const price = parseFloat(data.price)
        if (price > 0) setTonPrice(price)
      } catch {
        // Non-critical — UI shows "—" on failure
      }
    }

    fetch_()
    const id = setInterval(fetch_, 30_000)
    return () => clearInterval(id)
  }, [setTonPrice])
}
