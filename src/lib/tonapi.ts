const BASE = 'https://testnet.tonapi.io/v2'

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`tonapi ${path} → ${res.status}`)
  return res.json() as Promise<T>
}

export async function getAccount(address: string) {
  return get<{ balance: string; status: string }>(`/accounts/${encodeURIComponent(address)}`)
}

export async function getJettonBalances(address: string) {
  const data = await get<{
    balances: Array<{
      balance: string
      jetton: {
        address: string
        symbol: string
        name: string
        decimals: number
        image: string
      }
    }>
  }>(`/accounts/${encodeURIComponent(address)}/jettons`)

  return data.balances.map(b => ({
    jettonAddress: b.jetton.address,
    symbol:        b.jetton.symbol,
    name:          b.jetton.name,
    decimals:      b.jetton.decimals ?? 9,
    image:         b.jetton.image,
    balance:       b.balance,
    balanceFormatted: formatJettonBalance(b.balance, b.jetton.decimals ?? 9),
    balanceUsd:    null,
  }))
}

export async function getNftItems(address: string) {
  const data = await get<{
    nft_items: Array<{
      address: string
      index: number
      collection?: { address: string; name: string }
      metadata?: { name?: string; image?: string }
      previews?: Array<{ resolution: string; url: string }>
    }>
  }>(`/accounts/${encodeURIComponent(address)}/nfts?limit=100&offset=0&indirect_ownership=false`)

  return data.nft_items.map(item => {
    const preview = item.previews?.find(p => p.resolution === '500x500') || item.previews?.[0]
    return {
      address: item.address,
      index: item.index,
      name: item.metadata?.name || `NFT #${item.index}`,
      image: preview?.url || item.metadata?.image || null,
      collectionName: item.collection?.name || null,
      collectionAddress: item.collection?.address || null,
    }
  })
}

export async function getTransactions(address: string, limit = 20) {
  const data = await get<{ events: unknown[] }>(
    `/accounts/${encodeURIComponent(address)}/events?limit=${limit}`
  )
  return data.events
}

export function formatJettonBalance(raw: string, decimals: number): string {
  const n = Number(BigInt(raw)) / Math.pow(10, decimals)
  if (!Number.isFinite(n)) return '0'
  if (n === 0) return '0'
  if (n < 0.01) return '< 0.01'
  if (n < 1000) return n.toFixed(2)
  if (n < 1_000_000) return (n / 1000).toFixed(2) + 'K'
  return (n / 1_000_000).toFixed(2) + 'M'
}

export function formatTon(nanotons: string | number | bigint): string {
  const n = Number(nanotons) / 1e9
  if (!Number.isFinite(n)) return '0 TON'
  return `${n.toFixed(2)} TON`
}

export function formatAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`
}
