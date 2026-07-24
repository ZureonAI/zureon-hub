'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

// hub-demo/index.html embeds this app in an <iframe> and shows its own
// outer label/title above it, updated only when its OWN menu buttons are
// clicked. Any navigation that happens *inside* this app instead — the
// Onboarding screen's "Get started" / "I already have a wallet" buttons,
// or its auto-redirect to /dashboard when onboarding was already completed
// — changes the iframe's content without the outer shell ever finding out,
// so its label stays stuck on "Onboarding" while the Dashboard is showing
// underneath (reported 2026-07-12, reproduced on iPhone 11 Pro).
//
// The shell already listens for a { type: 'zureon:navigate', route } message
// (see the `window.addEventListener('message', ...)` in hub-demo/index.html)
// — it just never received one, because nothing in this app ever sent it.
// This component is the missing sender: it runs on every route change,
// wherever it's mounted, and is silently a no-op when not actually inside
// that iframe (`window.parent === window`).
export function DemoFrameSync() {
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window === 'undefined' || window.parent === window) return
    // First path segment after basePath (next.config.ts basePath: '/hub-dist'
    // is already stripped from usePathname()'s value) — matches the shell's
    // route keys: onboarding, dashboard, send, swap, explore, learn, nfts, scan.
    const route = pathname.split('/').filter(Boolean)[0]
    if (!route) return
    try {
      // Target our own origin, not '*': the demo shell is same-origin (both on
      // zureon.app), so this still delivers, but a malicious cross-origin page
      // that embeds this app receives nothing.
      window.parent.postMessage({ type: 'zureon:navigate', route }, window.location.origin)
    } catch {
      // cross-origin or otherwise inaccessible parent — nothing to do
    }
  }, [pathname])

  return null
}
