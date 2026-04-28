# Polkadot Activity Feed

Cross-chain real-time activity feed for the Polkadot ecosystem. Aggregates events across parachains into a unified, filterable stream.

## Monorepo Structure

```
packages/
  frontend/   — Next.js 14 (App Router), Tailwind, shadcn/ui
  backend/    — Fastify API server, PAPI, WebSocket, Redis, PostgreSQL
  shared/     — Shared types, chain configs, constants
```

## Tech Stack

- **Frontend:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Fastify, WebSocket, PAPI (`polkadot-api`), Redis Pub/Sub, PostgreSQL + TimescaleDB
- **Shared:** TypeScript types, chain configs, constants
- **Chain SDK:** PAPI (`polkadot-api`) — NOT polkadot.js. Always use PAPI for new code.
- **Indexer:** SubQuery (historical data)
- **RPC Provider:** OnFinality (free tier)

## Git

- **GitHub account:** minato32
- **SSH host alias:** `github-minato32` (use for remote URLs: `git@github-minato32:minato32/repo.git`)
- **Email:** bhavyaj8525@gmail.com

## Commands

```bash
# Root (all packages)
npm run dev          # Start all packages in dev mode
npm run build        # Build all packages
npm run lint         # Lint all packages
npm run clean        # Clean all build artifacts

# Individual packages
npm run dev:frontend   # Next.js dev server (port 3000)
npm run dev:backend    # Fastify dev server (port 3001)

# Or using workspace flag
npm run dev -w packages/frontend
npm run dev -w packages/backend
npm run build -w packages/shared
```

## Conventions

- TypeScript strict mode, no `any`
- Use PAPI (`polkadot-api`) for all chain interactions, never `@polkadot/api`
- Event types follow unified schema in `packages/shared/src/types.ts`
- Shared types/configs imported as `@polkadot-feed/shared`
- Frontend components in `packages/frontend/src/components/`
- Backend routes in `packages/backend/src/routes/`
- Backend services in `packages/backend/src/services/`
- Event handlers in `packages/backend/src/handlers/`

## Key Files

- `docs/ARCHITECTURE.md` — System architecture, data flow, event schema
- `docs/PLAN.md` — MVP phases, features, monetization
- `packages/shared/src/types.ts` — Unified event schema types
- `packages/shared/src/chains.ts` — MVP chain configurations
- `packages/backend/.env.example` — Backend environment variables

## MVP Chains

Polkadot relay, Asset Hub, Moonbeam, Hydration, Acala
