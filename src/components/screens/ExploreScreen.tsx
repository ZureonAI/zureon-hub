'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ScreenLayout } from '@/components/layout/ScreenLayout'

// risk: 'low' | 'medium' | 'high'
const PROJECTS = [
  { id: 'stonfi',     name: 'STON.fi',        tagline: 'The largest DEX on TON',         category: 'DEX',           risk: 'low',    logo: 'https://www.google.com/s2/favicons?domain=ston.fi&sz=128',        bg: 'bg-cyan-400/10',    tvl: '$78M',  volume24h: '$12M', description: 'STON.fi is the leading decentralized exchange on TON, offering low-slippage swaps, liquidity pools, and yield farming.' },
  { id: 'dedust',    name: 'DeDust',          tagline: 'Native DEX with AMM v2',         category: 'DEX',           risk: 'low',    logo: 'https://www.google.com/s2/favicons?domain=dedust.io&sz=128',      bg: 'bg-blue-400/10',    tvl: '$25M',  volume24h: '$3M',  description: 'DeDust is a TON-native AMM with concentrated liquidity, focused on capital efficiency for Jetton trading.' },
  { id: 'evaa',      name: 'EVAA Protocol',   tagline: 'Lend & borrow on TON',           category: 'Lending',       risk: 'medium', logo: 'https://www.google.com/s2/favicons?domain=evaa.finance&sz=128',   bg: 'bg-emerald-400/10', tvl: '$32M',  volume24h: '—',    description: 'EVAA is the first decentralized lending protocol on TON, audited by Certik. Supply assets to earn yield or borrow.' },
  { id: 'tonstakers', name: 'Tonstakers',     tagline: 'Liquid staking for TON',         category: 'Staking',       risk: 'low',    logo: 'https://www.google.com/s2/favicons?domain=tonstakers.com&sz=128', bg: 'bg-amber-400/10',   tvl: '$340M', volume24h: '—',    description: 'Tonstakers lets you stake TON and receive tsTON — a liquid token that accrues staking rewards while remaining tradable.' },
  { id: 'getgems',   name: 'Getgems',         tagline: "TON's flagship NFT marketplace", category: 'NFT',           risk: 'medium', logo: 'https://www.google.com/s2/favicons?domain=getgems.io&sz=128',     bg: 'bg-purple-400/10',  tvl: '—',     volume24h: '$1.2M',description: 'Getgems is the largest NFT marketplace on TON. Browse collections, buy and sell with TON.' },
  { id: 'tonkeeper', name: 'Tonkeeper',       tagline: 'The most-used TON wallet',       category: 'Wallet',        risk: 'low',    logo: 'https://www.google.com/s2/favicons?domain=tonkeeper.com&sz=128',  bg: 'bg-cyan-400/10',    tvl: '—',     volume24h: '—',    description: 'Tonkeeper is a self-custodial mobile + browser wallet for TON. Supports TON Connect 2.0, Jettons, NFTs and dApps.' },
  { id: 'tondns',    name: 'TON DNS',         tagline: 'Human-readable .ton names',      category: 'Infrastructure',risk: 'low',    logo: 'https://www.google.com/s2/favicons?domain=dns.ton.org&sz=128',    bg: 'bg-rose-400/10',    tvl: '—',     volume24h: '—',    description: 'TON DNS maps human-readable .ton domain names to wallet addresses and smart contracts.' },
  { id: 'fragment',  name: 'Fragment',        tagline: 'Telegram usernames on TON',      category: 'Infrastructure',risk: 'low',    logo: 'https://www.google.com/s2/favicons?domain=fragment.com&sz=128',   bg: 'bg-cyan-400/10',    tvl: '—',     volume24h: '—',    description: 'Fragment is the official marketplace for Telegram usernames and anonymous numbers, powered by TON blockchain auctions.' },
]

