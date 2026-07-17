'use client'
import { useEffect } from 'react'
import type { WalletState } from '@/types/ton'
import type { TxEvent } from './useTransactions'
import { syncPortfolioToNative } from '@/lib/nativeBridge'

interface Params {
  wallet: WalletState
  tonPriceUsd: number
  txs: TxEvent[]
  aiLoading: boolean
}

/**
 * Pushes a portfolio snapshot to the native ContentProvider cache (no-op on web) whenever
 * the balance, price, or most recent transaction changes, so the launcher's home tile /
 * widget stays in sync while this screen is open. See src/lib/nativeBridge.ts.
 */
export function useNativeBridgeSync({ wallet, tonPriceUsd, txs, aiLoading }: Params) {
  useEffect(() => {
    if (!wallet.connected) return

    const tonAmount = wallet.balanceNano ? Number(wallet.balanceNano) / 1e9 : 0
    const totalUsd = tonPriceUsd > 0 ? tonAmount * tonPriceUsd : null

    syncPortfolioToNative({
      balanceTon: `${tonAmount.toFixed(2)} TON`,
      balanceUsd: totalUsd !== null ? totalUsd.toFixed(2) : '',
      aiStatus: aiLoading ? 'analyzing' : 'standby',
      lastTx: formatLastTx(txs[0], wallet.address),
    })
  }, [wallet.connected, wallet.address, wallet.balanceNano, tonPriceUsd, txs, aiLoading])
}

function formatLastTx(tx: TxEvent | undefined, walletAddress: string | null): string {
  if (!tx) return ''
  const action = tx.actions[0]
  if (!action) return ''

  let amount: string
  if (action.TonTransfer) {
    const t = action.TonTransfer
    const isIncoming = t.recipient.address === walletAddress
    amount = `${isIncoming ? '+' : '-'}${(t.amount / 1e9).toFixed(4)} TON`
  } else if (action.JettonTransfer) {
    const j = action.JettonTransfer
    const isIncoming = j.recipient?.address === walletAddress
    const val = (Number(j.amount) / Math.pow(10, j.jetton.decimals)).toFixed(2)
    amount = `${isIncoming ? '+' : '-'}${val} ${j.jetton.symbol}`
  } else {
    return ''
  }

  return `${amount} · ${relativeTime(tx.timestamp * 1000)}`
}

function relativeTime(ms: number): string {
  const diffSec = Math.max(0, Math.floor((Date.now() - ms) / 1000))
  if (diffSec < 60) return 'just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay}d ago`
}
