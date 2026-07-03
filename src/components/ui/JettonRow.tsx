import { TokenIcon } from './TokenIcon'
import type { JettonBalance } from '@/types/jetton'

interface Props {
  jetton: JettonBalance
  onClick?: () => void
}

export function JettonRow({ jetton, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="glass-card rounded-[16px] p-[16px] flex items-center justify-between w-full border-white/5 hover:bg-white/[0.03] transition-colors active:scale-[0.98] text-left"
    >
      <div className="flex items-center gap-md">
        <TokenIcon src={jetton.image} symbol={jetton.symbol} size={40} />
        <div>
          <div className="text-label-md text-white flex items-center gap-xs">
            {jetton.name || jetton.symbol}
          </div>
          <div className="text-label-sm text-on-surface-variant">{jetton.symbol}</div>
        </div>
      </div>
      <div className="text-right">
        <div className="text-label-md text-white">
          {jetton.balanceFormatted} {jetton.symbol}
        </div>
        {jetton.balanceUsd !== null && (
          <div className="text-label-sm text-on-surface-variant">
            ${jetton.balanceUsd.toFixed(2)}
          </div>
        )}
      </div>
    </button>
  )
}
