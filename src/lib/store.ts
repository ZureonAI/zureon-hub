'use client'
import { create } from 'zustand'
import type { JettonBalance } from '@/types/jetton'
import type { WalletState, PendingReview } from '@/types/ton'
import type { NftItem } from '@/types/nft'

interface AppState {
  wallet: WalletState
  tonPriceUsd: number
  jettons: JettonBalance[]
  jettonsLoading: boolean
  nfts: NftItem[]
  nftsLoading: boolean
  pendingReview: PendingReview | null
  connectError: string | null

  setWallet: (w: Partial<WalletState>) => void
  setTonPrice: (price: number) => void
  setJettons: (jettons: JettonBalance[]) => void
  setJettonsLoading: (v: boolean) => void
  setNfts: (nfts: NftItem[]) => void
  setNftsLoading: (v: boolean) => void
  setPendingReview: (r: PendingReview | null) => void
  setConnectError: (e: string | null) => void
}

export const useStore = create<AppState>((set) => ({
  wallet: {
    connected: false,
    address: null,
    walletName: null,
    balanceNano: null,
  },
  tonPriceUsd: 0,
  jettons: [],
  jettonsLoading: false,
  nfts: [],
  nftsLoading: false,
  pendingReview: null,
  connectError: null,

  setWallet: (w) => set(s => ({ wallet: { ...s.wallet, ...w } })),
  setTonPrice: (price) => set({ tonPriceUsd: price }),
  setJettons: (jettons) => set({ jettons }),
  setJettonsLoading: (v) => set({ jettonsLoading: v }),
  setNfts: (nfts) => set({ nfts }),
  setNftsLoading: (v) => set({ nftsLoading: v }),
  setPendingReview: (r) => set({ pendingReview: r }),
  setConnectError: (e) => set({ connectError: e }),
}))
