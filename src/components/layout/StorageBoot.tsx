'use client'
import { useEffect } from 'react'
import { runMigrations } from '@/lib/storage'

/** Runs localStorage migrations once on app mount. */
export function StorageBoot() {
  useEffect(() => { runMigrations() }, [])
  return null
}
