# ZUREON HUB

An AI-guided companion app for the TON blockchain. ZUREON HUB explains every
transaction in plain language before you sign, flags risk signals (typosquat
addresses, unused recipients, oversized amounts), and gives you a daily
portfolio read — without ever taking custody of your funds.

Signing always happens in your own TON Connect wallet. ZUREON HUB never
touches private keys or seed phrases.

**Status**: live on TON testnet. Mainnet beta is scoped for the TON Foundation
grant's Milestone 2.

## What's in this repo

Next.js 15 (App Router) + React 19 + TypeScript, statically exported
(`output: 'export'`) — no server runtime in production, just static
HTML/JS served from a CDN.

| Screen | Route | What it does |
|---|---|---|
| Onboarding | `/onboarding` | First-run explainer, non-custodial framing |
| Dashboard | `/dashboard` | TON balance, jettons, recent activity, entry points to Send/Receive/Swap/NFTs |
| Send | `/send` | Guided send flow with format validation and a QR-scan entry point |
| Scan QR | `/scan` | Camera-based TON address scanner with on-chain typosquat/freshness checks before handing off to Send |
| Receive | `/receive` | Real scannable QR of the connected wallet's address |
| Review with AI | `/review` | Claude-powered transaction review before signing — plain-language risk summary |
| Swap | `/swap` | STON.fi swap UI (payload builder implemented; swap execution gated as "Coming in V2") |
| NFT Gallery | `/nfts` | NFTs held in the connected wallet, read directly from chain |
| Explore | `/explore`, `/explore/[id]`, `/explore/[id]/ask` | Curated catalog of TON dApps with risk labels and a per-dApp AI chat |
| Learn | `/learn`, `/learn/[lesson]` | Short in-context lessons |
| Asset detail | `/asset/[symbol]` | Per-token balance, contract info, and transaction history |

## Architecture notes

- **Wallet connection**: `@tonconnect/ui-react` (TON Connect 2.0). The
  manifest is served from the production domain
  (`https://zureon.app/tonconnect-manifest.json`).
- **On-chain data**: read directly from `tonapi.io` client-side
  (`src/lib/tonapi.ts`) — balances, jettons, NFTs, transaction history.
- **AI review**: this app calls a backend AI proxy
  (`/.netlify/functions/ai-proxy`, `/.netlify/functions/profile-insight`)
  that wraps the Claude API server-side. That backend — along with rate
  limiting, prompt-injection guarding, and server-side recipient
  verification — lives in ZUREON's main site repository, not here. This repo
  contains the client that calls it.
- **State**: Zustand (`src/lib/store.ts`) — wallet state, jetton/NFT
  holdings, pending transaction review.
- **Swap payloads**: STON.fi v1 TL-B construction via `@ton/core`
  (`src/lib/stonfi-builder.ts`) — correct swap/jetton-transfer opcodes,
  currently gated behind a "Coming in V2" flag pending mainnet + formal
  integration.

## Local development

```bash
npm ci
npm run dev        # http://localhost:3001
npm run build       # static export → out/
npm run typecheck
npm run lint
```

Note: `next.config.ts` sets `basePath: '/hub-dist'` for production (this app
is served under that path on the main site). In local `next dev`, visit
`http://localhost:3001/hub-dist/dashboard` etc.

## License

MIT — see [LICENSE](LICENSE). Brand identity and trademark rights to
"ZUREON" are reserved (see the scope clarification in the LICENSE file).
