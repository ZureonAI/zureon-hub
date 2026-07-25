const BASE = 'https://testnet.tonapi.io/v2'

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`tonapi ${path} → ${res.status}`)
  return res.json() as Promise<T>
}

export async function getAccount(address: string) {
  return get<{ balance: string; status: string }>(`/accounts/${encodeURIComponent(address)}`)
}

// Live reads (balance, transactions) go to toncenter, whose testnet indexer
// stays fresh — tonapi's lags minutes-to-days behind a confirmed tx.
//
// CRITICAL: we do NOT fall back to tonapi for these polled reads. toncenter
// occasionally 500s; a tonapi fallback would then return a STALE value, and
// since these are polled every few seconds the UI would visibly oscillate
// between the fresh value and the stale one on alternating polls. Instead a
// failed read returns null and the caller keeps its last-good value. A short
// timeout + one retry absorbs transient blips so "keep last-good" is rare.
const TONCENTER_TESTNET = 'https://testnet.toncenter.com/api/v2'

async function toncenterGet(path: string, attempts = 2): Promise<Response | null> {
  for (let i = 0; i < attempts; i++) {
    try {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 6000)
      const res = await fetch(`${TONCENTER_TESTNET}${path}`, { signal: ctrl.signal })
      clearTimeout(timer)
      if (res.ok) return res
    } catch {
      /* transient — retry */
    }
  }
  return null
}

// Balance in nanotons (string), or null on failure → caller keeps last-good.
export async function getBalance(address: string): Promise<string | null> {
  const res = await toncenterGet(`/getAddressBalance?address=${encodeURIComponent(address)}`)
  if (!res) return null
  try {
    const d = (await res.json()) as { ok?: boolean; result?: string }
    if (d.ok && typeof d.result === 'string' && /^\d+$/.test(d.result)) return d.result
  } catch {
    /* fall through */
  }
  return null
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

// ── Transactions ─────────────────────────────────────────────
// Same freshness problem as the balance: tonapi's testnet /events endpoint has
// been observed DAYS behind the chain (missing already-confirmed deposits),
// while toncenter reflects them within seconds. So we read transactions from
// toncenter and map its raw tx shape into the TxEvent-compatible shape the UI
// (useTransactions/TxRow) already consumes, falling back to tonapi's native
// events only if toncenter is unreachable.
interface TonCenterMsg { source?: string; destination?: string; value?: string; message?: string }
interface TonCenterTx {
  utime?: number
  transaction_id?: { hash?: string; lt?: string }
  in_msg?: TonCenterMsg
  out_msgs?: TonCenterMsg[]
}

// Map one toncenter tx to a TxEvent-shaped object. `ourAddress` is stamped onto
// whichever side is us, EXACTLY as the UI passes it, so TxRow's direction check
// (`recipient.address === walletAddress`) is correct regardless of the address
// form toncenter returns for the counterparty.
function mapToncenterTx(tx: TonCenterTx, ourAddress: string): unknown {
  const actions: unknown[] = []
  const outWithValue = (tx.out_msgs || []).filter(m => Number(m.value || 0) > 0)
  const inVal = Number(tx.in_msg?.value || 0)

  if (outWithValue.length > 0) {
    // Wallet-initiated send: out_msgs carry the real transfers to recipients.
    for (const m of outWithValue) {
      actions.push({
        type: 'TonTransfer', status: 'ok',
        TonTransfer: {
          sender:    { address: ourAddress },
          recipient: { address: m.destination || '' },
          amount:    Number(m.value || 0),
          comment:   m.message || undefined,
        },
      })
    }
  } else if (inVal > 0 && tx.in_msg?.source) {
    // Incoming transfer from another account.
    actions.push({
      type: 'TonTransfer', status: 'ok',
      TonTransfer: {
        sender:    { address: tx.in_msg.source },
        recipient: { address: ourAddress },
        amount:    inVal,
        comment:   tx.in_msg.message || undefined,
      },
    })
  }

  return {
    event_id:    tx.transaction_id?.hash || `${tx.utime}:${tx.transaction_id?.lt || ''}`,
    timestamp:   tx.utime || 0,
    actions,
    is_scam:     false,
    in_progress: false,
  }
}

// Returns TxEvent-shaped rows, or null on failure → caller keeps last-good.
// NO tonapi fallback (see toncenterGet note): a stale fallback under polling made
// the list oscillate between fresh and cached every interval.
export async function getTransactions(address: string, limit = 20): Promise<unknown[] | null> {
  const res = await toncenterGet(`/getTransactions?address=${encodeURIComponent(address)}&limit=${limit}`)
  if (!res) return null
  try {
    const d = (await res.json()) as { ok?: boolean; result?: TonCenterTx[] }
    if (d.ok && Array.isArray(d.result)) {
      // Drop txs that produced no displayable action (e.g. 0-value service msgs).
      return d.result
        .map(tx => mapToncenterTx(tx, address))
        .filter(e => (e as { actions: unknown[] }).actions.length > 0)
    }
  } catch {
    /* fall through */
  }
  return null
}

// Genesis Artifact(s) the wallet has claimed, served from our own confirmed
// claim record (not tonapi, whose testnet NFT indexer lags minutes behind a
// fresh mint). Returned in the NftItem shape so the gallery can merge it with
// the tonapi list. Never throws — a failure just yields no artifact rows.
export async function getArtifacts(address: string) {
  try {
    const res = await fetch(`/.netlify/functions/get-artifacts?address=${encodeURIComponent(address)}`)
    if (!res.ok) return []
    const data = await res.json() as { items?: Array<{
      address: string; index: number; name: string; image: string | null
      collectionName: string | null; collectionAddress: string | null
    }> }
    return Array.isArray(data.items) ? data.items : []
  } catch {
    return []
  }
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
