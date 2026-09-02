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
    <div className="bg-black text-on-surface overflow-y-auto font-sans antialiased overflow-x-hidden flex flex-col min-h-dvh">
      {/* Header + nav grow by the device safe-area insets (env()) so content
          clears the Dynamic Island / notch (top) and home indicator (bottom)
          when the app runs standalone on iPhone Pro. env()=0 on devices
          without insets, so the layout is unchanged there. */}
      <header
        className="fixed top-0 w-full z-50 flex items-center justify-between px-6 max-[380px]:px-4 bg-black/80 backdrop-blur-2xl border-b border-white/10"
        style={{ height: 'calc(var(--hdr-h) + env(safe-area-inset-top))', paddingTop: 'calc(16px + env(safe-area-inset-top))' }}
      >
        <div className="flex items-center gap-md">
          {showBack && (
            <button
              onClick={handleBack}
              aria-label="Go back"
              className="text-primary-container active:scale-[0.96] transition-transform duration-200 flex items-center justify-center p-[10px] -m-[10px]"
            >
              <span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>
            </button>
          )}
          <h1 className="font-semibold text-lg font-black tracking-widest text-primary-container uppercase">
            ZUREON HUB
          </h1>
          <span className="text-[9px] font-bold tracking-widest uppercase px-[6px] py-[2px] rounded bg-orange-500/15 text-orange-400 border border-orange-500/30">
            Testnet
          </span>
        </div>
      </header>

      <main
        className="md:px-lg flex flex-col gap-[24px] max-[380px]:gap-[16px] md:gap-[32px] w-full px-[16px] max-[380px]:px-[12px]"
        style={{ paddingTop: 'calc(var(--hdr-h) + 24px + env(safe-area-inset-top))', paddingBottom: 'calc(100px + env(safe-area-inset-bottom))' }}
      >
        {children}
      </main>

      <BottomNav />
    </div>
  )
}
