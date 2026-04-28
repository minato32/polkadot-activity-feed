# Polkadot Activity Feed

Cross-chain real-time activity feed for the Polkadot ecosystem. Aggregates events across parachains into a unified, filterable stream.

## Tech Stack

- **Frontend:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Chain SDK:** PAPI (`polkadot-api`) — NOT polkadot.js. Always use PAPI for new code.
- **Indexer:** SubQuery (historical data)
- **Database:** PostgreSQL + TimescaleDB
- **Real-time:** Redis Pub/Sub + WebSocket
- **RPC Provider:** OnFinality (free tier)

## Git

- **GitHub account:** minato32
- **SSH host alias:** `github-minato32` (use for remote URLs: `git@github-minato32:minato32/repo.git`)
- **Email:** bhavyaj8525@gmail.com

## Commands

```bash
npm run dev      # Start Next.js dev server
npm run build    # Production build
npm run lint     # ESLint
```

## Conventions

- TypeScript strict mode, no `any`
- Use PAPI (`polkadot-api`) for all chain interactions, never `@polkadot/api`
- Event types follow unified schema (see docs/ARCHITECTURE.md)
- Chain configs in `src/config/chains.ts`
- Event handlers in `src/handlers/`
- Components in `src/components/`

## Key Files

- `docs/ARCHITECTURE.md` — System architecture, data flow, event schema
- `docs/PLAN.md` — MVP phases, features, monetization
- `src/` — Application source code

## MVP Chains

Polkadot relay, Asset Hub, Moonbeam, Hydration, Acala
