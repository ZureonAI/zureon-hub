/**
 * STON.fi v1 swap message builder
 * Produces the correct TL-B payload for TON Connect sendTransaction.
 *
 * STON.fi v1 router docs:
 *   https://docs.ston.fi/docs/developer-section/api-reference
 *
 * Flow:
 *   TON → Jetton  — send TON to router with swap cell as payload
 *   Jetton → TON  — send jetton_transfer to user's jetton wallet, forward swap cell
 */

import { beginCell, Address, Cell } from '@ton/core'
import { STONFI_ROUTER, SWAP_GAS_TON } from '@/lib/constants'
import { TON_ADDR } from '@/lib/stonfi'

const STONFI_API = 'https://api.ston.fi/v1'

/**
 * Single source of truth for assembling a swap-flavoured PendingReview.
 * Centralizes total/fee math so SwapScreen and ReviewWithAIScreen agree on the same numbers.
 */
export interface SwapReviewInputs {
  fromSymbol: string
  toSymbol: string
  fromAmount: number
  toAmount: number
  minAskUnits: string
  offerUnits: string
  priceImpact: string
  feePercent: string
  minReceivedHuman: string
  fromContractAddress: string
  toContractAddress: string
  tonPriceUsd: number
}

export function buildSwapPendingReview(i: SwapReviewInputs) {
  const totalTon = i.fromAmount + SWAP_GAS_TON
  return {
    txType:    'swap' as const,
    to:        STONFI_ROUTER,
    amount:    String(Math.round(totalTon * 1e9)),
    amountTon: totalTon,
    amountUsd: i.tonPriceUsd > 0 ? totalTon * i.tonPriceUsd : 0,
    fee:       String(Math.round(SWAP_GAS_TON * 1e9)),
    feeTon:    SWAP_GAS_TON,
    swapDetails: {
      fromSymbol:          i.fromSymbol,
      toSymbol:            i.toSymbol,
      fromAmount:          i.fromAmount,
      toAmount:            i.toAmount,
      minReceived:         i.minReceivedHuman,
      priceImpact:         i.priceImpact,
      feePercent:          i.feePercent,
      routerAddress:       STONFI_ROUTER,
      fromContractAddress: i.fromContractAddress,
      toContractAddress:   i.toContractAddress,
      offerUnits:          i.offerUnits,
      minAskUnits:         i.minAskUnits,
    },
  }
}

const OP_SWAP            = 0x25938561
const OP_JETTON_TRANSFER = 0x0f8a7ea5

// Forward gas for jetton transfers (STON.fi v1 requirement)
const FORWARD_TON = BigInt(Math.round(0.125 * 1e9))
const GAS_NANO    = BigInt(Math.round(SWAP_GAS_TON * 1e9))

export interface SwapMessage {
  address: string
  amount: string
  payload?: string
}

/**
 * Fetches the jetton wallet address for a given owner via STON.fi API.
 */
