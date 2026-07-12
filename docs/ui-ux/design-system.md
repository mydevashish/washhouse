# Design System

The DLM design language: youth-focused, premium, modern, mobile-first.

## Tokens

Single source of truth: `frontend/styles/tokens.css`. Mirrored in `frontend/tailwind.config.ts`.

| Group     | Vars                                                  |
| --------- | ----------------------------------------------------- |
| Brand     | `--brand-50/100/500/600/700/900` (WashHouse navy/royal) |
| Sky       | `--sky-100/400/500/600` (WashHouse cyan/teal)         |
| Accent    | `--accent-500/600`                                    |
| Surface   | `--bg-0/1/2`, `--fg-0/1/2`, `--border`                |
| Status    | `--success / --warning / --danger / --info`           |
| Radii     | `--radius-sm/md/lg/xl/2xl`                            |
| Shadows   | `--shadow-soft / --shadow-pop`                        |
| Motion    | `--ease-out / --ease-in / --dur-fast / --dur-base / --dur-slow` |

## Typography

- Primary: **Geist** / Inter (sans)
- Mono: **Geist Mono** / JetBrains
- Loaded via `next/font` (display: swap)
- Limit to 2 families

## Type scale (mobile → desktop)

| Token        | Mobile         | Desktop          |
| ------------ | -------------- | ---------------- |
| `text-xs`    | 12 / 16        | 12 / 16          |
| `text-sm`    | 14 / 20        | 14 / 20          |
| `text-base`  | 15 / 24        | 16 / 26          |
| `text-lg`    | 18 / 28        | 18 / 28          |
| `text-xl`    | 20 / 28        | 20 / 28          |
| `text-2xl`   | 24 / 32        | 28 / 36          |
| `text-3xl`   | 28 / 36        | 36 / 44          |
| `text-display` | 40 / 48      | 56 / 64          |

## Spacing

- 4-px base grid (Tailwind default)
- Section padding: 64–96 desktop, 32–48 mobile

## Components

- Use **shadcn/ui** primitives
- New atoms require Storybook story + tests
- Don't fork shadcn internals; compose

## Imagery

- Warm, real-world photography
- Minimal, geometric illustrations
- No drop-shadow gradient clichés

## Iconography

- `lucide-react`
- 20 px body, 24 px nav, 16 px dense

## Dark mode

- `class="dark"` strategy
- Tokens duplicated for dark
- Default = system; user can override

## Buttons

- Primary action: brand-500 (`#1d4ed8`) fill, white text (WCAG AA+)
- Secondary: bg-2 / border
- Ghost: transparent
- Press feedback: `active:scale-[0.98]`

## Tables

- Stack into cards on mobile
- Tabular only on `md+`

## Forms

- One column on mobile, two on `md+` only when fields are clearly grouped
- Inline validation on blur
- Primary CTA stacked at bottom on mobile

## Empty / loading / error

Every list and detail view has all three. See `.cursor/checklists/new-component.md`.

## Microcopy

See [`microcopy.md`](microcopy.md).
