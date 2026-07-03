'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ScreenLayout } from '@/components/layout/ScreenLayout'
import { GlassCard } from '@/components/ui/GlassCard'
import { useStore } from '@/lib/store'
import { EXPLORE_PROJECTS } from '@/lib/explore-projects'

const PROXY      = '/.netlify/functions/ai-proxy'
const TIMEOUT_MS = 15_000

interface AIMessage {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTED_PROMPTS = [
  'How do I use this safely?',
  'What are the main risks?',
  'How does it work under the hood?',
  'Is it a good fit for a beginner?',
]

export function AskAI({ id }: { id: string }) {
  const router = useRouter()
  const wallet = useStore(s => s.wallet)
  const p      = EXPLORE_PROJECTS[id]

  const [messages, setMessages] = useState<AIMessage[]>([])
  const [input,    setInput]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const initialFiredRef = useRef(false)
  const scrollRef       = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  useEffect(() => {
    if (!p || initialFiredRef.current) return
    initialFiredRef.current = true
    const intro = `Tell me about ${p.name} — what it does, how to use it safely on TON, and the main risks I should know.`
    sendMessage(intro)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p])

  async function sendMessage(text: string) {
    if (!text.trim() || loading || !p) return

    const userMsg: AIMessage = { role: 'user', content: text.trim() }
    const nextHistory = [...messages, userMsg]
    setMessages(nextHistory)
    setInput('')
    setLoading(true)
    setError(null)

    const projectContext = [
      `[Project context]`,
      `Name: ${p.name}`,
      `Category: ${p.category}`,
      `Description: ${p.description}`,
      `Known risks: ${p.risks}`,
      p.tvl !== '—' ? `TVL: ${p.tvl}` : null,
      p.volume24h !== '—' ? `24h volume: ${p.volume24h}` : null,
      `Official URL: ${p.url}`,
      `[/Project context]`,
    ].filter(Boolean).join('\n')

    const question = `${projectContext}\n\n${text.trim()}`

    const walletContext = wallet.connected
      ? {
          connected:  true,
          address:    wallet.address,
          balance:    wallet.balanceNano ? (Number(wallet.balanceNano) / 1e9).toFixed(2) : '0',
          walletName: wallet.walletName,
        }
      : { connected: false }

    const ac = new AbortController()
    const timeoutId = setTimeout(() => ac.abort(), TIMEOUT_MS)

    try {
      const res = await fetch(PROXY, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        signal:  ac.signal,
        body: JSON.stringify({
          question,
          walletContext,
          history: messages.slice(-8),
        }),
      })

      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as { error?: string; retryAfter?: number }
        if (res.status === 429) {
          const wait = d.retryAfter ? ` Try again in ${d.retryAfter}s.` : ''
          throw new Error(`You're sending requests too fast.${wait}`)
        }
        throw new Error(d.error || `HTTP ${res.status}`)
      }

      const data = await res.json() as { response: string }
      const assistantMsg: AIMessage = { role: 'assistant', content: data.response || '' }
      setMessages(prev => [...prev, assistantMsg])
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('AI took too long. Try again.')
      } else {
        setError(err instanceof Error ? err.message : 'AI request failed')
      }
    } finally {
      clearTimeout(timeoutId)
      setLoading(false)
    }
  }

  if (!p) {
    return (
      <ScreenLayout showBack>
        <div className="text-on-surface-variant text-center py-xl">Project not found.</div>
      </ScreenLayout>
    )
  }

  return (
    <div className="bg-black text-on-surface min-h-screen flex flex-col font-sans antialiased">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 flex items-center gap-sm px-3 h-[60px] bg-black/80 backdrop-blur-2xl border-b border-white/10">
        <button
          onClick={() => router.back()}
          aria-label="Go back"
          className="text-on-surface-variant hover:text-on-surface transition-colors w-10 h-10 flex items-center justify-center flex-shrink-0"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex flex-col flex-1 min-w-0">
          <div className="text-label-md font-semibold text-white leading-tight">
            ZUREON AI
          </div>
          <div className="text-[10px] text-on-surface-variant truncate">
            about {p.name}
          </div>
        </div>
      </header>

      <main ref={scrollRef} className="pt-[80px] pb-[140px] px-[16px] flex flex-col gap-md overflow-y-auto flex-1">
        {messages.length === 0 && !loading && (
          <GlassCard className="p-md text-on-surface-variant text-label-sm">
            Loading {p.name} insight...
          </GlassCard>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] ${m.role === 'user' ? 'self-end' : 'self-start'}`}
          >
            <GlassCard
              className={`p-md ${
                m.role === 'user'
                  ? 'bg-primary-container/10 border-primary-container/20'
                  : ''
              }`}
            >
              {m.role === 'assistant' && (
                <div className="flex items-center gap-sm mb-xs">
                  <div className="w-6 h-6 rounded-full bg-primary-container/15 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-primary-container text-[14px]">smart_toy</span>
                  </div>
                  <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">ZUREON AI</span>
                </div>
              )}
              <div className="text-on-surface text-[14px] leading-relaxed whitespace-pre-wrap">
                {/* Hide the [Project context] block from user-visible messages */}
                {m.role === 'user'
                  ? m.content.replace(/^\[Project context\][\s\S]*?\[\/Project context\]\n\n/, '')
                  : m.content}
              </div>
            </GlassCard>
          </div>
        ))}

        {loading && (
          <div className="max-w-[85%] self-start">
            <GlassCard className="p-md">
              <div className="flex items-center gap-sm text-on-surface-variant text-label-sm">
                <div className="flex gap-[4px]">
                  <span className="typing-dot w-2 h-2 rounded-full bg-primary-container" />
                  <span className="typing-dot w-2 h-2 rounded-full bg-primary-container" />
                  <span className="typing-dot w-2 h-2 rounded-full bg-primary-container" />
                </div>
                Thinking...
              </div>
            </GlassCard>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-sm px-md py-sm rounded-xl border border-error/30 bg-error/5">
            <span className="material-symbols-outlined text-error text-[18px]">error</span>
            <span className="text-error text-label-sm">{error}</span>
          </div>
        )}

        {!loading && messages.length > 0 && messages.length < 3 && (
          <div className="flex flex-wrap gap-xs mt-xs">
            {SUGGESTED_PROMPTS.map(prompt => (
              <button
                key={prompt}
                onClick={() => sendMessage(prompt)}
                className="text-[11px] text-primary-container border border-primary-container/30 bg-primary-container/5 px-sm py-[6px] rounded-full hover:bg-primary-container/10 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}
      </main>

      {/* Input bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-xl border-t border-white/10 p-md flex gap-sm z-40">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !loading) sendMessage(input) }}
          placeholder={`Ask about ${p.name}...`}
          disabled={loading}
          className="flex-1 min-w-0 bg-surface-container/40 border border-white/10 text-on-surface text-label-md px-md py-sm rounded-xl outline-none focus:border-primary-container/40 disabled:opacity-50"
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          className="bg-primary-container text-black px-md py-sm rounded-xl flex items-center justify-center active:scale-[0.96] hover:opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-[18px]">send</span>
        </button>
      </div>
    </div>
  )
}
