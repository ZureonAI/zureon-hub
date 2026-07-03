'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { label: 'Web3',    icon: 'account_balance_wallet', href: '/dashboard', match: '/dashboard', fill: true  },
  { label: 'Explore', icon: 'explore',                href: '/explore',   match: '/explore',   fill: false },
  { label: 'Learn',   icon: 'school',                 href: '/learn',     match: '/learn',     fill: false },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="bg-[#1E1E1E]/60 backdrop-blur-xl border-t border-white/10 shadow-[0_-4px_24px_rgba(0,0,0,0.3)] fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-20 px-4 rounded-t-xl">
      {tabs.map(tab => {
        const active = pathname?.includes(tab.match) ?? false
        return (
          <Link
            key={tab.label}
            href={tab.href}
            className={`flex flex-col items-center justify-center w-full h-full gap-1 active:scale-[0.96] transition-transform duration-200 ${
              active
                ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(0,212,255,0.15)]'
                : 'text-zinc-500 hover:text-cyan-300'
            }`}
          >
            <span
              className="material-symbols-outlined text-[24px]"
              style={active && tab.fill ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {tab.icon}
            </span>
            <span className="text-[10px] font-medium uppercase tracking-wider">{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