async function getJettonWallet(jettonAddress: string, ownerAddress: string): Promise<string> {
  const url = `${STONFI_API}/jetton/${encodeURIComponent(jettonAddress)}/address?owner_address=${encodeURIComponent(ownerAddress)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`STON.fi wallet lookup ${res.status}`)
  const data = await res.json() as { address: string }
  if (!data.address) throw new Error('STON.fi wallet address missing in response')
  return data.address
}

/**
 * Build the swap cell payload used in both directions.
 * Structure (STON.fi v1):
 *   op(32) + query_id(64) + token_wallet1(addr) + min_out(coins) + to_address(addr) + has_ref(1bit)
 */
function buildSwapCell(routerTokenWallet: string, minAskUnits: string, userAddress: string): string {
  return beginCell()
    .storeUint(OP_SWAP, 32)
    .storeUint(0, 64)
    .storeAddress(Address.parse(routerTokenWallet))
    .storeCoins(BigInt(minAskUnits))
    .storeAddress(Address.parse(userAddress))
    .storeUint(0, 1) // no referral
    .endCell()
    .toBoc()
    .toString('base64')
}

/**
 * Build the jetton_transfer cell for Jetton → TON swaps.
 * Structure (TEP-74 jetton standard + STON.fi forward payload):
 *   op(32) + query_id(64) + amount(coins) + destination(addr)
 *   + response_dest(addr) + no_custom_payload(1bit) + forward_ton(coins)
 *   + has_forward_payload(1bit) + forward_payload(ref)
 */
function buildJettonTransferCell(
  offerUnits: string,
  routerOfferWallet: string,
  userAddress: string,
  swapPayloadCell: string, // base64 BOC of the inner swap cell
): string {
  // Decode the inner swap cell BOC to use as a ref
  const innerBoc  = Buffer.from(swapPayloadCell, 'base64')
  const innerCell = Cell.fromBoc(innerBoc)[0]

  return beginCell()
    .storeUint(OP_JETTON_TRANSFER, 32)
    .storeUint(0, 64)
    .storeCoins(BigInt(offerUnits))
    .storeAddress(Address.parse(routerOfferWallet))  // destination = router
    .storeAddress(Address.parse(userAddress))         // response_destination
    .storeBit(false)                                  // no custom_payload
    .storeCoins(FORWARD_TON)                          // forward_ton_amount
    .storeBit(true)                                   // has_forward_payload
    .storeRef(innerCell)                              // forward_payload
    .endCell()
    .toBoc()
    .toString('base64')
}

/**
 * Main entry point: build the messages array for tonConnectUI.sendTransaction.
 *
 * @param fromContractAddress - offer token contract (TON_ADDR or jetton address)
 * @param toContractAddress   - ask token contract  (TON_ADDR or jetton address)
 * @param offerUnits          - offer amount in raw base units (string)
 * @param minAskUnits         - minimum ask amount in raw base units (string)
 * @param userAddress         - connected wallet address
 */
export async function buildSwapMessages({
  fromContractAddress,
  toContractAddress,
  offerUnits,
  minAskUnits,
  userAddress,
}: {
  fromContractAddress: string
  toContractAddress: string
  offerUnits: string
  minAskUnits: string
  userAddress: string
}): Promise<SwapMessage[]> {
  const isTonOffer = fromContractAddress === TON_ADDR
  const isTonAsk   = toContractAddress   === TON_ADDR

  if (isTonOffer && !isTonAsk) {
    // ── TON → Jetton ──────────────────────────────────────────────
    // 1. Get router's jetton wallet for the ASK token
    const routerAskWallet = await getJettonWallet(toContractAddress, STONFI_ROUTER)

    // 2. Build swap cell (goes directly as payload on the TON transfer)
    const payload = buildSwapCell(routerAskWallet, minAskUnits, userAddress)

    // 3. Total = offer amount + gas
    const totalNano = BigInt(offerUnits) + GAS_NANO

    return [{ address: STONFI_ROUTER, amount: String(totalNano), payload }]
  }

  if (!isTonOffer && isTonAsk) {
    // ── Jetton → TON ──────────────────────────────────────────────
    // 1. Get router's jetton wallet for the OFFER token (where jettons are sent)
    const [routerOfferWallet, userOfferWallet] = await Promise.all([
      getJettonWallet(fromContractAddress, STONFI_ROUTER),
      getJettonWallet(fromContractAddress, userAddress),
    ])

    // 2. Build inner swap cell (forwarded to router via jetton notification)
    const innerSwapCell = buildSwapCell(routerOfferWallet, minAskUnits, userAddress)

    // 3. Wrap in jetton_transfer (sent to user's own jetton wallet)
    const payload = buildJettonTransferCell(offerUnits, STONFI_ROUTER, userAddress, innerSwapCell)

    // Amount = gas only (the jettons are transferred, not TON)
    return [{ address: userOfferWallet, amount: String(GAS_NANO), payload }]
  }

  // Jetton → Jetton: not yet implemented (requires two jetton wallet lookups + different message)
  throw new Error('Jetton-to-Jetton swaps are not yet supported. Use TON/USDT or TON/NOT pairs.')
}
