# Product Requirements Document — Polkadot Activity Feed

**Version:** 1.0
**Date:** April 2026
**Author:** minato32

---

## 1. Product Overview

### Vision

The first cross-parachain activity feed for the Polkadot ecosystem. A real-time, filterable stream of notable events across all Polkadot parachains — transfers, governance, staking, cross-chain messages, runtime upgrades, and more — in a single unified view.

### One-Liner

"See everything happening across Polkadot — in one feed."

### Positioning

Cielo Finance built the go-to activity feed for EVM and Solana ecosystems, covering 30+ chains with wallet tracking, whale alerts, and real-time transaction feeds. Polkadot has nothing equivalent. Subscan covers individual chains. Polkassembly covers governance. Dune covers analytics. No tool unifies all activity across parachains into a single, actionable stream.

Polkadot Activity Feed fills that gap.

---

## 2. Problem Statement

### The Fragmentation Problem

Polkadot is a multi-chain ecosystem with 65+ parachains. Today, anyone who wants to stay informed about ecosystem activity faces these problems:

1. **No unified view.** Subscan shows one chain at a time. To monitor 5 chains, you need 5 browser tabs. There is no single place to see "what just happened across Polkadot."

2. **Whale movements are invisible.** Large token transfers happen across multiple chains. There is no tool that aggregates whale activity across parachains and surfaces it in real time.

3. **Governance participation is fragmented.** New referenda, votes, and treasury awards happen on the relay chain and parachains. Polkassembly and Subsquare show discussion threads, but there is no real-time feed that surfaces governance events alongside other ecosystem activity.

4. **Cross-chain messages are opaque.** XCM messages move assets between chains, but tracking a transfer from source to destination requires manually checking two explorers and correlating message hashes.

5. **No alert system.** If a validator gets slashed, a large treasury award passes, or a whale moves 100K DOT — there is no way to get notified instantly across Telegram, Discord, or email.

6. **Developers lack a unified event API.** Builders who want to integrate Polkadot activity data into their own products must cobble together multiple indexers, RPCs, and custom parsers per chain.

### Who Suffers

Every active participant in the Polkadot ecosystem: traders watching whale movements, governance participants tracking referenda, stakers monitoring validator health, developers tracking runtime upgrades, and researchers analyzing cross-chain data flows.

---

## 3. Competitive Landscape

| Tool | What It Does | What It Doesn't Do |
|------|-------------|-------------------|
| **Subscan** | Per-chain block explorer. Covers ~100 Substrate networks. Shows blocks, extrinsics, events, accounts, staking, governance. | No cross-chain unified feed. No real-time push notifications. No whale tracking. Must visit each chain separately. |
| **Polkassembly / Subsquare** | Governance discussion platform. Shows referenda, treasury proposals, votes, delegation. | Governance only. No transfers, staking, XCM, or runtime events. No real-time feed. |
| **Range Explorer** | Cross-chain XCM transaction tracking. Traces asset transfers from source to destination, including bridge hops. | XCM/bridge focused only. No governance, staking, whale tracking, or general event feed. Limited to few chains. |
| **Polkadot Multi-Chain Explorer** | Treasury-funded. Aims to build first fully multi-chain explorer with unified data models. Phase 3 (full multi-chain + XCM tracing) due July 2026. | Not yet launched. Explorer format, not activity feed format. No wallet following or alerts planned. |
| **Dune** | SQL-based analytics dashboards including Polkadot Whale Dashboard. | Requires SQL knowledge. Dashboard format, not real-time feed. No alerts. Not beginner-friendly. |
| **Nova / Talisman / SubWallet** | Multi-chain wallets with portfolio views. Nova has governance voting built in. | Account-scoped — shows only your own activity. No ecosystem-wide feed or whale tracking. |
| **Cielo Finance** | Activity feed for EVM + Solana (30+ chains). Wallet following, whale alerts, quick trading, PnL tracking. | Does not support Polkadot/Substrate chains at all. |

### Our Differentiation

- **Only cross-chain activity feed** in the Polkadot ecosystem
- **Real-time push** — WebSocket-powered, not polling
- **Unified event taxonomy** — all event types (transfers, governance, staking, XCM, runtime) in one stream
- **Significance scoring** — surfaces what matters, filters the noise
- **Wallet following + alerts** — Telegram, Discord, email notifications
- **Developer API** — programmatic access to unified cross-chain event data
- **Open source** — community-driven, treasury-fundable

---

## 4. Target Users & Personas

