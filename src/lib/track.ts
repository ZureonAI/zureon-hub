/**
 * Product-metrics reporter — feeds the KPI dashboard (unique wallet
 * connections + transaction counts) via the track-event Netlify function.
 *
 * Fire-and-forget by design: this must NEVER block, delay, or throw into the
 * UX. If the network is down, an adblocker eats the request, or the endpoint
 * errors, the user's flow is completely unaffected — we just miss one data
 * point. The server dedupes connections by address, so calling reportConnect
 * more than once for the same wallet is harmless.
 */

const ENDPOINT = '/.netlify/functions/track-event'

export type TrackNetwork = 'testnet' | 'mainnet'
export type TxType = 'send' | 'swap' | 'jetton'

// TonConnect CHAIN ids: '-239' = mainnet, '-3' = testnet.
export function chainToNetwork(chain: string | undefined | null): TrackNetwork {
  return chain === '-3' ? 'testnet' : 'mainnet'
}

function post(body: Record<string, unknown>): void {
  try {
    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      // keepalive lets the request finish even if the route unmounts right
      // after (e.g. tx_sent fires as we navigate to the confirmation screen).
      keepalive: true,
    }).catch(() => {})
  } catch {
    /* no-op — metrics never affect UX */
  }
}

export function reportConnect(address: string, network: TrackNetwork): void {
  if (!address) return
  post({ type: 'wallet_connect', address, network })
}

export function reportTx(address: string, network: TrackNetwork, txType: TxType): void {
  if (!address) return
  post({ type: 'tx_sent', address, network, txType })
}
