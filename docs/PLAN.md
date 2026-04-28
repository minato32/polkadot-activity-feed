# Project Plan — Polkadot Activity Feed

## Vision

The only cross-parachain activity feed in the Polkadot ecosystem. Real-time, filterable stream of notable events across 65+ parachains. Think "Cielo Finance for Dotsama."

---

## MVP Scope

### Phase 1: Core Feed (Weeks 1-3)

**Goal:** Working feed showing real-time events from 5 chains.

- [ ] Set up Next.js frontend with Tailwind + shadcn/ui
- [ ] PAPI integration — connect to 5 chains (Polkadot, Asset Hub, Moonbeam, Hydration, Acala)
- [ ] Event ingestion service — subscribe to system events per chain
- [ ] Event normalizer — map pallet events to unified schema
- [ ] PostgreSQL + TimescaleDB setup
- [ ] Basic web UI — chronological feed with chain/type filters
- [ ] Event detail view — expand event to see full payload

**Events tracked:**
- Transfers >1000 DOT equivalent
- All governance events (referenda, votes, treasury)
- Staking slashes and offline reports
- XCM messages (sent/received/failed)
- Runtime upgrades

### Phase 2: Personalization (Weeks 3-5)

**Goal:** Users can customize their feed.

- [ ] Wallet following — track specific addresses across chains
- [ ] Custom filters — min transfer size, event types, specific chains
- [ ] Saved filter presets
- [ ] Telegram bot for alerts
- [ ] Discord webhook integration
- [ ] User accounts (wallet-based auth)

### Phase 3: Intelligence (Weeks 5-7)

**Goal:** Feed becomes smart, not just a firehose.

- [ ] Whale labeling — tag known wallets (exchanges, treasury, validators, funds)
- [ ] Significance scoring algorithm
- [ ] Daily/weekly digest emails
- [ ] XCM message correlation (link send + receive as one event)
- [ ] Event aggregation ("5 whale wallets moved DOT in last hour")

### Phase 4: Scale + Polish (Weeks 7-10)

**Goal:** Production-ready with more chains.

- [ ] Add 10+ more parachains
- [ ] SubQuery historical indexer for backfill
- [ ] Search functionality (by address, event type, amount)
- [ ] API for developers (GraphQL + REST)
- [ ] Performance optimization (pagination, virtual scrolling)
- [ ] Mobile-responsive design

---

## Monetization

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0 | Feed, 5 followed wallets, basic filters, web only |
| **Pro** | $10/mo | 100 wallets, Telegram/Discord alerts, API (1K req/day) |
| **Whale** | $30/mo | Unlimited wallets, priority alerts, full API (50K req/day), CSV export |
| **Enterprise** | Custom | Webhooks, bulk data, custom integrations, SLA |

---

## Treasury Proposal

This project fills a clear ecosystem gap. Strong candidate for Polkadot treasury funding:
- No existing cross-chain activity feed
- Increases ecosystem transparency
- Helps governance participation
- Open source

---

## Target Users

| User | Primary Value |
|------|--------------|
| Traders | Whale movements, large transfers, DEX activity |
| Governance participants | New referenda, votes, treasury awards |
| Stakers | Slashing, validator health, rewards |
| Developers | Runtime upgrades, coretime, contract events |
| Researchers | Cross-chain data, ecosystem analytics |
