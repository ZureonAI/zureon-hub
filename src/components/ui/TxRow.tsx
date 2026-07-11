'use client'
import type { TxEvent } from '@/hooks/useTransactions'

// Single transaction row. Shared between the Dashboard "Recent Activity" list
// and the per-asset detail screen so both stay visually consistent.
export function TxRow({ tx, walletAddress }: { tx: TxEvent; walletAddress: string }) {
  const action = tx.actions[0]
  if (!action) return null

  const isScam = tx.is_scam

  let label = action.type
  let amount = ''
  let isIncoming = false

  if (action.TonTransfer) {
    const t = action.TonTransfer
    isIncoming = t.recipient.address === walletAddress
    const ton = (t.amount / 1e9).toFixed(3)
    amount = `${isIncoming ? '+' : '-'}${ton} TON`
    label = isIncoming ? 'Received TON' : 'Sent TON'
  } else if (action.JettonTransfer) {
    const j = action.JettonTransfer
    isIncoming = j.recipient?.address === walletAddress
    const val = (Number(j.amount) / Math.pow(10, j.jetton.decimals)).toFixed(2)
    amount = `${isIncoming ? '+' : '-'}${val} ${j.jetton.symbol}`
    label = isIncoming ? `Received ${j.jetton.symbol}` : `Sent ${j.jetton.symbol}`
  }

  const date = new Date(tx.timestamp * 1000)
  const timeStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

  return (
    <div className="glass-card rounded-[16px] p-[16px] flex items-center justify-between">
      <div className="flex items-center gap-md">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${isIncoming ? 'bg-emerald-400/10' : 'bg-primary-container/10'}`}>
          <span className="material-symbols-outlined text-[18px] text-primary-container">
            {isIncoming ? 'call_received' : 'send'}
          </span>
        </div>
        <div>
          <div className="text-label-md text-white flex items-center gap-xs">
            {isScam ? <span className="text-error">⚠ SCAM</span> : label}
          </div>
          <div className="text-label-sm text-on-surface-variant">{timeStr}</div>
        </div>
      </div>
      {amount && (
        <span className={`text-label-md font-medium ${isIncoming ? 'text-emerald-400' : 'text-on-surface'}`}>
          {amount}
        </span>
      )}
    </div>
  )
}
