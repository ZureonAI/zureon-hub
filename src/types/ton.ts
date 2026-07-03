export interface WalletState {
  connected: boolean
  address: string | null
  walletName: string | null
  balanceNano: string | null
}

export interface TonTransaction {
  eventId: string
  timestamp: number
  isScam: boolean
  actions: TonAction[]
}

export interface TonAction {
  type: string
  status: 'ok' | 'failed'
  simplePreview: {
    name: string
    description: string
    value?: string
    valueImage?: string
  }
}

export interface SwapDetails {
  fromSymbol: string
  toSymbol: string
  fromAmount: number
  toAmount: number
  minReceived: string
  priceImpact: string
  feePercent: string
  routerAddress: string
  fromContractAddress: string
  toContractAddress: string
  offerUnits: string
  minAskUnits: string
}

export interface TxResult {
  boc: string
  txType: 'send' | 'swap'
  toAddress?: string
  amountTon?: number
  swapDetails?: SwapDetails
  timestamp: number
}

export interface PendingReview {
  txType?: 'send' | 'swap'
  to: string
  amount: string
  amountTon: number
  amountUsd: number
  fee: string
  feeTon: number
  recipient?: string
  comment?: string
  jetton?: JettonInfo
  swapDetails?: SwapDetails
}

export interface JettonInfo {
  address: string
  symbol: string
  name: string
  decimals: number
  image: string
}
