# Architecture — Polkadot Activity Feed

## Overview

Unified real-time stream of notable events across all Polkadot parachains. Aggregates transfers, governance, staking, XCM, runtime upgrades, and coretime events into a single filterable feed.

---

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                          │
│  Next.js + Tailwind + shadcn/ui                     │
│  PAPI + Smoldot (optional in-browser light client)  │
│  WebSocket client for real-time push                 │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│                   API LAYER                          │
│  GraphQL (unified query) + WebSocket (push)          │
│  Event normalization + enrichment                    │
└───────┬──────────────────────────────┬──────────────┘
        │                              │
┌───────▼───────┐            ┌─────────▼─────────────┐
│  HISTORICAL   │            │     REAL-TIME          │
│  SubQuery     │            │  PAPI WebSocket subs   │
│  indexer      │            │  per chain → event     │
│  → PostgreSQL │            │  bus (Redis Pub/Sub)   │
└───────────────┘            └───────────────────────┘
        │                              │
        └──────────┬───────────────────┘
                   │
        ┌──────────▼──────────┐
        │    DATA SOURCES     │
        │  Polkadot Relay     │
        │  Asset Hub          │
        │  Moonbeam           │
        │  Hydration          │
        │  Acala              │
        │  + more parachains  │
        └─────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| Chain interaction | **PAPI** (`polkadot-api`) | Modern, typed, <50KB, light-client ready |
| Historical indexing | **SubQuery** | Best multi-chain Substrate support, unified GraphQL |
| Real-time streaming | **PAPI WebSocket + Redis Pub/Sub** | Low latency event push |
| Database | **PostgreSQL + TimescaleDB** | Relational + time-series queries |
| API | **GraphQL + WebSocket server** | Unified query + push |
| Frontend | **Next.js + Tailwind + shadcn/ui** | Standard in Polkadot ecosystem |
| RPC provider | **OnFinality** (free: 400K req/day) | 134+ networks, archive nodes |
| Alerts | **Telegram bot + Discord webhook** | Multi-channel delivery |

---

## Data Flow

### Ingestion Pipeline

1. **PAPI subscribers** connect to each parachain via WebSocket (OnFinality endpoints)
2. Subscribe to `system.events` per block using `typedApi.event.{Pallet}.{Event}.watch()`
3. Raw events → **Event Normalizer** → unified schema
4. Normalized events written to PostgreSQL + published to Redis Pub/Sub
5. WebSocket server pushes new events to connected frontend clients

### Historical Backfill

1. SubQuery indexer processes historical blocks per chain
2. Maps pallet events to unified schema
3. Stores in same PostgreSQL database
4. Exposed via auto-generated GraphQL API

---

## Event Taxonomy

### Trackable Event Categories

| Category | Pallet Events | Significance |
|----------|--------------|--------------|
| **Transfers** | `balances.Transfer`, `assets.Transferred` | Filter by threshold (whale detection) |
| **XCM** | `xcmPallet.Sent/Attempted`, `messageQueue.Processed/Failed` | Cross-chain correlation |
| **Governance** | `referenda.Submitted/Confirmed/Rejected`, `convictionVoting.Voted`, `treasury.Awarded` | All OpenGov activity |
| **Staking** | `staking.Rewarded/Slashed`, `imOnline.SomeOffline`, `nominationPools.*` | Validator/nominator alerts |
| **Runtime** | `system.CodeUpdated`, `multiBlockMigrations.*` | Upgrade tracking |
| **Parachains** | `paraInclusion.CandidateIncluded`, `broker.Purchased` | Coretime + block production |
| **Identity** | `identity.IdentitySet/Cleared` | On-chain identity changes |
| **DeFi** | `assetConversion.SwapExecuted`, `contracts.ContractEmitted` | DEX + smart contract activity |

---

## Unified Event Schema

```sql
CREATE TABLE events (
  id            BIGSERIAL PRIMARY KEY,
  chain_id      TEXT NOT NULL,
  block_number  BIGINT NOT NULL,
  timestamp     TIMESTAMPTZ NOT NULL,
  event_type    TEXT NOT NULL,        -- 'transfer', 'governance_vote', 'xcm_sent'
  pallet        TEXT NOT NULL,        -- 'balances', 'referenda'
  method        TEXT NOT NULL,        -- 'Transfer', 'Voted'
  accounts      TEXT[] NOT NULL,      -- involved addresses
  data          JSONB NOT NULL,       -- event-specific payload
  significance  SMALLINT DEFAULT 0,   -- 0=normal, 1=notable, 2=major
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_events_type_time ON events (event_type, timestamp DESC);
CREATE INDEX idx_events_chain_time ON events (chain_id, timestamp DESC);
CREATE INDEX idx_events_accounts ON events USING GIN (accounts);
CREATE INDEX idx_events_significance ON events (significance, timestamp DESC);
```

---

## Key Libraries

| Library | Package | Purpose |
|---------|---------|---------|
| PAPI | `polkadot-api` | Chain interaction, typed event subscriptions |
| PAPI Smoldot | `polkadot-api/smoldot` | In-browser light client |
| PAPI descriptors | `@polkadot-api/descriptors` | Type-safe chain bindings |
| SubQuery SDK | `@subql/node`, `@subql/query` | Historical indexing |

---

## RPC Endpoints (MVP chains)

| Chain | WebSocket | Provider |
|-------|-----------|----------|
| Polkadot | `wss://polkadot.api.onfinality.io/public-ws` | OnFinality |
| Asset Hub | `wss://statemint.api.onfinality.io/public-ws` | OnFinality |
| Moonbeam | `wss://moonbeam.api.onfinality.io/public-ws` | OnFinality |
| Hydration | `wss://hydradx.api.onfinality.io/public-ws` | OnFinality |
| Acala | `wss://acala-polkadot.api.onfinality.io/public-ws` | OnFinality |

---

## XCM Message Correlation

Cross-chain messages tracked by correlating:
1. `xcmPallet.Sent` on source chain (contains destination + message hash)
2. `messageQueue.Processed` on destination chain (contains origin)
3. Message hash links both sides → display as single "cross-chain transfer" event

---

## Significance Scoring

| Score | Criteria | Examples |
|-------|----------|---------|
| 0 | Routine | Normal transfers, era rewards |
| 1 | Notable | Transfers >10K DOT, new referenda, validator offline |
| 2 | Major | Slashing, runtime upgrade, failed XCM, referendum confirmed/rejected |
