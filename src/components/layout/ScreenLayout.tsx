'use client'
import { useRouter } from 'next/navigation'
import { BottomNav } from '@/components/ui/BottomNav'

interface Props {
  children: React.ReactNode
  showBack?: boolean
  backHref?: string
}

export function ScreenLayout({ children, showBack, backHref }: Props) {
  const router = useRouter()

  function handleBack() {
    if (backHref) {
      router.push(backHref)
    } else {
      router.back()
    }
  }

  return (
    <div className="bg-black text-on-surface overflow-y-auto font-sans antialiased overflow-x-hidden flex flex-col min-h-screen">
      <header className="fixed top-0 w-full z-50 flex items-center justify-between px-6 h-20 pt-4 bg-black/80 backdrop-blur-2xl border-b border-white/10">
        <div className="flex items-center gap-md">
          {showBack && (
            <button
              onClick={handleBack}
              aria-label="Go back"
              className="text-cyan-400 active:scale-[0.96] transition-transform duration-200 flex items-center justify-center p-[10px] -m-[10px]"
            >
              <span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>
            </button>
          )}
          <h1 className="font-semibold text-lg font-black tracking-widest text-cyan-400 uppercase">
            ZUREON HUB
          </h1>
          <span className="text-[9px] font-bold tracking-widest uppercase px-[6px] py-[2px] rounded bg-orange-500/15 text-orange-400 border border-orange-500/30">
            Testnet
          </span>
        </div>
      </header>

      <main className="pt-[104px] pb-[100px] md:px-lg flex flex-col gap-[24px] md:gap-[32px] w-full px-[16px]">
        {children}
      </main>

      <BottomNav />
    </div>
  )
}
