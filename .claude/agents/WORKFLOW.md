# Polkadot Activity Feed — Development Workflow

## Agents (5)

| Agent | Model | Role |
|---|---|---|
| `architect` | **Opus** | Plan features, create issues, manage lifecycle, orchestrate pipeline |
| `frontend-engineer` | Sonnet | Implement FE in `packages/frontend` |
| `backend-engineer` | Sonnet | Implement BE in `packages/backend` + `packages/shared` |
| `test-writer` | Sonnet | Write + run tests for PRs (FE + BE) |
| `pr-reviewer` | **Opus** | Code review, quality gate, approve, merge |

**Model rule (HARD):** `architect` and `pr-reviewer` run on Opus — deep reasoning for planning and catching subtle bugs. Engineers + test-writer run on Sonnet for speed. Pass the `model` parameter when spawning sub-agents.

## Pipeline (4 phases per feature)

```
PHASE 1: PLANNING
  architect → analyze requirements
  architect → create GitHub issues (with AC, tech approach, FE/BE deps)
  architect → set milestone + issue order

PHASE 2: IMPLEMENTATION (per issue)
  architect → pick next issue, create branch
      ↓
  backend-engineer (if BE/shared work needed — always lands first)
      ↓
  frontend-engineer (if FE work needed — after BE is done)
      ↓
  architect → push branch, open PR

PHASE 3: QUALITY (per PR)
  test-writer → write tests, run suite, commit to PR branch
      ↓
  pr-reviewer → full review (code, types, security, contracts, tests)
      ↓
  IF findings:
    pr-reviewer → post inline findings
    engineer (FE or BE) → fix + push
    pr-reviewer → re-review (loop until clean)
      ↓
  pr-reviewer → post PR Review and Summary → approve → merge

PHASE 4: CLOSURE
  architect → close issue, sync branch, update state, pick next
```

## Backend-First Rule (HARD)

Before starting ANY FE issue, architect must audit BE dependencies:
1. Read FE issue → extract every endpoint/field dependency
2. Check if BE already ships it
3. **GREEN** → proceed with FE. **YELLOW/RED** → file BE issue first, implement BE, then FE
4. No FE stubs, mocks, or TODO-defers for missing BE capabilities

## Conventions (all agents)

### Git
- Feature branches: `feat/`, `fix/`, `test/`, `chore/`
- Never commit directly to `main`
- Never force push; never skip hooks (`--no-verify`)
- Stage specific files — `git add <path>`, never `git add .` or `git add -A`
- Conventional Commits: `type(scope): subject` (imperative, ≤72 chars)
- Remote: `git@github-minato32:minato32/polkadot-activity-feed.git`

### Code quality gates (before PR)
- `npm run lint` PASS (all workspaces)
- `npm run build` PASS (all workspaces)
- Tests PASS with zero regressions

### No AI attribution (HARD)
- Zero `Co-Authored-By`, zero "Generated with Claude", zero AI references
- Zero emojis in code, commits, PRs, reviews
- Plain text markers: PASS/FAIL, Critical/Improvement/Suggestion

### TypeScript
- Strict mode, no `any`
- Use PAPI (`polkadot-api`) for chain interactions, never `@polkadot/api`
- Shared types imported as `@polkadot-feed/shared`

### Monorepo
- Types/configs change in `packages/shared` → build shared before FE/BE
- Frontend: `packages/frontend` (Next.js 14 App Router, port 3000)
- Backend: `packages/backend` (Fastify, port 3001)
- Shared: `packages/shared` (@polkadot-feed/shared)

## Agent Memory (HARD)

- Each agent has memory at `.claude/agents/memory/<agent-name>.md`
- Read memory at start of every invocation; update at end
- **ALWAYS read `mistakes-log.md` before starting any task**
- After any bug found or review fix, log it in `mistakes-log.md`

## State Tracking

`.claude/agents/memory/state.json` tracks:
- Current issue being worked
- Completed issues + PRs
- Pipeline phase for active work
- Milestone progress

## Issue Naming Convention

- Prefix: `FE:` or `BE:` or `SHARED:`
- Body MUST include `## Acceptance Criteria` checklist
- Body MUST include `## Technical Approach` section
- Label: `frontend`, `backend`, `shared`, `bug`, `tech-debt`

## Repo

| Repo | Default branch | Remote |
|---|---|---|
| polkadot-activity-feed | `main` | `minato32/polkadot-activity-feed` |