const RISK_BADGE: Record<string, { label: string; classes: string }> = {
  low:    { label: 'Low risk',    classes: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10' },
  medium: { label: 'Med risk',    classes: 'text-yellow-400  border-yellow-400/30  bg-yellow-400/10'  },
  high:   { label: 'High risk',   classes: 'text-red-400     border-red-400/30     bg-red-400/10'     },
}

const CATEGORIES = ['All', 'DEX', 'Lending', 'Staking', 'NFT', 'Wallet', 'Infrastructure']

export function ExploreScreen() {
  const router = useRouter()
  const [filter, setFilter] = useState('All')
  const [query, setQuery] = useState('')

  const filtered = PROJECTS.filter(p => {
    if (filter !== 'All' && p.category !== filter) return false
    if (!query) return true
    return (p.name + p.tagline + p.description + p.category).toLowerCase().includes(query.toLowerCase())
  })

  return (
    <ScreenLayout>
      {/* Search */}
      <div className="flex items-center gap-[8px] w-full">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-[10px] top-1/2 -translate-y-1/2 text-outline text-[18px] pointer-events-none">search</span>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search TON protocols, projects…"
            className="w-full bg-[#1E1E1E]/60 backdrop-blur-xl border-b-2 border-white/10 focus:border-primary-container rounded-t-xl text-body-md text-on-surface placeholder:text-outline transition-colors outline-none py-[12px] pl-[36px] pr-[12px]"
          />
        </div>
      </div>

      {/* Curated header */}
      <div className="bg-[#1E1E1E]/40 border border-white/5 rounded-xl p-md flex flex-col gap-sm">
        <div className="flex items-center justify-between gap-sm">
          <p className="text-[10px] text-primary-container uppercase tracking-wider font-semibold">Curated TON Ecosystem</p>
          <span className="px-2 py-[2px] rounded-full border border-white/10 bg-white/[0.03] text-on-surface-variant text-[9px] uppercase tracking-wide font-semibold">Live data in V2</span>
        </div>
        <p className="text-body-md text-on-surface-variant">{PROJECTS.length} verified TON protocols, each shown with risk context and an AI safety check before you interact.</p>
        <span className="px-3 py-1 rounded-full border border-yellow-500/20 bg-yellow-500/10 text-yellow-400 text-[10px] uppercase tracking-wide font-semibold w-fit">Not financial advice</span>
      </div>

      {/* Category chips */}
      <div className="flex gap-[8px] overflow-x-auto no-scrollbar pb-1">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`flex-shrink-0 px-md py-[6px] rounded-full text-[12px] font-semibold transition-colors ${
              filter === cat
                ? 'bg-primary-container text-black'
                : 'bg-[#1E1E1E]/60 border border-white/10 text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Project cards */}
      <div className="flex flex-col gap-[12px]">
        {filtered.length === 0 && (
          <p className="text-center text-on-surface-variant text-sm py-md">No projects match your filter.</p>
        )}
        {filtered.map(p => (
          <div
            key={p.id}
            className="bg-[#1E1E1E]/60 border border-white/10 rounded-xl p-[16px] flex flex-col gap-[10px] cursor-pointer hover:border-primary-container/30 transition-all active:scale-[0.99]"
            onClick={() => router.push(`/explore/${p.id}`)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-[10px]">
                <div className={`w-10 h-10 rounded-lg ${p.bg} border border-white/5 flex items-center justify-center flex-shrink-0 overflow-hidden`}>
                  <img src={p.logo} alt={p.name} className="w-8 h-8 rounded object-contain" />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-on-surface leading-tight">{p.name}</h3>
                  <p className="text-[12px] text-outline mt-[2px]">{p.tagline} · {p.category}</p>
                </div>
              </div>
              <span className={`px-[8px] py-[4px] rounded-full border text-[10px] uppercase tracking-wide font-semibold flex-shrink-0 ${RISK_BADGE[p.risk].classes}`}>{RISK_BADGE[p.risk].label}</span>
            </div>
            <p className="text-[13px] text-on-surface-variant leading-snug">{p.description.split('. ')[0]}.</p>
            <div className="flex items-center gap-md text-[11px] text-on-surface-variant">
              {p.tvl !== '—' && <span>TVL: <span className="text-on-surface font-medium">{p.tvl}</span></span>}
              {p.volume24h !== '—' && <span>Vol 24h: <span className="text-on-surface font-medium">{p.volume24h}</span></span>}
              <span className="material-symbols-outlined text-primary-container text-[14px] ml-auto">arrow_forward</span>
            </div>
          </div>
        ))}
      </div>
    </ScreenLayout>
  )
}
