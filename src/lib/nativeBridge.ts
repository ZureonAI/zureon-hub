import { Capacitor, registerPlugin } from '@capacitor/core'

interface PortfolioSnapshot {
  balanceTon: string
  balanceUsd: string
  aiStatus: string
  lastTx: string
}

interface PortfolioBridgePlugin {
  update(snapshot: PortfolioSnapshot): Promise<void>
}

// Native implementation lives in android/app/src/main/java/app/zureon/hub/PortfolioBridgePlugin.java
// (registered manually in MainActivity, not via npm — this is a local plugin, not a package).
const PortfolioBridge = registerPlugin<PortfolioBridgePlugin>('PortfolioBridge')

/**
 * Pushes the current wallet snapshot to the native ContentProvider cache so the ZUREON
 * launcher's home-screen tile and widget can read it. No-ops on web (marketing site /
 * local dev) — this only does anything inside the Capacitor Android wrapper.
 */
export function syncPortfolioToNative(snapshot: PortfolioSnapshot): void {
  if (!Capacitor.isNativePlatform()) return
  PortfolioBridge.update(snapshot).catch(() => {
    // Best-effort — the launcher tile just shows stale/empty data if this fails.
  })
}
