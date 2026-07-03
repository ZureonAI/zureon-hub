'use client'
import { useState, useEffect } from 'react'
import { ScreenLayout } from '@/components/layout/ScreenLayout'

const LESSONS = [
  { id: 'what-is-ton',       title: 'What is TON?',                  summary: 'A 2-minute primer on the blockchain Telegram built.',            icon: 'public',  duration: '2 min', category: 'Basics'  },
  { id: 'how-wallets-work',  title: 'How TON wallets work',           summary: 'Keys, addresses, and what "signing" really means.',              icon: 'key',     duration: '3 min', category: 'Basics'  },
  { id: 'sending-safely',    title: 'Sending TON safely',             summary: 'The 4 checks every transfer should pass.',                       icon: 'shield',  duration: '3 min', category: 'Safety'  },
  { id: 'understanding-jettons', title: 'Understanding Jettons',      summary: "TON's token standard, explained plainly.",                       icon: 'token',   duration: '2 min', category: 'Basics'  },
  { id: 'ton-connect',       title: 'TON Connect: how signing works', summary: 'The protocol that links ZUREON to your wallet.',                 icon: 'link',    duration: '2 min', category: 'Safety'  },
  { id: 'reading-a-tx',      title: 'Reading a transaction',          summary: 'Fees, BOC, addresses — decoded.',                                icon: 'receipt', duration: '3 min', category: 'Basics'  },
  { id: 'nfts-on-ton',       title: 'NFTs on TON',                    summary: 'How TON NFTs work and why they differ from Ethereum.',           icon: 'diamond', duration: '3 min', category: 'DeFi'    },
  { id: 'defi-risks',        title: 'DeFi risks on TON',              summary: 'Impermanent loss, smart contract risk, and how to stay safe.',   icon: 'warning', duration: '4 min', category: 'Safety'  },
]

const COMPLETED_KEY = 'zureon_lessons_completed'

function loadCompleted(): string[] {
  try { return JSON.parse(localStorage.getItem(COMPLETED_KEY) || '[]') } catch { return [] }
}

export default function LearnPage() {
  const [completed, setCompleted] = useState<string[]>([])
  const [modal, setModal] = useState<string | null>(null)

  useEffect(() => { setCompleted(loadCompleted()) }, [])

  function resetProgress() {
    localStorage.removeItem(COMPLETED_KEY)
    setCompleted([])
  }

  const ratio = completed.length / LESSONS.length
  const firstNotDone = LESSONS.findIndex(l => !completed.includes(l.id))

  return (
    <ScreenLayout>
      {/* Hero & progress */}
      <section className="flex flex-col gap-lg">
        <div className="flex flex-col gap-xs">
          <h2 className="text-headline-lg text-on-surface">Learn Web3 while you use it</h2>
          <p className="text-body-lg text-on-surface-variant">Master blockchain concepts step-by-step.</p>
        </div>
        <div className="bg-[#1E1E1E]/60 border border-white/10 rounded-xl p-md flex flex-col gap-md">
          <div className="flex justify-between items-end">
            <div className="flex flex-col gap-xs">
              <span className="text-[11px] text-on-surface-variant uppercase tracking-wider">Course Progression</span>
              <span className="text-headline-md text-primary-container">{completed.length}/{LESSONS.length} lessons completed</span>
            </div>
            <button onClick={resetProgress} className="text-[11px] text-on-surface-variant hover:text-on-surface transition-colors">Reset progress</button>
          </div>
          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-container rounded-full transition-all duration-500"
              style={{ width: `${(ratio * 100).toFixed(1)}%` }}
            />
          </div>
        </div>
      </section>

      {/* Curriculum */}
      <section className="flex flex-col gap-lg">
        <h3 className="text-headline-md text-on-surface flex items-center gap-sm">
          <span className="material-symbols-outlined text-primary-container">auto_stories</span>
          TON Curriculum
        </h3>
        <div className="grid grid-cols-1 gap-md">
          {LESSONS.map((lesson, idx) => {
            const isDone = completed.includes(lesson.id)
            const isActive = !isDone && idx === firstNotDone

            return (
              <article
                key={lesson.id}
                onClick={() => setModal(lesson.title)}
                className={`relative rounded-xl p-md flex flex-col gap-md overflow-hidden cursor-pointer transition-all
                  ${isActive
                    ? 'border border-primary-container/40 bg-[#1E1E1E]/80 shadow-[0_4px_24px_rgba(0,212,255,0.05)] hover:border-primary-container/60'
                    : isDone
                    ? 'bg-[#1E1E1E]/40 border border-white/5 opacity-70 hover:opacity-100'
                    : 'bg-[#1E1E1E]/40 border border-white/5 hover:border-white/20'
                  }`}
              >
                {isActive && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary-container/10 rounded-full blur-[40px] pointer-events-none" />
                )}
                <div className="flex justify-between items-start relative z-10">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center
                    ${isDone ? 'bg-white/5 text-primary-container' : isActive ? 'bg-primary-container/5 border border-primary-container/20 text-primary-container' : 'bg-white/5 text-on-surface-variant'}`}>
                    <span className="material-symbols-outlined">{isDone ? 'check_circle' : lesson.icon}</span>
                  </div>
                  <span className={`text-[11px] uppercase tracking-wider ${isDone ? 'text-primary-container' : isActive ? 'text-primary-container' : 'text-on-surface-variant'}`}>
                    {isActive && <span className="inline-block w-2 h-2 rounded-full bg-primary-container mr-1 align-middle" />}
                    {isDone ? 'Completed' : lesson.duration}
                  </span>
                </div>
                <div className="flex flex-col gap-xs flex-grow relative z-10">
                  <span className="text-[10px] uppercase tracking-wider text-outline">{lesson.category} · {lesson.duration}</span>
                  <h4 className="text-body-lg text-on-surface font-semibold">{lesson.title}</h4>
                  <p className="text-body-md text-on-surface-variant">{lesson.summary}</p>
                </div>
                {isActive && (
                  <div className="relative z-10">
                    <div className="w-full h-12 bg-primary-container text-black text-label-md rounded-lg flex items-center justify-center gap-sm font-semibold">
                      Continue Module
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </div>
                  </div>
                )}
                {!isActive && (
                  <div className="text-[11px] text-on-surface-variant relative z-10">{isDone ? 'Review →' : 'Start lesson →'}</div>
                )}
              </article>
            )
          })}
        </div>
      </section>

      {/* Beta modal */}
      {modal && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center pb-6" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
          onClick={() => setModal(null)}>
          <div className="relative w-full max-w-[420px] mx-4 bg-[#1A1A1A] border border-primary-container/20 rounded-[20px] p-[28px_24px_24px] text-center"
            onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-[14px] bg-primary-container/8 border border-primary-container/20 flex items-center justify-center mx-auto mb-[16px]">
              <span className="material-symbols-outlined text-primary-container text-[24px]">schedule</span>
            </div>
            <div className="text-[11px] font-bold tracking-[0.15em] text-primary-container uppercase mb-[8px]">Coming Soon</div>
            <div className="text-[16px] font-semibold text-white leading-snug mb-[12px]">{modal}</div>
            <p className="text-[13px] text-white/50 leading-relaxed mb-[20px]">Lessons will be available when ZUREON HUB launches.</p>
            <button onClick={() => setModal(null)}
              className="w-full py-[12px] rounded-[12px] border border-white/10 text-white/60 text-[13px] font-medium hover:bg-white/5 transition-colors">
              Back to curriculum
            </button>
          </div>
        </div>
      )}
    </ScreenLayout>
  )
}
