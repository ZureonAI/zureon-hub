export interface ExploreProject {
  name: string
  tagline: string
  category: string
  url: string
  logo: string
  bg: string
  verified: boolean
  tvl: string
  volume24h: string
  description: string
  insight: string
  risks: string
  actions: string[]
}

export const EXPLORE_PROJECTS: Record<string, ExploreProject> = {
  stonfi: {
    name: 'STON.fi', tagline: 'The largest DEX on TON', category: 'DEX',
    url: 'https://ston.fi', logo: 'https://www.google.com/s2/favicons?domain=ston.fi&sz=128', bg: 'bg-cyan-400/10',
    verified: true, tvl: '$78M', volume24h: '$12M',
    description: 'STON.fi is the leading decentralized exchange on TON, offering low-slippage swaps, liquidity pools, and yield farming. Built natively for TON\'s asynchronous architecture.',
    insight: 'STON.fi is a dex protocol on TON. Before interacting, ZUREON recommends checking current fees, recent on-chain volume, and ensuring the URL you visit matches the official site (https://ston.fi).',
    risks: 'Smart-contract risk, impermanent loss on LP positions, MEV on large swaps.',
    actions: ['Swap TON ↔ Jettons with deep liquidity', 'Provide LP and earn trading fees', 'Stake LP tokens for additional rewards'],
  },
  dedust: {
    name: 'DeDust', tagline: 'Native DEX with AMM v2', category: 'DEX',
    url: 'https://dedust.io', logo: 'https://www.google.com/s2/favicons?domain=dedust.io&sz=128', bg: 'bg-blue-400/10',
    verified: true, tvl: '$25M', volume24h: '$3M',
    description: 'DeDust is a TON-native AMM with concentrated liquidity, focused on capital efficiency for Jetton trading pairs. Uses a Vault architecture for isolated risk per pool.',
    insight: 'DeDust offers concentrated liquidity positions. ZUREON recommends setting your price range carefully — wide ranges earn less fees, narrow ranges risk being out of range.',
    risks: 'Smart-contract risk, concentrated liquidity position management, price range exposure.',
    actions: ['Swap any Jetton pair with minimal slippage', 'Add concentrated liquidity to pools', 'Earn trading fees as an LP provider'],
  },
  evaa: {
    name: 'EVAA Protocol', tagline: 'Lend & borrow on TON', category: 'Lending',
    url: 'https://evaa.finance', logo: 'https://www.google.com/s2/favicons?domain=evaa.finance&sz=128', bg: 'bg-emerald-400/10',
    verified: true, tvl: '$32M', volume24h: '—',
    description: 'EVAA is the first decentralized lending protocol on TON, audited by Certik. Supply assets to earn yield or borrow against collateral with defined liquidation thresholds.',
    insight: 'EVAA uses a collateral-based lending model. Maintain your health factor above 1.0 to avoid liquidation. ZUREON suggests monitoring collateral ratio actively.',
    risks: 'Liquidation risk if collateral drops, smart-contract risk, oracle pricing dependency.',
    actions: ['Supply TON or Jettons to earn yield', 'Borrow against collateral with set LTV', 'Monitor health factor to avoid liquidation'],
  },
  tonstakers: {
    name: 'Tonstakers', tagline: 'Liquid staking for TON', category: 'Staking',
    url: 'https://tonstakers.com', logo: 'https://www.google.com/s2/favicons?domain=tonstakers.com&sz=128', bg: 'bg-amber-400/10',
    verified: true, tvl: '$340M', volume24h: '—',
    description: 'Tonstakers lets you stake TON and receive tsTON — a liquid token that accrues staking rewards while remaining tradable. No lock-up period required.',
    insight: 'Liquid staking via Tonstakers gives you tsTON that grows in value vs TON over time. ZUREON recommends verifying the tsTON/TON ratio before any DeFi interactions.',
    risks: 'Smart-contract risk, validator slashing risk, tsTON depeg risk on secondary markets.',
    actions: ['Stake TON and receive liquid tsTON', 'Use tsTON in DeFi while earning staking yield', 'Unstake at any time with no lock period'],
  },
  getgems: {
    name: 'Getgems', tagline: "TON's flagship NFT marketplace", category: 'NFT',
    url: 'https://getgems.io', logo: 'https://www.google.com/s2/favicons?domain=getgems.io&sz=128', bg: 'bg-purple-400/10',
    verified: true, tvl: '—', volume24h: '$1.2M',
    description: 'Getgems is the largest NFT marketplace on TON. Browse collections, buy and sell with TON, and discover new drops from verified creators.',
    insight: 'NFT liquidity on TON is concentrated in top collections. ZUREON recommends verifying collection authenticity and checking floor price history before purchasing.',
    risks: 'NFT illiquidity risk, floor price volatility, counterfeit collection risk.',
    actions: ['Browse and buy verified NFT collections', 'List your NFTs with custom royalties', 'Discover new drops from creators'],
  },
  tonkeeper: {
    name: 'Tonkeeper', tagline: 'The most-used TON wallet', category: 'Wallet',
    url: 'https://tonkeeper.com', logo: 'https://www.google.com/s2/favicons?domain=tonkeeper.com&sz=128', bg: 'bg-cyan-400/10',
    verified: true, tvl: '—', volume24h: '—',
    description: 'Tonkeeper is a self-custodial mobile + browser wallet for TON. Supports TON Connect 2.0, Jettons, NFTs and dApps. Open source and audited.',
    insight: 'Tonkeeper stores your seed phrase locally. ZUREON recommends writing down your recovery phrase on paper and never sharing it digitally.',
    risks: 'Self-custody risk, seed phrase loss, phishing via fake app copies.',
    actions: ['Send and receive TON and Jettons', 'Connect to dApps via TON Connect 2.0', 'View NFTs and manage multiple accounts'],
  },
  tondns: {
    name: 'TON DNS', tagline: 'Human-readable .ton names', category: 'Infrastructure',
    url: 'https://dns.ton.org', logo: 'https://www.google.com/s2/favicons?domain=dns.ton.org&sz=128', bg: 'bg-rose-400/10',
    verified: true, tvl: '—', volume24h: '—',
    description: 'TON DNS maps human-readable .ton domain names to wallet addresses and smart contracts on the TON blockchain.',
    insight: 'TON DNS names are NFTs and can be traded on Getgems. ZUREON recommends registering your name early — popular names sell at premium on secondary markets.',
    risks: 'Name expiry if renewal is missed, secondary market price speculation.',
    actions: ['Register a .ton domain name', 'Link your wallet address to a .ton name', 'Trade names on NFT marketplaces'],
  },
  fragment: {
    name: 'Fragment', tagline: 'Telegram usernames on TON', category: 'Infrastructure',
    url: 'https://fragment.com', logo: 'https://www.google.com/s2/favicons?domain=fragment.com&sz=128', bg: 'bg-cyan-400/10',
    verified: true, tvl: '—', volume24h: '—',
    description: 'Fragment is the official marketplace for Telegram usernames and anonymous numbers, powered by TON blockchain auctions.',
    insight: 'Fragment usernames are NFTs on TON. ZUREON recommends checking recent auction prices for similar names before bidding.',
    risks: 'Overpaying at auction, username resale market illiquidity.',
    actions: ['Bid on Telegram usernames', 'Buy anonymous Telegram numbers', 'Resell acquired names on the marketplace'],
  },
}