### Persona 1: The Trader (Raj)

- **Role:** Active DOT trader and DeFi participant
- **Goal:** Spot whale movements and large transfers before the market reacts
- **Pain Points:**
  - Checks Subscan manually for large transfers — misses most of them
  - No way to see DEX activity on Hydration alongside relay chain movements
  - Missed a whale dumping 500K DOT because he was watching the wrong chain
- **Desired Outcome:** A live feed that shows him every transfer above 10K DOT across all chains, with whale labels and instant Telegram alerts

### Persona 2: The Governance Participant (Maya)

- **Role:** DOT holder who actively votes in OpenGov referenda
- **Goal:** Never miss a new referendum, treasury award, or important vote
- **Pain Points:**
  - Uses Polkassembly for discussion but doesn't get real-time event notifications
  - Missed a referendum voting deadline because she didn't see it was submitted
  - Wants to see governance activity alongside other ecosystem events for context
- **Desired Outcome:** A feed that highlights all governance events across chains with notifications for new referenda and approaching deadlines

### Persona 3: The Staker (Viktor)

- **Role:** Nominator running stake across multiple validators
- **Goal:** Know immediately if a validator is slashed, goes offline, or underperforms
- **Pain Points:**
  - Checks staking dashboards periodically but not in real time
  - Was slashed once because a validator went offline and he didn't react in time
  - Wants to compare validator performance across chains (relay chain vs parachains)
- **Desired Outcome:** Instant alerts when any followed validator has a staking event, plus a feed view filtered to staking activity across all chains

### Persona 4: The Developer (Aisha)

- **Role:** Parachain developer building on Polkadot
- **Goal:** Monitor runtime upgrades, coretime purchases, and contract events across the ecosystem
- **Pain Points:**
  - Finds out about runtime upgrades on other chains by word of mouth or Twitter
  - No unified API to pull cross-chain event data into her monitoring tools
  - Wants to track when Asset Hub or other parachains she depends on push upgrades
- **Desired Outcome:** A filtered feed + API that shows runtime events, coretime activity, and contract deployments, with webhook integration for her monitoring pipeline

### Persona 5: The Researcher (Tomás)

- **Role:** Crypto researcher covering Polkadot for a fund
- **Goal:** Produce weekly ecosystem reports with accurate cross-chain data
- **Pain Points:**
  - Spends hours aggregating data from Subscan, Polkassembly, Dune, and chain RPCs
  - No single data source that covers all event types across all chains
  - Needs CSV exports and historical data for quantitative analysis
- **Desired Outcome:** A searchable historical feed with CSV export, covering all event types across all chains, plus a developer API for automated data pulls

---

## 5. User Stories

### P0 — Must Have (Phase 1: Core Feed)

| # | As a... | I want to... | So that... |
|---|---------|-------------|-----------|
| 1 | User | See a real-time feed of events across multiple Polkadot parachains | I have a single view of ecosystem activity |
| 2 | User | Filter the feed by chain (Polkadot, Asset Hub, Moonbeam, Hydration, Acala) | I can focus on chains I care about |
| 3 | User | Filter the feed by event type (transfers, governance, staking, XCM, runtime) | I can focus on activity categories I care about |
| 4 | User | See event details (block, timestamp, involved accounts, amounts, full payload) | I can understand what happened in each event |
| 5 | Trader | See transfers above a certain DOT threshold highlighted | I can spot large movements quickly |
| 6 | User | See events appear in the feed within seconds of on-chain finality | I'm not working with stale data |
| 7 | Governance participant | See all referenda submissions, votes, and outcomes in the feed | I don't miss any governance activity |
| 8 | Staker | See slashing events and validator offline reports in the feed | I can react to validator issues immediately |
| 9 | User | See XCM messages (sent, received, failed) in the feed | I can track cross-chain transfers |
| 10 | User | See runtime upgrade events in the feed | I know when any chain pushes an upgrade |

### P1 — Should Have (Phase 2: Personalization)

| # | As a... | I want to... | So that... |
|---|---------|-------------|-----------|
| 11 | User | Create an account using my Polkadot wallet | I can save my preferences |
| 12 | Trader | Follow specific wallet addresses across all chains | I see activity from wallets I'm tracking |
| 13 | User | Set minimum transfer size filters | I only see transfers above my threshold |
| 14 | User | Save filter presets (e.g., "Governance Only", "Whale Transfers") | I can quickly switch between views |
| 15 | User | Receive Telegram notifications for events matching my filters | I get alerted without keeping the app open |
| 16 | User | Receive Discord webhook notifications | My community server gets live event updates |
| 17 | User | Follow up to 5 wallets on the free tier | I can try the product before upgrading |
| 18 | User | See a "My Feed" view showing only events from followed wallets | I have a personalized stream separate from the global feed |

