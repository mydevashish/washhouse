# Components

## `ui/` — Design system (shadcn/ui + Radix)

Reusable primitives. Import from `@/components/ui`.

See root **`DESIGN_SYSTEM.md`** for tokens, typography, spacing, and usage.

## `layout/` — App shells

`AppShell`, `PartnerShell`, `AdminShell`, `PublicShell`

## `auth/` — Route guards

`AuthGuard`, `RoleGuard`, `AuthBootstrap`, `OptionalAuthRefresh`

## `navigation/`

`BackLink`, `PageHeader`

## `shared/` — Cross-feature molecules (future)

Prefer `ui/` for generic patterns; use `shared/` for composed but domain-agnostic widgets.
