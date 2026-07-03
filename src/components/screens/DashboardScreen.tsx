'use client'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { useJettons } from '@/hooks/useJettons'
import { useTonPrice } from '@/hooks/useTonPrice'
import { ScreenLayout } from '@/components/layout/ScreenLayout'
import { GlassCard } from '@/components/ui/GlassCard'
import { JettonRow } from '@/components/ui/JettonRow'
import { TokenIcon } from '@/components/ui/TokenIcon'
import { formatAddress, formatTon } from '@/lib/tonapi'
import { useTonConnectUI } from '@tonconnect/ui-react'
import { useTransactions, TxEvent } from '@/hooks/useTransactions'
import { useProfileInsight } from '@/hooks/useProfileInsight'

export function DashboardScreen() {
  useTonPrice()
  const router = useRouter()
  const wallet = useStore(s => s.wallet)
  const [tonConnectUI] = useTonConnectUI()
  const tonPriceUsd = useStore(s => s.tonPriceUsd)
  const { jettons, loading: jettonsLoading } = useJettons()
  const { txs, loading: txLoading } = useTransactions(wallet.address ?? undefined)

  const tonAmount = wallet.balanceNano ? Number(wallet.balanceNano) / 1e9 : 0
  const totalUsd = tonPriceUsd > 0 ? tonAmount * tonPriceUsd : null

  function navigate(path: string) {
    if (!wallet.connected) {
      tonConnectUI.openModal()
      return
    }
    router.push(path)
  }

  return (
    <ScreenLayout>
      {/* Balance hero */}
      <GlassCard className="p-[20px] md:p-lg relative overflow-hidden flex flex-col gap-md">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary-container opacity-[0.03] blur-3xl rounded-full pointer-events-none" />

        <div className="flex flex-col gap-xs">
          <h2 className="text-label-md text-on-surface-variant uppercase tracking-wider">
            {wallet.connected ? 'Total Balance' : 'TON Network · Live'}
          </h2>
          <div className="text-display tracking-tight text-white flex items-baseline gap-sm">
            {wallet.connected && totalUsd !== null ? (
              <>
                <span>${Math.floor(totalUsd).toLocaleString()}</span>
                <span className="text-headline-md text-on-surface-variant">
                  .{(totalUsd % 1).toFixed(2).substring(1)}
                </span>
              </>
            ) : tonPriceUsd > 0 ? (
              <>
                <span>${tonPriceUsd.toFixed(2)}</span>
                <span className="text-headline-md text-on-surface-variant"> / TON</span>
              </>
            ) : (
              <span className="text-on-surface-variant">—</span>
            )}
          </div>
          <div className="text-label-md text-primary-container mt-1">
            {wallet.connected
              ? `${tonAmount.toLocaleString(undefined, { maximumFractionDigits: 6 })} TON · on-chain`
              : 'Connect a TON wallet to see your portfolio'}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-md mt-sm">
          <button
            onClick={() => navigate('/send')}
            className="flex-1 min-w-[120px] bg-primary-container text-black text-label-md py-sm px-md rounded-lg flex items-center justify-center gap-xs active:scale-[0.96] hover:opacity-90 transition-all duration-200"
          >
            <span className="material-symbols-outlined text-[18px]">send</span>
            Send
          </button>
          <button
            onClick={() => navigate('/receive')}
            className="flex-1 min-w-[120px] glass-card border-secondary-container text-on-surface text-label-md py-sm px-md rounded-xl flex items-center justify-center gap-xs active:scale-[0.96] hover:bg-white/5 transition-all duration-200"
          >
            <span className="material-symbols-outlined text-[18px]">call_received</span>
            Receive
          </button>
          <button
            onClick={() => navigate('/swap')}
            className="flex-1 min-w-[120px] glass-card text-on-surface text-label-md py-sm px-md rounded-xl flex items-center justify-center gap-xs active:scale-[0.96] hover:bg-white/5 transition-all duration-200"
          >
            <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
            Swap
          </button>
        </div>
      </GlassCard>

      {/* AI hint */}
      <div className="bg-[#1A1A1A] opacity-90 border border-white/5 rounded-lg p-[12px] flex items-start gap-sm">
        <span className="material-symbols-outlined text-outline text-[18px] mt-[2px]">lightbulb</span>
        <p className="text-label-sm text-on-surface-variant leading-relaxed flex-1">
          {wallet.connected
            ? 'ZUREON reviews every transaction with AI before you sign — fees explained, risks flagged, your security protected.'
            : 'Connect your TON wallet to start. ZUREON guides every transaction with AI review before you sign.'}
        </p>
      </div>

      {/* Assets */}
      <section className="flex flex-col gap-md">
        <h3 className="text-headline-md text-on-surface tracking-tight">Your Assets</h3>

        {!wallet.connected ? (
          <GlassCard className="p-[24px] flex flex-col items-center gap-md text-center">
            <div className="w-12 h-12 rounded-full bg-primary-container/15 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary-container text-[24px]">account_balance_wallet</span>
            </div>
            <div className="flex flex-col gap-xs">
              <div className="text-label-md text-white">No wallet connected</div>
              <div className="text-label-sm text-on-surface-variant max-w-[280px]">
                ZUREON guides every TON transaction with AI review. Connect your wallet to start.
              </div>
            </div>
            <button
              onClick={() => tonConnectUI.openModal()}
              className="w-full bg-primary-container text-black font-medium py-[14px] px-md rounded-xl flex items-center justify-center gap-xs active:scale-[0.96] hover:opacity-90 transition-all shadow-[0_0_10px_rgba(0,212,255,0.08)]"
            >
              <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
              Connect TON Wallet
            </button>
          </GlassCard>
        ) : (
          <>
            {/* TON native */}
            <button
              onClick={() => router.push('/asset/TON')}
              className="glass-card rounded-[16px] p-[16px] flex items-center justify-between w-full border-primary-container/20 hover:bg-white/[0.03] transition-colors active:scale-[0.98]"
            >
              <div className="flex items-center gap-md">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center border border-primary-container/40"
                  style={{ background: 'radial-gradient(circle at 30% 30%, #00D4FF33, #00D4FF0a)' }}
                >
                  <span className="font-bold text-primary-container text-[16px]">TON</span>
                </div>
                <div>
                  <div className="text-label-md text-white flex items-center gap-xs">
                    Toncoin
                    <span className="text-[9px] uppercase tracking-wider text-primary-container/80 border border-primary-container/40 rounded-full px-[6px] py-[1px]">live</span>
                  </div>
                  <div className="text-label-sm text-on-surface-variant">
                    {wallet.address ? formatAddress(wallet.address) : '—'}
                  </div>
                </div>
              </div>
              <div className="text-right">
                {wallet.balanceNano !== null ? (
                  <div className="text-label-md text-white">{formatTon(wallet.balanceNano)}</div>
                ) : (
                  <div className="w-16 h-3 rounded bg-white/10 animate-pulse ml-auto" aria-label="Loading balance" />
                )}
                {totalUsd !== null ? (
                  <div className="text-label-sm text-on-surface-variant">${totalUsd.toFixed(2)}</div>
                ) : wallet.balanceNano !== null && tonPriceUsd === 0 ? (
                  <div className="w-10 h-2 rounded bg-white/[0.06] animate-pulse ml-auto mt-[6px]" />
                ) : null}
              </div>
            </button>

            {/* Jettons */}
            {jettonsLoading && (
              <div className="flex flex-col gap-md" aria-label="Loading tokens" aria-busy="true">
                {[0, 1, 2].map(i => (
                  <div key={i} className="glass-card rounded-[16px] p-[16px] flex items-center justify-between animate-pulse">
                    <div className="flex items-center gap-md">
                      <div className="w-10 h-10 rounded-full bg-white/10" />
                      <div className="flex flex-col gap-[6px]">
                        <div className="w-20 h-3 rounded bg-white/10" />
                        <div className="w-14 h-2 rounded bg-white/[0.06]" />
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-[6px]">
                      <div className="w-16 h-3 rounded bg-white/10" />
                      <div className="w-10 h-2 rounded bg-white/[0.06]" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!jettonsLoading && jettons.length > 0 && (
              <div className="flex flex-col gap-md">
                {jettons.map(j => (
                  <JettonRow
                    key={j.jettonAddress}
                    jetton={j}
                    onClick={() => router.push(`/asset/${j.symbol}`)}
                  />
                ))}
              </div>
            )}

            {!jettonsLoading && jettons.length === 0 && (
              <div className="glass-card rounded-[16px] p-[20px] flex flex-col items-center gap-sm text-center">
                <span className="material-symbols-outlined text-outline text-[28px]">token</span>
                <div className="text-label-sm text-on-surface-variant">No other tokens in this wallet</div>
              </div>
            )}
          </>
        )}

        {/* NFT Gallery entry point — always visible so it's discoverable before
            connecting a wallet; NFTsScreen itself prompts to connect if needed. */}
        <button
          onClick={() => router.push('/nfts')}
          className="glass-card rounded-[16px] p-[16px] flex items-center justify-between w-full border-white/5 hover:bg-white/[0.03] transition-colors active:scale-[0.98]"
        >
          <div className="flex items-center gap-md">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5">
              <span className="material-symbols-outlined text-primary-container text-[18px]">image</span>
            </div>
            <div className="text-label-md text-white">NFT Gallery</div>
          </div>
          <span className="material-symbols-outlined text-outline text-[20px]">chevron_right</span>
        </button>
      </section>

      {/* AI Profile Insight */}
      {wallet.connected && <ProfileInsightCard />}

      {/* Transaction History */}
      {wallet.connected && (
        <section className="flex flex-col gap-md">
          <h3 className="text-headline-md text-on-surface tracking-tight">Recent Activity</h3>

          {txLoading && (
            <div className="flex flex-col gap-md" aria-busy="true">
              {[0, 1, 2].map(i => (
                <div key={i} className="glass-card rounded-[16px] p-[16px] flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-md">
                    <div className="w-9 h-9 rounded-full bg-white/10" />
                    <div className="flex flex-col gap-[6px]">
                      <div className="w-24 h-3 rounded bg-white/10" />
                      <div className="w-16 h-2 rounded bg-white/[0.06]" />
                    </div>
                  </div>
                  <div className="w-14 h-3 rounded bg-white/10" />
                </div>
              ))}
            </div>
          )}

          {!txLoading && txs.length === 0 && (
            <div className="glass-card rounded-[16px] p-[20px] flex flex-col items-center gap-sm text-center">
              <span className="material-symbols-outlined text-outline text-[28px]">receipt_long</span>
              <div className="text-label-sm text-on-surface-variant">No recent transactions</div>
            </div>
          )}

          {!txLoading && txs.length > 0 && (
            <div className="flex flex-col gap-md">
              {txs.map(tx => <TxRow key={tx.event_id} tx={tx} walletAddress={wallet.address ?? ''} />)}
            </div>
          )}
        </section>
      )}

    </ScreenLayout>
  )
}

function TxRow({ tx, walletAddress }: { tx: TxEvent; walletAddress: string }) {
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

function ProfileInsightCard() {
  const { text, loading, error, refresh } = useProfileInsight()

  if (!text && !loading && !error) return null

  return (
    <section className="flex flex-col gap-sm">
      <GlassCard className="p-md flex flex-col gap-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-sm">
            <div className="w-8 h-8 rounded-full bg-primary-container/15 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-primary-container text-[18px]">insights</span>
            </div>
            <div>
              <div className="text-label-md font-semibold text-white">Portfolio Insight</div>
              <div className="text-[10px] text-on-surface-variant">AI · daily review</div>
            </div>
          </div>
          {!loading && (
            <button
              onClick={refresh}
              className="text-on-surface-variant hover:text-primary-container transition-colors p-xs"
              aria-label="Refresh insight"
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
            </button>
          )}
        </div>

        {loading && (
          <div className="flex items-center gap-sm text-on-surface-variant text-label-sm py-xs">
            <div className="flex gap-[4px]">
              <span className="typing-dot w-2 h-2 rounded-full bg-primary-container" />
              <span className="typing-dot w-2 h-2 rounded-full bg-primary-container" />
              <span className="typing-dot w-2 h-2 rounded-full bg-primary-container" />
            </div>
            Analyzing your portfolio...
          </div>
        )}

        {error && !loading && (
          <div className="text-yellow-500/80 text-label-sm">
            Couldn&apos;t generate insight right now. Try again later.
          </div>
        )}

        {text && !loading && (
          <div className="text-on-surface text-[13px] leading-relaxed whitespace-pre-wrap">
            {text}
          </div>
        )}
      </GlassCard>
    </section>
  )
}
