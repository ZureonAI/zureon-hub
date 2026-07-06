'use client'
import { useEffect } from 'react'
import { STORAGE_KEYS, getItem } from '@/lib/storage'

// Root of the hub (served under basePath '/hub-dist') → onboarding on first
// visit, straight to dashboard once it's been completed or skipped.
// Client-side check because ONBOARDING_DONE lives in localStorage, which
// isn't available during static export / server render.
export default function HubRoot() {
  useEffect(() => {
    const done = getItem(STORAGE_KEYS.ONBOARDING_DONE) === '1'
    window.location.replace(done ? 'dashboard/' : 'onboarding/')
  }, [])

  return <div className="bg-black min-h-screen" />
}
