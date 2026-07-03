'use client'
import { useState, useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import { useStore } from '@/lib/store'
import { ScreenLayout } from '@/components/layout/ScreenLayout'
import { GlassCard } from '@/components/ui/GlassCard'

// TON address is universal — the same address receives TON, USDT, NOT and all Jettons

export function ReceiveScreen() {
  const wallet = useStore(s => s.wallet)
  const [copied, setCopied] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const address = wallet.address ?? ''

  useEffect(() => {
    if (!address || !canvasRef.current) return
    QRCode.toCanvas(canvasRef.current, address, {
      width: 192,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    })
  }, [address])

  function copyAddress() {
    if (!address) return
    navigator.clipboard.writeText(address).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <ScreenLayout showBack backHref="/dashboard">
      <h1 className="text-2xl font-semibold text-on-surface">Receive</h1>

      {/* Universal address notice */}
      <div className="bg-surface-variant/5 border border-surface-variant/20 rounded-xl p-3 flex items-start gap-sm">
        <span className="material-symbols-outlined text-primary-container text-[18px] mt-0.5">info</span>
        <p className="text-xs text-outline flex-1">
          This address accepts <strong className="text-on-surface">TON, USDT, NOT</strong> and all TON-network tokens.
          Always verify you&apos;re on the <strong className="text-on-surface">TON network</strong> before sending.
        </p>
      </div>

      {/* QR code + address */}
      {address ? (
        <GlassCard className="rounded-xl p-6 flex flex-col items-center gap-md relative overflow-hidden">
          <div className="absolute inset-0 bg-primary-container/5 rounded-xl blur-[50px]" />

          {/* Real scannable QR code */}
          <div className="w-48 h-48 bg-white p-3 rounded-xl z-10 shadow-[0_0_20px_rgba(255,255,255,0.1)] flex items-center justify-center">
            <canvas ref={canvasRef} className="rounded" />
          </div>

          <div className="flex items-center gap-2 bg-surface-container/50 px-3 py-2 rounded-lg border border-white/5 z-10 w-full max-w-[320px]">
            <span className="text-xs font-medium text-on-surface font-mono flex-1 truncate">
              {address}
            </span>
            <button onClick={copyAddress} aria-label="Copy address" className="text-outline hover:text-on-surface transition-colors flex-shrink-0">
              <span className="material-symbols-outlined text-[16px]">
                {copied ? 'check' : 'content_copy'}
              </span>
            </button>
          </div>
        </GlassCard>
      ) : (
        <GlassCard className="rounded-xl p-6 flex flex-col items-center gap-md">
          <div className="w-48 h-48 bg-surface-container/30 rounded-xl flex items-center justify-center border border-dashed border-white/10">
            <div className="text-center text-xs text-outline p-4">
              Connect wallet to see QR code
            </div>
          </div>
        </GlassCard>
      )}

      {/* Copy button */}
      {address && (
        <button
          onClick={copyAddress}
          className="w-full border border-white/10 text-on-surface font-medium py-[14px] px-md rounded-xl flex items-center justify-center gap-xs active:scale-[0.96] hover:bg-white/5 transition-all"
        >
          <span className="material-symbols-outlined text-[18px] text-primary-container">
            {copied ? 'check' : 'content_copy'}
          </span>
          {copied ? 'Address copied!' : 'Copy address'}
        </button>
      )}
    </ScreenLayout>
  )
}
