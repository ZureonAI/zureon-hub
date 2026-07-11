'use client'
import { useTonConnectUI, useTonAddress, useTonWallet } from '@tonconnect/ui-react'
import { useEffect } from 'react'
import { useStore } from '@/lib/store'
import { getAccount } from '@/lib/tonapi'
import { formatAddress } from '@/lib/tonapi'

export function WalletButton() {
  const [tonConnectUI] = useTonConnectUI()
  const address = useTonAddress()
  const wallet = useTonWallet()
  const setWallet = useStore(s => s.setWallet)

  useEffect(() => {
    if (wallet && address) {
      const walletName = (wallet as { device?: { appName?: string } }).device?.appName ?? null
      setWallet({ connected: true, address, walletName, balanceNano: null })
      // Fetch real balance
      getAccount(address)
        .then(acc => setWallet({ balanceNano: acc.balance }))
        .catch(() => {})
    } else {
      setWallet({ connected: false, address: null, walletName: null, balanceNano: null })
    }
  }, [wallet, address, setWallet])

  if (wallet && address) {
    return (
      <div className="relative group">
        <button className="glass-card border border-primary-container/30 text-on-surface text-label-sm py-[6px] pl-[10px] pr-[8px] rounded-full flex items-center gap-xs active:scale-[0.96] hover:bg-white/5 transition-all duration-200">
          <span className="w-[6px] h-[6px] rounded-full bg-primary-container" />
          <span className="text-white">{formatAddress(address)}</span>
          <span className="material-symbols-outlined text-[16px] text-on-surface-variant">expand_more</span>
        </button>
        <div className="hidden group-focus-within:block absolute right-0 top-[calc(100%+6px)] glass-card rounded-lg border border-white/10 min-w-[180px] py-xs z-[60] shadow-xl">
          <div className="px-md py-xs text-label-sm text-on-surface-variant border-b border-white/10 mb-xs">
            {(wallet as { device?: { appName?: string } }).device?.appName ?? 'TON Wallet'}
          </div>
          <button
            onClick={() => tonConnectUI.disconnect()}
            className="w-full text-left px-md py-xs text-label-md text-error hover:bg-white/5 transition-colors flex items-center gap-xs"
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
            Disconnect
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => { if (!tonConnectUI.connected) tonConnectUI.openModal() }}
      className="bg-primary-container text-black text-label-md py-[6px] px-[14px] rounded-full flex items-center gap-xs active:scale-[0.96] hover:opacity-90 transition-all duration-200"
    >
      <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
      Connect
    </button>
  )
}
