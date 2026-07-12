# Decisions Log

> Lightweight decisions. Heavier ones get a full ADR under `docs/decisions/`.

## Entry template

```
### YYYY-MM-DD — <decision title>
- **Context:** ...
- **Options considered:** A, B, C
- **Decision:** <chosen option>
- **Why:** ...
- **Consequences:** ...
- **Revisit if:** ...
- **ADR:** `docs/decisions/ADR-NNN-...md` (if promoted)
```

## History

### 2026-05-25 — Monorepo over polyrepo
- **Context:** Two services (FastAPI + Next.js) plus shared docs/logs.
- **Decision:** Monorepo (single `git` root).
- **Why:** Shared docs, atomic cross-stack changes, simpler CI, small team.
- **Revisit if:** Repo > 1M LOC, multiple deploy cadences clash, third-party access constraints.

### 2026-05-25 — App Router + Server Components default
- **Context:** Next.js 15.
- **Decision:** App Router; server components by default, `"use client"` only when needed.
- **Why:** Performance, streaming, server-fetch ergonomics.

### 2026-05-25 — Async SQLAlchemy
- **Context:** FastAPI is async.
- **Decision:** Async SQLAlchemy 2.x throughout.
- **Why:** Avoid sync/async mismatch; better throughput.

### 2026-05-25 — RS256 JWTs
- **Context:** Auth tokens.
- **Decision:** RS256 over HS256.
- **Why:** Public key can be safely distributed; better rotation story.

### 2026-05-25 — Conventional Commits + trunk-based
- **Decision:** Short-lived branches, squash-merge to `main`, Conventional Commits.
- **Why:** Clean history, auto-changelogs, simpler review.

### 2026-05-25 — TanStack Query as the only server-state layer
- **Decision:** No Redux. Zustand only for global UI/auth. RHF + Zod for forms.
- **Why:** Each tool has a single job; less ceremony, fewer bugs.
