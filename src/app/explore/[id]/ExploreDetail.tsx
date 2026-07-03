'use client'
import { useRouter } from 'next/navigation'
import { ScreenLayout } from '@/components/layout/ScreenLayout'
import { GlassCard } from '@/components/ui/GlassCard'
import { EXPLORE_PROJECTS } from '@/lib/explore-projects'

export function ExploreDetail({ id }: { id: string }) {
  const router = useRouter()
  const p = EXPLORE_PROJECTS[id]

  if (!p) {
    return (
      <ScreenLayout showBack>
        <div className="text-on-surface-variant text-center py-xl">Project not found.</div>
      </ScreenLayout>
    )
  }

  return (
    <ScreenLayout showBack>
      {/* Header */}
      <div className="flex items-start gap-md">
        <div className={`w-[56px] h-[56px] rounded-2xl ${p.bg} border border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden`}>
          <img src={p.logo} alt={p.name} className="w-10 h-10 rounded-xl object-contain" />
        </div>
        <div className="flex flex-col gap-[4px]">
          <div className="flex items-center gap-[8px] flex-wrap">
            <h1 className="text-xl font-semibold text-on-surface">{p.name}</h1>
            {p.verified && (
              <span className="px-[8px] py-[2px] rounded-full bg-primary-container/10 border border-primary-container/30 text-primary-container text-[10px] font-bold uppercase tracking-wide">
                Verified
              </span>
            )}
          </div>
          <p className="text-sm text-outline">{p.tagline}</p>
          <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">{p.category}</span>
        </div>
      </div>

      {/* About */}
      <GlassCard className="rounded-xl p-md flex flex-col gap-sm">
        <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">About Project</p>
        <p className="text-sm text-on-surface-variant leading-relaxed">{p.description}</p>
        {(p.tvl !== '—' || p.volume24h !== '—') && (
          <div className="grid grid-cols-2 gap-sm mt-xs">
            {p.tvl !== '—' && (
              <div className="bg-surface-container/30 rounded-xl p-sm">
                <p className="text-[10px] text-outline uppercase tracking-wide mb-[4px]">Total Value Locked</p>
                <p className="text-lg font-bold text-primary-container">{p.tvl}</p>
              </div>
            )}
            {p.volume24h !== '—' && (
              <div className="bg-surface-container/30 rounded-xl p-sm">
                <p className="text-[10px] text-outline uppercase tracking-wide mb-[4px]">24h Volume</p>
                <p className="text-lg font-bold text-primary-container">{p.volume24h}</p>
              </div>
            )}
          </div>
        )}
      </GlassCard>

      {/* ZUREON Insight */}
      <div className="border-l-2 border-primary-container/60 pl-sm flex items-start gap-sm">
        <span className="material-symbols-outlined text-primary-container text-[18px] mt-0.5 flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
        <div>
          <span className="text-xs text-primary-container font-semibold">ZUREON insight: </span>
          <span className="text-xs text-outline">{p.insight}</span>
        </div>
      </div>

      {/* Risk notes */}
      <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-3 flex items-start gap-sm">
        <span className="material-symbols-outlined text-yellow-400 text-[18px] mt-0.5 flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
        <div>
          <span className="text-xs text-yellow-400 font-semibold">Risk notes: </span>
          <span className="text-xs text-outline">{p.risks}</span>
        </div>
      </div>

      {/* What you can do */}
      <GlassCard className="rounded-xl p-md flex flex-col gap-sm">
        <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">What you can do</p>
        <div className="flex flex-col gap-[10px]">
          {p.actions.map((action, i) => (
            <div key={i} className="flex items-start gap-sm">
              <span className="material-symbols-outlined text-primary-container text-[18px] flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              <span className="text-sm text-on-surface-variant">{action}</span>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Open in browser */}
      <a
        href={p.url}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full bg-primary-container text-black font-medium py-[14px] px-md rounded-xl flex items-center justify-center gap-xs active:scale-[0.96] hover:opacity-90 transition-all shadow-[0_0_10px_rgba(0,212,255,0.08)]"
      >
        <span className="material-symbols-outlined text-[18px]">open_in_new</span>
        Open {p.name} in browser
      </a>

      <button
        onClick={() => router.push(`/explore/${id}/ask`)}
        className="w-full border border-white/10 text-on-surface font-medium py-[14px] px-md rounded-xl flex items-center justify-center gap-xs active:scale-[0.96] hover:bg-white/5 transition-all"
      >
        <span className="material-symbols-outlined text-primary-container text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
        Ask ZUREON AI about this project
      </button>

      <p className="text-center text-[10px] text-outline/60 pb-sm leading-relaxed">
        ZUREON provides tools and information for interacting with Web3. It does not offer financial advice or guarantees. Users are responsible for their own actions and decisions.
      </p>
    </ScreenLayout>
  )
}
