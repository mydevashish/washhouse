# Architecture Decision Records (ADRs)

Each significant decision lives here.

## Format

`ADR-<NNN>-<slug>.md` using `.cursor/templates/adr.md`.

## Index

| ADR     | Title                                       | Status     | Date       |
| ------- | ------------------------------------------- | ---------- | ---------- |
| ADR-001 | (planned) Choose payment provider           | proposed   | -          |
| ADR-002 | (planned) Subscription billing model        | proposed   | -          |

## When to write an ADR

- Choice would surprise a future engineer
- New external service / vendor
- Schema-shape decisions with long-term implications
- Major library or pattern shift

## When NOT to write an ADR

- Routine implementation choices
- Cosmetic decisions
- Reversible trivial choices

Use `logs/decisions-log.md` for everyday decisions.