### P2 — Nice to Have (Phase 3: Intelligence)

| # | As a... | I want to... | So that... |
|---|---------|-------------|-----------|
| 19 | Trader | See whale labels on known wallets (exchanges, treasury, validators, funds) | I know WHO is moving tokens, not just how much |
| 20 | User | See a significance score on each event (normal, notable, major) | I can prioritize what to pay attention to |
| 21 | User | Receive daily or weekly digest emails summarizing top events | I stay informed without checking the feed constantly |
| 22 | User | See XCM transfers displayed as a single correlated event (source → destination) | I understand the full cross-chain transfer, not two disconnected events |
| 23 | Trader | See event aggregations ("5 whale wallets moved DOT in the last hour") | I can spot coordinated activity or trends |
| 24 | Governance participant | See governance event context (referendum title, track, current tally) alongside the feed event | I understand the significance without leaving the feed |
| 25 | Staker | See validator performance summaries alongside staking events | I can assess whether to change my nominations |

### P3 — Future (Phase 4: Scale + Polish)

| # | As a... | I want to... | So that... |
|---|---------|-------------|-----------|
| 26 | User | See events from 15+ parachains, not just the initial 5 | I have broader ecosystem coverage |
| 27 | User | Search the feed by address, event type, amount, or keyword | I can find specific historical events |
| 28 | Researcher | Export filtered events as CSV | I can analyze data in spreadsheets or custom tools |
| 29 | Developer | Access a REST/GraphQL API to query events programmatically | I can build on top of the event data |
| 30 | Developer | Set up webhook integrations for real-time event delivery | My systems react to on-chain events automatically |
| 31 | User | Use the app comfortably on mobile devices | I can check the feed on the go |
| 32 | User | Scroll through historical events with fast pagination | I can look back at past activity, not just live events |
| 33 | User | See the feed load in under 2 seconds with smooth infinite scroll | The experience feels fast and native |

---

## 6. Feature Requirements

### 6.1 Core Feed (P0)

**F1: Live Event Stream**
- Display a chronological, auto-updating feed of on-chain events
- Events appear within 5 seconds of block finality
- Feed auto-scrolls for new events unless the user has scrolled up (pause auto-scroll when reviewing history)
- Each event card shows: chain name + icon, event type badge, timestamp (relative + absolute), involved accounts (truncated with copy), key data (amount, referendum ID, etc.), significance indicator

**F2: Chain Filter**
- Multi-select chain filter: Polkadot, Asset Hub, Moonbeam, Hydration, Acala
- "All Chains" selected by default
- Filter persists across page refreshes (URL state or local storage)
- Chain selector shows event count per chain in last 24h

**F3: Event Type Filter**
- Multi-select category filter: Transfers, Governance, Staking, XCM, Runtime, Identity, DeFi, Parachains
- Can combine chain + event type filters
- Clear all / select all toggles

**F4: Event Detail View**
- Click/expand event card to see full event details
- Full payload displayed as readable key-value pairs (not raw JSON)
- Link to Subscan for the source block/extrinsic
- Copy event data button
- Show all involved accounts with identicons

**F5: Significance Indicators**
- Each event has a visual significance level: Normal (default), Notable (highlighted), Major (strongly highlighted)
- Significance rules:
  - Normal: routine transfers, era rewards, standard votes
  - Notable: transfers >10K DOT, new referenda, validator offline
  - Major: slashing, runtime upgrade, failed XCM, referendum confirmed/rejected

**F6: Event Types Tracked**
- Transfers: `balances.Transfer`, `assets.Transferred` (with DOT-equivalent value)
- Governance: referendum submitted/confirmed/rejected, votes, treasury awards
- Staking: rewards, slashes, validator offline events, nomination pool activity
- XCM: messages sent, received, and failed
- Runtime: code upgrades, multi-block migrations
- Identity: on-chain identity set/cleared
- DeFi: swap events, contract emissions
- Parachains: coretime purchases, candidate inclusions

### 6.2 Personalization (P1)

**F7: Wallet-Based Authentication**
- Sign in with Polkadot wallet (browser extension: Talisman, SubWallet, polkadot.js)
- No email/password — wallet signature only
- Session persists via JWT
- Account tied to SS58 address

