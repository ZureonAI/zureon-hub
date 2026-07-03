export interface JettonBalance {
  symbol: string
  name: string
  image: string
  balance: string
  decimals: number
  jettonAddress: string
  balanceFormatted: string
  balanceUsd: number | null
}

export interface SwapAsset {
  contractAddress: string
  symbol: string
  name: string
  decimals: number
  imageUrl: string
  defaultSymbol: boolean
  kind: 'Ton' | 'Wton' | 'Jetton'
}

export interface SwapQuote {
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
