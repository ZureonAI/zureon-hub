'use client'
import { useRouter } from 'next/navigation'
import { ScreenLayout } from '@/components/layout/ScreenLayout'
import { GlassCard } from '@/components/ui/GlassCard'

const LESSONS: Record<string, { title: string; duration: string; content: string[] }> = {
  'what-is-ton':  { title: 'What is TON?', duration: '3 min', content: ['TON (The Open Network) is a fast, scalable Layer-1 blockchain originally developed by Telegram.', 'TON processes transactions in seconds with fees under $0.01 — making it practical for everyday use.', 'The native currency is Toncoin (TON). It powers transactions, staking, and the wider TON ecosystem.', 'TON supports Jettons (fungible tokens), NFTs, DNS names, and decentralized applications.'] },
  'wallets':      { title: 'TON Wallets', duration: '4 min', content: ['A TON wallet stores your private key and lets you sign transactions — you own your funds.', 'Popular wallets: Tonkeeper, MyTonWallet, Tonhub. All support TON Connect 2.0 for dApp connections.', 'Your wallet has two address formats — UQ... (non-bounceable) and EQ... (bounceable). Both are the same account.', 'Never share your seed phrase. No wallet or support team will ever ask for it.'] },
  'transactions': { title: 'How transactions work', duration: '5 min', content: ['Every TON transaction includes: sender, recipient, amount (nanotons), and an optional memo.', 'Transactions require a network fee (~0.005–0.02 TON). This fee goes to validators, not ZUREON.', 'TON transactions confirm in ~5 seconds. Fees are predictable — no mempool auction.', 'Always verify the recipient address. Transactions on TON are irreversible.'] },
  'jettons':      { title: 'Jettons — TON tokens', duration: '4 min', content: ['Jettons are TON\'s fungible token standard — equivalent to ERC-20 on Ethereum.', 'Popular Jettons: USDT (Tether on TON), NOT, SCALE, DOGS, STORM.', 'Each Jetton has a unique contract address. Verify the contract before buying or swapping.', 'Jetton transfers require a small TON fee (~0.05–0.1 TON) for gas, in addition to the Jetton amount.'] },
  'dex':          { title: 'Using a DEX safely', duration: '6 min', content: ['DEX (Decentralized Exchange) lets you swap tokens without a central intermediary.', 'TON DEXes: STON.fi and DeDust. Both use AMM (Automated Market Maker) model.', 'Check price impact before swapping. High impact (>5%) means low liquidity — worse execution.', 'Slippage tolerance: how much price movement you accept. 0.5–1% is normal for liquid pairs.', 'Always verify the token contract address. Fake tokens can look identical to real ones.'] },
  'security':     { title: 'Seed phrase security', duration: '5 min', content: ['Your seed phrase (12 or 24 words) is the master key to your wallet. Anyone with it controls your funds.', 'Write it on paper. Store in multiple secure offline locations. Never photograph it or store digitally.', 'Never enter your seed phrase online, in any app other than your wallet, or share it with anyone.', 'ZUREON never asks for your seed phrase. Signing happens entirely in your wallet app.'] },
  'scams':        { title: 'Common TON scams', duration: '4 min', content: ['Fake airdrops: "Claim your free TON" links that drain your wallet when you connect and sign.', 'Impersonation: Scammers pose as Telegram support, project founders, or ZUREON staff.', 'Honeypot tokens: Tokens you can buy but cannot sell — the contract blocks outgoing transfers.', 'Rule: If something sounds too good to be true (free money, guaranteed returns) — it\'s a scam.'] },
  'nfts':         { title: 'NFTs on TON', duration: '4 min', content: ['TON NFTs follow the TEP-62 and TEP-64 standards. Each NFT is a separate smart contract.', 'Marketplace: Getgems is the primary TON NFT marketplace. Fragment handles Telegram usernames.', 'NFT collections include profile pictures, in-game items, Telegram names, and virtual real estate.', 'Verify collection contracts on TON Explorer before buying. Floor price manipulation is common.'] },
}

export function LessonDetail({ lesson }: { lesson: string }) {
  const router = useRouter()
  const data = LESSONS[lesson]

  if (!data) {
    return (
      <ScreenLayout showBack backHref="/learn">
        <div className="text-on-surface-variant">Lesson not found.</div>
      </ScreenLayout>
    )
  }

  return (
    <ScreenLayout showBack backHref="/learn">
      <GlassCard className="p-md">
        <div className="text-label-sm text-on-surface-variant mb-xs uppercase tracking-wider">{data.duration} read</div>
        <h1 className="text-xl font-semibold text-white mb-md leading-tight">{data.title}</h1>
        <div className="flex flex-col gap-md">
          {data.content.map((para, i) => (
            <p key={i} className="text-body-md text-on-surface leading-relaxed">{para}</p>
          ))}
        </div>
      </GlassCard>

      <button
        onClick={() => router.push('/learn')}
        className="w-full glass-card border border-white/10 text-on-surface text-label-md py-sm px-md rounded-xl flex items-center justify-center gap-xs active:scale-[0.96] hover:bg-white/5 transition-all"
      >
        Back to all lessons
      </button>
    </ScreenLayout>
  )
}
