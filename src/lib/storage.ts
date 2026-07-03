/**
 * localStorage migration registry.
 *
 * Centralizes keys so renames in the future require updating ONE place,
 * with a versioned migration step that runs once per browser.
 *
 * Usage at app boot (layout.tsx):
 *   useEffect(() => { runMigrations() }, [])
 */

export const STORAGE_KEYS = {
  ONBOARDING_DONE:        'zureon_onboarding_done',
  PROFILE_INSIGHT_PREFIX: 'zureon_profile_insight_',
} as const

const MIGRATION_VERSION_KEY = 'zureon_storage_version'
const CURRENT_VERSION = 1

// Add new migrations as { from: N, to: N+1, run: () => void }
const MIGRATIONS: Array<{ from: number; to: number; run: () => void }> = [
  // {
  //   from: 1, to: 2,
  //   run: () => {
  //     const old = localStorage.getItem('legacy_key')
  //     if (old) {
  //       localStorage.setItem(STORAGE_KEYS.ONBOARDING_DONE, old)
  //       localStorage.removeItem('legacy_key')
  //     }
  //   },
  // },
]

export function runMigrations(): void {
  if (typeof window === 'undefined') return
  try {
    let current = Number(localStorage.getItem(MIGRATION_VERSION_KEY) || '0')
    for (const m of MIGRATIONS) {
      if (current === m.from) {
        m.run()
        current = m.to
        localStorage.setItem(MIGRATION_VERSION_KEY, String(current))
      }
    }
    if (current !== CURRENT_VERSION) {
      localStorage.setItem(MIGRATION_VERSION_KEY, String(CURRENT_VERSION))
    }
  } catch { /* quota or private-mode — silent, app still works */ }
}

// Convenience helpers with try/catch so callers don't have to
export function getItem(key: string): string | null {
  try { return localStorage.getItem(key) } catch { return null }
}
export function setItem(key: string, value: string): void {
  try { localStorage.setItem(key, value) } catch { /* silent */ }
}
export function removeItem(key: string): void {
  try { localStorage.removeItem(key) } catch { /* silent */ }
}
