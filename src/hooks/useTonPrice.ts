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
