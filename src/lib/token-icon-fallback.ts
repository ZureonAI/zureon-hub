// Shared fallback for token logo <img> tags: if the remote logo URL 404s,
// swap in a generated colored-circle data URI with the symbol's initials.
export const TOKEN_COLORS: Record<string, string> = { TON: '00D4FF', USDT: '26A17B', NOT: 'F7B900' }

export function tokenFallback(e: React.SyntheticEvent<HTMLImageElement>, symbol: string) {
  const c = TOKEN_COLORS[symbol] || '888888'
  const s = encodeURIComponent(symbol.slice(0, 3))
  e.currentTarget.onerror = null
  e.currentTarget.src = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><circle cx='16' cy='16' r='16' fill='%23${c}'/><text x='16' y='21' text-anchor='middle' font-size='11' font-weight='700' fill='white' font-family='sans-serif'>${s}</text></svg>`
}
