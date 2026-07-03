'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { STORAGE_KEYS, getItem, setItem } from '@/lib/storage'

const STEPS = [
  { icon: 'lock',          title: 'Your crypto.\nOnly on your device.',  subtitle: 'Your keys are stored securely on your device' },
  { icon: 'auto_awesome',  title: 'AI guides\nevery step.',              subtitle: 'ZUREON reviews transactions before you sign' },
  { icon: 'verified_user', title: 'You stay\nin control.',               subtitle: 'Nothing is sent without your explicit approval' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const current = STEPS[step]

  useEffect(() => {
    if (getItem(STORAGE_KEYS.ONBOARDING_DONE) === '1') {
      // Use sibling navigation so it works at root, in /hub-dist/, and after future renames.
      window.location.replace('../dashboard/')
    }
  }, [])

  function next() {
    if (step < STEPS.length - 1) {
      setStep(step + 1)
    } else {
      setItem(STORAGE_KEYS.ONBOARDING_DONE, '1')
      router.push('/dashboard')
    }
  }

  function skip() {
    setItem(STORAGE_KEYS.ONBOARDING_DONE, '1')
    router.push('/dashboard')
  }

  return (
    <div className="bg-black text-white h-screen w-full flex flex-col items-center justify-center px-[16px] relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[260px] h-[260px] bg-primary-container/6 rounded-full blur-[70px] pointer-events-none" />

      {/* Card */}
      <div className="w-full bg-[#1E1E1E]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col items-center text-center relative z-10 gap-4">
        {/* Icon */}
        <div className="w-16 h-16 bg-[#201f1f] rounded-2xl border border-white/5 flex items-center justify-center shadow-[0_0_15px_rgba(0,212,255,0.06)] animate-pulse">
          <span
            className="material-symbols-outlined text-primary-container text-[40px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {current.icon}
          </span>
        </div>

        {/* Text */}
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-white leading-snug tracking-tight whitespace-pre-line">
            {current.title}
          </h1>
          <p className="text-sm text-on-surface-variant">{current.subtitle}</p>
        </div>

        {/* Progress dots */}
        <div className="w-full flex items-center gap-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${i === step ? 'bg-primary-container shadow-[0_0_8px_rgba(0,212,255,0.2)]' : 'bg-white/10'}`}
            />
          ))}
        </div>

        {/* Next */}
        <button
          onClick={next}
          className="w-full bg-primary-container text-black font-medium py-3 rounded-xl flex items-center justify-center gap-2 active:scale-[0.96] transition-transform"
        >
          {step < STEPS.length - 1 ? 'Next' : 'Get started'}
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </button>

        {/* Skip */}
        <button
          onClick={skip}
          className="text-xs text-on-surface-variant hover:text-white transition-colors"
        >
          I already have a wallet
        </button>

        {/* Disclaimer inside card */}
        <p className="text-[10px] text-outline/50 leading-tight">
          ZUREON does not offer financial advice. Users are responsible for their own decisions.
        </p>
      </div>
    </div>
  )
}