**F8: Wallet Following**
- Follow wallet addresses to see their activity across all chains
- Free tier: up to 5 followed wallets
- Pro tier: up to 100 followed wallets
- Whale tier: unlimited followed wallets
- "My Feed" tab shows only events involving followed wallets
- Add wallets by pasting address or scanning from your own connected wallet

**F9: Custom Filters & Presets**
- Set persistent filters: minimum transfer size (in DOT), event types, specific chains
- Save named filter presets (e.g., "Whale Watch", "Governance Only", "My Validators")
- Quick-switch between presets from the feed toolbar
- Free tier: up to 3 presets
- Pro/Whale: unlimited presets

**F10: Telegram Alerts**
- Connect Telegram account via bot
- Choose which filter preset triggers Telegram notifications
- Rate limiting to prevent spam (max 1 message per event, cooldown per wallet)
- Message includes: event type, chain, amount (if transfer), link to event detail on the web app

**F11: Discord Webhook Integration**
- Provide a Discord webhook URL
- Choose which filter preset triggers Discord notifications
- Rich embed messages with chain icon, event details, and link
- Server admins can set up channel-specific feeds (e.g., #governance-alerts, #whale-alerts)

### 6.3 Intelligence (P2)

**F12: Whale Labeling**
- Tag known wallet addresses with human-readable labels
- Categories: Exchanges (Binance, Kraken, etc.), Treasury, Validators, Funds/VCs, Bridges, Core Team
- Community-contributed labels with moderation
- Label displayed on event cards and wallet profiles
- "Whale" badge for addresses holding >100K DOT equivalent

**F13: Significance Scoring Algorithm**
- Score each event 0-2 based on multiple factors:
  - Transfer size relative to daily average
  - Account reputation (whale, exchange, treasury)
  - Event rarity (runtime upgrades are always significant)
  - Governance stage (confirmed/rejected > submitted > voted)
- Users can configure their own significance thresholds

**F14: Daily/Weekly Digest**
- Opt-in email digest summarizing:
  - Top 10 most significant events of the period
  - Governance summary: new referenda, outcomes, treasury awards
  - Whale activity summary
  - Chain health: any slashes, offline events, runtime upgrades
- Delivered via email (or Telegram digest mode)

**F15: XCM Message Correlation**
- Link XCM send event on source chain with receive event on destination chain
- Display as a single "cross-chain transfer" event in the feed
- Show both legs: source chain → destination chain, with amounts and accounts
- Highlight failed XCM messages prominently (significance = Major)

**F16: Event Aggregation**
- Detect clusters of similar events in a time window
- Display as aggregated card: "5 whale wallets transferred DOT in the last hour — total: 2.3M DOT"
- Expandable to see individual events
- Aggregation categories: same event type + same chain, same wallet + multiple chains, whale cluster activity

### 6.4 Scale + Polish (P3)

**F17: Expanded Chain Support**
- Add 10+ additional parachains beyond MVP 5
- Priority chains: Astar, Phala, Interlay, Centrifuge, Bifrost, Zeitgeist, Pendulum, Unique, KILT, Nodle
- Chain addition should be configuration-driven, not requiring code changes per chain
- Community can request chains via GitHub issues

**F18: Search**
- Search by: wallet address (SS58 format), event type, chain, amount range, block number, time range
- Full-text search across event data
- Search results displayed in the same feed format
- Recent searches saved

**F19: CSV Export**
- Export current filtered feed as CSV
- Fields: timestamp, chain, event type, accounts, amount, significance, block number
- Date range selection for export
- Free tier: last 7 days
- Pro: last 90 days
- Whale: unlimited history

**F20: Developer API**
- REST API for querying events with the same filters available in the UI
- GraphQL API for flexible queries
- API key authentication
- Rate limits by tier:
  - Free: no API access
  - Pro: 1,000 requests/day
  - Whale: 50,000 requests/day
  - Enterprise: custom limits + SLA
- Webhook delivery for real-time event push to developer endpoints

**F21: Mobile-Responsive Design**
- Fully responsive layout for phones and tablets
- Touch-friendly event cards and filters
- Bottom navigation on mobile
- Same feature set as desktop — no features removed on mobile

**F22: Performance**
- Initial feed load under 2 seconds
- Smooth infinite scroll with virtualization (no jank at 10K+ events)
- Cursor-based pagination for consistent performance
- Events delivered via WebSocket within 5 seconds of block finality

---

## 7. Non-Functional Requirements

### Performance
- Feed loads in <2 seconds on a standard broadband connection
- WebSocket event delivery latency <5 seconds from block finality
- API response time <500ms for standard queries
- Support 10,000+ concurrent WebSocket connections

### Reliability
- 99.5% uptime target
- Graceful degradation if an RPC endpoint goes down (show data from available chains, indicate unavailable chains)
- Automatic RPC endpoint failover per chain
- Event deduplication — no duplicate events in the feed

### Security
- No private keys ever touch the backend — wallet auth is signature-based only
- API keys scoped per tier with rate limiting
- SQL injection prevention on all database queries
- XSS prevention on all user-facing content
- WebSocket connections authenticated for premium features
- No user data sold or shared — privacy-first

### Scalability
- Database designed for time-series workloads (TimescaleDB)
- Horizontal scaling of WebSocket server for push delivery
- Chain ingestion workers can be scaled independently per chain
- Event storage retention: 1 year for free tier, unlimited for paid tiers

### Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigable feed and filters
- Screen reader compatible event cards
- Color-blind friendly significance indicators (not color-only — use icons/text)

---

## 8. Monetization

| Tier | Price | Wallets | Presets | Alerts | API | History | Export |
|------|-------|---------|---------|--------|-----|---------|--------|
| **Free** | $0 | 5 | 3 | None | None | 7 days | None |
| **Pro** | $10/mo | 100 | Unlimited | Telegram + Discord | 1K req/day | 90 days | CSV |
| **Whale** | $30/mo | Unlimited | Unlimited | Priority alerts | 50K req/day | Unlimited | CSV |
| **Enterprise** | Custom | Unlimited | Unlimited | Webhooks + SLA | Custom limits | Unlimited | CSV + API bulk |

### Revenue Drivers
- **Wallet following** is the primary conversion lever — free users who follow 5 wallets and want more will upgrade
- **Alerts** are the secondary lever — getting notifications via Telegram/Discord is a strong Pro selling point
- **API access** drives Enterprise revenue from builders integrating the data
- **No ads, no data selling** — subscription-only model builds trust in the Polkadot community

---

## 9. Success Metrics

### Phase 1 (Core Feed) — Launch Metrics
| Metric | Target |
|--------|--------|
| Daily Active Users (DAU) | 500 within 30 days of launch |
| Events ingested per day | 100K+ across 5 chains |
| Feed load time (p95) | <2 seconds |
| WebSocket latency (p95) | <5 seconds from block finality |
| Uptime | >99% |

### Phase 2 (Personalization) — Engagement Metrics
| Metric | Target |
|--------|--------|
| Registered users | 2,000 within 60 days |
| Users with ≥1 followed wallet | 50% of registered users |
| Users with saved filter presets | 30% of registered users |
| Telegram/Discord alert connections | 500 |
| Free → Pro conversion rate | 5% |

### Phase 3 (Intelligence) — Retention Metrics
| Metric | Target |
|--------|--------|
| Weekly Active Users (WAU) | 3,000 |
| Digest email open rate | 40% |
| Average session duration | >3 minutes |
| Whale label coverage | 500+ labeled wallets |
| XCM correlation success rate | >90% of trackable XCM messages |

### Phase 4 (Scale + Polish) — Growth Metrics
| Metric | Target |
|--------|--------|
| Chains supported | 15+ |
| Monthly API requests (all tiers) | 1M+ |
| Monthly Recurring Revenue (MRR) | $5K |
| GitHub stars | 500+ |
| Treasury proposal funded | Yes |

---

## 10. Treasury Proposal Fit

Polkadot Activity Feed is a strong candidate for Polkadot Treasury funding:

| Criterion | How We Meet It |
|-----------|---------------|
| **Ecosystem gap** | No cross-chain activity feed exists. Subscan is per-chain, Polkassembly is governance-only, wallets are account-scoped. |
| **Public good** | Free tier is usable without paying. Open source. Benefits all ecosystem participants. |
| **Governance support** | Surfaces governance events in real-time, increasing participation and transparency. Makes OpenGov more accessible. |
| **Developer tooling** | Provides a unified API that doesn't exist today. Reduces the barrier for builders to integrate Polkadot activity data. |
| **Cross-chain by design** | Not just another single-chain tool. Built from day one to span the entire parachain ecosystem. |
| **Aligned incentives** | More visibility into ecosystem activity → more informed participants → healthier governance and markets. |
| **Deliverable milestones** | 4 clear phases with measurable outcomes. Treasury can fund per-phase with accountability checkpoints. |

### Suggested Treasury Ask
- Phase 1 (Core Feed): 15,000 DOT
- Phase 2 (Personalization): 12,000 DOT
- Phase 3 (Intelligence): 10,000 DOT
- Phase 4 (Scale + Polish): 8,000 DOT
- **Total: 45,000 DOT** (payable per milestone upon delivery)

---

## 11. Risks & Assumptions

### Assumptions
1. OnFinality free tier (400K requests/day) is sufficient for MVP with 5 chains
2. PAPI (polkadot-api) has stable WebSocket subscription support for all MVP chains
3. Users in the Polkadot ecosystem are willing to pay for premium features
4. Polkadot Treasury will fund ecosystem tools that fill clear gaps
5. XCM message format is consistent enough across chains to enable correlation

### Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| RPC rate limits hit on free tier | Medium | High | Implement request batching, caching, and fallback to paid RPC tiers. Budget for RPC costs in treasury proposal. |
| Low user adoption despite ecosystem gap | Medium | High | Launch with strong Polkadot community engagement (Twitter, forum, Element chat). Target governance participants first — they're most active and vocal. |
| Polkadot Multi-Chain Explorer launches first with similar features | Medium | Medium | Differentiate on UX (activity feed vs. block explorer), alerts, wallet following, and API. Their focus is explorer; ours is feed + notifications. |
| PAPI breaking changes | Low | Medium | Pin PAPI versions, maintain abstraction layer over chain connections, follow PAPI release notes. |
| Chain event schema changes on upgrades | Medium | Medium | Build event normalizers per chain that can be updated independently. Runtime upgrades are tracked events — use them as triggers to review normalizer compatibility. |
| Whale label accuracy and moderation burden | Medium | Low | Start with known exchange/treasury addresses from public sources. Add community submission with moderation queue in Phase 3. |
| WebSocket scalability at 10K+ connections | Low | Medium | Use Redis Pub/Sub for fan-out. Horizontally scale WebSocket servers behind load balancer. Load test before each phase launch. |

---

## 12. Appendix: Event Categories

### Transfers
| Event | Source | Significance |
|-------|--------|-------------|
| DOT transfer | `balances.Transfer` | Normal (<1K DOT), Notable (1K-100K), Major (>100K) |
| Asset transfer | `assets.Transferred` | Same thresholds adjusted per asset |
| Teleport (Asset Hub ↔ Relay) | `xcmPallet.Attempted` | Notable |

### Governance
| Event | Source | Significance |
|-------|--------|-------------|
| Referendum submitted | `referenda.Submitted` | Notable |
| Referendum confirmed | `referenda.Confirmed` | Major |
| Referendum rejected | `referenda.Rejected` | Major |
| Vote cast | `convictionVoting.Voted` | Normal (regular), Notable (whale vote) |
| Treasury award | `treasury.Awarded` | Notable (<100K DOT), Major (>100K DOT) |

### Staking
| Event | Source | Significance |
|-------|--------|-------------|
| Era reward | `staking.Rewarded` | Normal |
| Slash | `staking.Slashed` | Major |
| Validator offline | `imOnline.SomeOffline` | Notable |
| Nomination pool event | `nominationPools.*` | Normal |

### XCM (Cross-Chain Messages)
| Event | Source | Significance |
|-------|--------|-------------|
| XCM sent | `xcmPallet.Sent` | Normal |
| XCM processed | `messageQueue.Processed` | Normal |
| XCM failed | `messageQueue.ProcessingFailed` | Major |

### Runtime
| Event | Source | Significance |
|-------|--------|-------------|
| Code upgrade | `system.CodeUpdated` | Major |
| Migration started | `multiBlockMigrations.MigrationAdvanced` | Notable |
| Migration completed | `multiBlockMigrations.MigrationCompleted` | Notable |

### Identity
| Event | Source | Significance |
|-------|--------|-------------|
| Identity set | `identity.IdentitySet` | Normal |
| Identity cleared | `identity.IdentityCleared` | Normal |

### DeFi
| Event | Source | Significance |
|-------|--------|-------------|
| Swap executed | `assetConversion.SwapExecuted` | Normal (small), Notable (large) |
| Contract emitted | `contracts.ContractEmitted` | Normal |

### Parachains
| Event | Source | Significance |
|-------|--------|-------------|
| Coretime purchased | `broker.Purchased` | Notable |
| Candidate included | `paraInclusion.CandidateIncluded` | Normal |
