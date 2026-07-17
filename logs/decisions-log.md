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

### 2026-07-17 — Partner price-list bootstrap (empty + Apply suggested)
- **Context:** Platform WashHouse catalog needs suggested defaults, but partners must not be silently locked to WashHouse live rates.
- **Options considered:** (A) auto-seed overrides on laundry approve, (B) empty overrides + explicit “Apply suggested prices”, (C) implicit fallthrough to suggested as live price.
- **Decision:** (B) — partners start with zero `laundry_item_prices`; Apply suggested is Slice B UI/API.
- **Why:** Suggested ≠ live; marketplace “from” can still fall back to suggested when no partner priced an item.
- **Consequences:** Public laundry list empty until partner opts in; Slice B must ship Apply + editor.
- **Revisit if:** Partner activation lag hurts discovery density.
- **ADR:** documented in `docs/features/partner-price-list.md` Decision defaults (no separate ADR).

### 2026-07-17 — Catalog money columns (dual XOR single `price_inr`)
- **Context:** WashHouse tables mix dry-clean/press pairs with by-kg and household single rates.
- **Decision:** Dual `dry_clean_inr`+`press_inr` (press nullable) XOR single `price_inr`; CHECK enforces shape.
- **Why:** Avoid overloading dry-clean semantics for kg rates; keep press N/A as null.
- **Consequences:** Schema/docs in `docs/database/schema.md`; UI labels by category/mode in Slice B+.

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
