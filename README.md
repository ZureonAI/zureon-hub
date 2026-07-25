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
| NFT Gallery | `/nfts` | NFTs held in the connected wallet, incl. the earned ZUREON Genesis Artifact |
| NFT detail | `/nft?address=` | Single NFT view — item/collection address, send disabled pending V2 |
| Genesis Artifact | modal (auto-opens) | Evolving claim NFT earned through real testnet usage — see architecture notes |
| Explore | `/explore`, `/explore/[id]`, `/explore/[id]/ask` | Curated catalog of TON dApps with risk labels and a per-dApp AI chat |
| Learn | `/learn` | Short in-context lessons, rendered via in-page modals |
| Asset detail | `/asset/[symbol]` | Per-token balance, contract info, and transaction history |

## Architecture notes

- **Wallet connection**: `@tonconnect/ui-react` (TON Connect 2.0). The
  manifest is served from the production domain
  (`https://zureon.app/tonconnect-manifest.json`).
- **On-chain data** (`src/lib/tonapi.ts`): balance and transaction history read
  from **toncenter** with a **tonapi** fallback — toncenter's testnet indexer
  stays fresh while tonapi's can lag minutes behind a confirmed tx — and are
  polled (~8s + on tab focus) so a deposit/send reflects within seconds. Jettons
  and general NFTs come from tonapi.
- **AI review**: this app calls backend functions
  (`/.netlify/functions/ai-proxy`, `profile-insight`) that wrap the Claude API
  server-side. That backend — along with rate limiting, prompt-injection
  guarding, and server-side recipient verification — lives in ZUREON's main site
  repository, not here. This repo contains the client that calls it.
- **Genesis Artifact**: an evolving claim NFT earned through real testnet usage
  (20 tx → Stage I "Sealed", 50 tx → Stage II "Awakening"; Stage III at mainnet
  launch). The claim modal auto-opens when the connected wallet crosses a
  milestone; minting and eligibility (both verified **on-chain**, never from a
  client counter) run server-side (`/.netlify/functions/claim-nft`), and the
  gallery surfaces the artifact immediately via `/.netlify/functions/get-artifacts`
  (fresh, so it shows before tonapi indexes it). Client model in
  `src/lib/artifact.ts` + `src/components/artifact/`.
- **State**: Zustand (`src/lib/store.ts`) — wallet state, jetton/NFT
  holdings, pending transaction review.
- **Swap payloads**: STON.fi v1 TL-B construction via `@ton/core`
  (`src/lib/stonfi-builder.ts`) — correct swap/jetton-transfer opcodes,
  currently gated behind a "Coming in V2" flag pending mainnet + formal
  integration.
- **Android wrapper**: a thin Capacitor shell (`app.zureon.hub`, native
  source under `android/` — gitignored, not part of this repo) points
  straight at `https://zureon.app/hub-dist/` rather than bundling a local
  copy of the static export. `src/lib/nativeBridge.ts` +
  `src/hooks/useNativeBridgeSync.ts` push a portfolio snapshot
  (balance/USD/AI status/last tx) to a native plugin whenever the dashboard's
  wallet state changes; a no-op outside that wrapper. The companion ZUREON
  launcher app reads it back through a signature-pinned `ContentProvider` to
  drive its home-screen tile and widget.

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
