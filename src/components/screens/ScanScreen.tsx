'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import jsQR from 'jsqr'
import { useStore } from '@/lib/store'
import { getAccount } from '@/lib/tonapi'
import { ScreenLayout } from '@/components/layout/ScreenLayout'
import { GlassCard } from '@/components/ui/GlassCard'

// Mirrors the format check in SendScreen.tsx — kept local so this screen
// has no dependency on other screens' internals.
const TON_ADDRESS_RE = /^[EU][QU][A-Za-z0-9_-]{46}$|^-?[0-9]+:[A-Fa-f0-9]{64}$/

function extractAddress(payload: string): string | null {
  const trimmed = payload.trim()
  const deepLink = trimmed.match(/^(?:ton|tonkeeper):\/\/transfer\/([^?/]+)/i)
  const candidate = deepLink ? deepLink[1] : trimmed
  return TON_ADDRESS_RE.test(candidate) ? candidate : null
}

interface RiskResult {
  address: string
  risks: string[]
}

export function ScanScreen() {
  const router = useRouter()
  const wallet = useStore(s => s.wallet)

  const videoRef  = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef    = useRef<number | null>(null)

  const [cameraError, setCameraError] = useState<string | null>(null)
  const [manualInput, setManualInput] = useState('')
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState<RiskResult | null>(null)
  // Bumped by "Scan again" to force the camera effect below to tear down
  // and restart cleanly (getUserMedia can't just be "resumed" after decode).
  const [attempt, setAttempt] = useState(0)

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }, [])

  const runRiskCheck = useCallback(async (address: string) => {
    setChecking(true)
    setResult(null)
    const risks: string[] = []

    // Typosquat check — same prefix/suffix heuristic used by AI Review (useAIReview.ts)
    if (wallet.address && wallet.address !== address) {
      const a = wallet.address
      const lookAlike = a.slice(0, 6) === address.slice(0, 6) && a.slice(-4) === address.slice(-4)
      if (lookAlike) risks.push('This address closely resembles your own wallet — possible typo-squat scam.')
    }

    try {
      const acct = await getAccount(address)
      if (acct.status === 'nonexist' || acct.status === 'uninit') {
        risks.push('This address has never received funds on-chain — confirm it is correct before sending.')
      }
    } catch {
      risks.push('Could not verify this address on-chain right now — double-check it manually.')
    }

    setResult({ address, risks })
    setChecking(false)
  }, [wallet.address])

  const handleDecoded = useCallback((payload: string) => {
    const address = extractAddress(payload)
    if (!address) return
    stopCamera()
    runRiskCheck(address)
  }, [runRiskCheck, stopCamera])

  useEffect(() => {
    let cancelled = false

    function tick() {
      const video  = videoRef.current
      const canvas = canvasRef.current
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width  = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          const frame = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const code = jsQR(frame.data, frame.width, frame.height)
          if (code?.data) {
            handleDecoded(code.data)
            return
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
        tick()
      } catch {
        if (!cancelled) setCameraError('Camera unavailable — paste the address below instead.')
      }
    }

    startCamera()
    return () => { cancelled = true; stopCamera() }
  }, [handleDecoded, stopCamera, attempt])

  function handleManualCheck() {
    const address = extractAddress(manualInput)
    if (!address) {
      setResult({ address: manualInput.trim(), risks: ['This does not look like a valid TON address.'] })
      return
    }
    runRiskCheck(address)
  }

  function continueToSend() {
    if (!result || !TON_ADDRESS_RE.test(result.address)) return
    router.push(`/send?to=${encodeURIComponent(result.address)}`)
  }

  function scanAgain() {
    setResult(null)
    setManualInput('')
    setCameraError(null)
    setAttempt(a => a + 1)
  }

  return (
    <ScreenLayout showBack backHref="/send">
      <div className="flex flex-col gap-xs">
        <h1 className="text-2xl font-semibold text-on-surface">Scan QR</h1>
        <p className="text-label-sm text-on-surface-variant">
          Scan a TON address QR code. ZUREON checks it for typo-squats and unused addresses before you send.
        </p>
      </div>

      {!result && !cameraError && (
        <GlassCard className="rounded-xl p-3 relative aspect-square overflow-hidden bg-black flex items-center justify-center">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video ref={videoRef} playsInline muted className="w-full h-full object-cover rounded-xl" />
          <canvas ref={canvasRef} className="hidden" />
          <div className="absolute inset-6 border-2 border-primary-container/60 rounded-2xl pointer-events-none" />
        </GlassCard>
      )}

      {cameraError && !result && (
        <GlassCard className="p-md flex flex-col gap-sm">
          <p className="text-xs text-outline">{cameraError}</p>
          <input
            type="text"
            value={manualInput}
            onChange={e => setManualInput(e.target.value)}
            placeholder="EQA... or UQA..."
            className="bg-surface-container/30 border border-white/5 rounded-lg px-sm py-xs text-sm text-on-surface placeholder:text-outline"
          />
          <button
            onClick={handleManualCheck}
            disabled={!manualInput.trim()}
            className="w-full bg-primary-container text-black font-medium py-[10px] rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Check address
          </button>
        </GlassCard>
      )}

      {checking && (
        <div className="flex items-center gap-sm text-on-surface-variant text-label-sm">
          <div className="flex gap-[4px]">
            <span className="typing-dot w-2 h-2 rounded-full bg-primary-container" />
            <span className="typing-dot w-2 h-2 rounded-full bg-primary-container" />
            <span className="typing-dot w-2 h-2 rounded-full bg-primary-container" />
          </div>
          Checking address on-chain...
        </div>
      )}

      {result && !checking && (
        <GlassCard className="p-md flex flex-col gap-sm">
          <div className="text-label-sm text-outline font-mono break-all">{result.address}</div>

          {result.risks.length === 0 ? (
            <div className="text-label-sm text-emerald-400">No anomalies detected.</div>
          ) : (
            <ul className="flex flex-col gap-xs">
              {result.risks.map((r, i) => (
                <li key={i} className="text-label-sm text-yellow-500/90 flex items-start gap-xs">
                  <span className="material-symbols-outlined text-[16px] mt-[1px]">warning</span>
                  {r}
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-col gap-sm mt-xs">
            <button
              onClick={continueToSend}
              disabled={!TON_ADDRESS_RE.test(result.address)}
              className="w-full bg-primary-container text-black font-medium py-[14px] rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Use this address
            </button>
            <button
              onClick={scanAgain}
              className="w-full border border-white/10 text-on-surface font-medium py-[12px] rounded-xl hover:bg-white/5 transition-all"
            >
              Scan again
            </button>
          </div>
        </GlassCard>
      )}
    </ScreenLayout>
  )
}
