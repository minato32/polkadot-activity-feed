# PR Review Workflow

Every PR goes through this process. No shortcuts.

## Review Pipeline (per PR)

```
PR Created
   ↓
1. test-writer — write + run tests, commit to PR branch        [Sonnet]
   ↓
2. pr-reviewer — full code review                               [Opus]
   ↓
3. IF findings → inline comments → engineer fixes → re-review
   ↓
4. pr-reviewer — post PR Review and Summary → approve → merge
```

## Step 1 — Test Writer

- Write tests for all new/changed code on the PR branch
- Run full test suite across both FE + BE
- Commit tests: `test(scope): add tests for <feature>`
- Report coverage on changed files
- Tests must pass before handing to pr-reviewer

## Step 2 — PR Review

pr-reviewer reads full diff + tests. Review checklist:
1. **Correctness** — logic, edge cases, error handling
2. **Conventions** — file layout, naming, TypeScript strict, no `any`
3. **Type safety** — shared types used correctly, no casts
4. **Security** — no secrets, proper auth, input validation
5. **FE↔BE contract** — endpoints, request/response shapes, error shapes match
6. **Test quality** — assertions meaningful, edge cases covered, no false greens
7. **Scope discipline** — no drive-by refactors, matches issue AC
8. **PAPI usage** — `polkadot-api` not `@polkadot/api`, correct subscription patterns

## Inline Findings Format

Every finding is a `file:line` inline comment with severity tag:

| Tag | When | Impact |
|---|---|---|
| `**[CRITICAL]**` | Bug, contract drift, security, missing test, broken AC | Blocks merge |
| `**[IMPROVEMENT]**` | Weak assertion, missing edge case, structural smell | Should fix |
| `**[SUGGESTION]**` | Naming, comment, micro-perf, style | Nice to have |

Each comment: ≤2 sentences — problem + concrete fix. Sort: CRITICAL → IMPROVEMENT → SUGGESTION, then path/line.

### Posting inline review

```bash
gh api -X POST /repos/minato32/polkadot-activity-feed/pulls/N/reviews --input <json>
# event: "REQUEST_CHANGES" if ≥1 CRITICAL, else "COMMENT"
# body: "Inline findings: X critical, Y improvements, Z suggestions"
# comments: [{path, line, body}, ...]
```

## Fix Loop

1. pr-reviewer posts inline findings
2. Engineer (FE or BE) reads each finding, commits fix: `fix(scope): address PR #N review comments`
3. Engineer pushes, posts comment: `All <N> findings addressed in <sha>. Ready for re-review.`
4. pr-reviewer re-reviews against new SHA
5. New findings → loop back to step 1
6. Clean (N=0) → post PR Review and Summary

## PR Review and Summary Template (MANDATORY merge gate)

```markdown
## PR Review and Summary

| # | Check | Verdict | Notes |
|---|-------|---------|-------|
| 1 | Tests | PASS / FAIL | <test count, coverage> |
| 2 | Code Review | PASS / FAIL | <1-line finding> |
| 3 | Type Safety | PASS / FAIL | <strict mode, no any> |
| 4 | Security | PASS / FAIL | <secrets, auth, validation> |
| 5 | FE↔BE Contract | PASS / FAIL | <endpoint/shape verification> |
| 6 | Scope Check | PASS / FAIL | <matches AC, no scope creep> |

### Scope
<2-4 bullets>

### Acceptance Criteria
- [x] <criterion from issue>

### Test Results
- Frontend: X / Y tests, lint PASS, build PASS
- Backend: X / Y tests, lint PASS, build PASS

### Inline Findings — RESOLVED
- **[CRITICAL]** <one-line> — resolved in `<sha>`
- **[IMPROVEMENT]** <one-line> — resolved in `<sha>`

### Final Verdict
APPROVED FOR MERGE — all findings resolved, all checks green.
```

**No PR may be merged until this review is posted.** If a PR slipped through, post retrospectively.

## Rules

1. Sequential — tests before review, review before merge
2. No skipping — every PR gets full review even if trivial
3. Failures block — fix before continuing
4. Test commits on same PR branch
5. All agents update memory after invocation
6. pr-reviewer owns the merge after posting PR Review and Summary
