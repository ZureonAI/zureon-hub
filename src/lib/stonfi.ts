/**
 * STON.fi DEX v1 API — real swap quotes, no mock data
 * Docs: https://docs.ston.fi/docs/developer-section/api-reference
 */
const BASE = 'https://api.ston.fi/v1'

const TON_ADDRESS = 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c'

export interface StonfiAsset {
  contractAddress: string
  symbol: string
  name: string
  decimals: number
  imageUrl: string
  kind: 'Ton' | 'Wton' | 'Jetton'
}

export interface StonfiQuote {
  offerAddress: string
  askAddress: string
  offerUnits: string
  askUnits: string
  minAskUnits: string
  swapRate: string
  priceImpact: string
  feeUnits: string
  feePercent: string
  routerAddress: string
}

export async function getAssets(): Promise<StonfiAsset[]> {
  const res = await fetch(`${BASE}/assets`)
  if (!res.ok) throw new Error(`STON.fi assets → ${res.status}`)
  const data = await res.json() as { asset_list: StonfiAsset[] }
  // Return top assets by default — filter out non-standard
  return data.asset_list.filter(a => a.symbol && a.decimals !== undefined)
}

export async function getSwapQuote({
  offerAddress,
  askAddress,
  offerUnits,
  slippage = '0.01',
}: {
  offerAddress: string
  askAddress: string
  offerUnits: string
  slippage?: string
}): Promise<StonfiQuote> {
  const params = new URLSearchParams({
    offer_address:       offerAddress || TON_ADDRESS,
    ask_address:         askAddress,
    offer_units:         offerUnits,
    slippage_tolerance:  slippage,
  })
  const res = await fetch(`${BASE}/swap/simulate?${params}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(err.error || `STON.fi quote → ${res.status}`)
  }
  return res.json() as Promise<StonfiQuote>
}

export const TON_ADDR = TON_ADDRESS

export function formatRate(rate: string, fromSymbol: string, toSymbol: string): string {
  const n = parseFloat(rate)
  if (!Number.isFinite(n)) return '—'
  return `1 ${fromSymbol} = ${n.toFixed(4)} ${toSymbol}`
}

export function parsePriceImpact(impact: string): 'low' | 'medium' | 'high' {
  const n = parseFloat(impact)
  if (n < 1) return 'low'
  if (n < 5) return 'medium'
  return 'high'
}
