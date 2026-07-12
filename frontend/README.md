# DLM Frontend (Next.js)

The Next.js 15 application for Doorstep Laundry Marketplace.

## Stack

- Next.js 15 (App Router, RSC) · TypeScript strict · Tailwind CSS · shadcn/ui
- TanStack Query · Zustand · React Hook Form · Zod · Axios
- Framer Motion · React Three Fiber + Drei (landing only)
- Playwright · Jest · React Testing Library · MSW

## Quick start

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open <http://localhost:3000>.

## Scripts

```bash
pnpm dev              # dev server
pnpm build            # production build
pnpm start            # serve prod build
pnpm lint             # ESLint
pnpm lint:fix         # fix
pnpm type-check       # tsc --noEmit
pnpm test             # jest
pnpm test:watch
pnpm test:e2e         # Playwright
pnpm test:e2e:ui      # Playwright UI mode
pnpm analyze          # @next/bundle-analyzer
pnpm storybook        # Storybook
```

## Project layout

See `.cursor/rules/03-folder-structure.md`. TL;DR:

```
frontend/
├── app/                    # App Router (thin routes)
├── components/
│   ├── ui/                 # shadcn primitives
│   ├── layout/             # header, footer, sidebar
│   └── shared/             # cross-feature
├── features/               # feature folders (the heart of the app)
├── hooks/
├── lib/                    # api.ts, env, logger, utils, motion
├── providers/              # Query, Theme, Auth
├── services/               # external SDK wrappers
├── store/                  # global Zustand
├── styles/                 # tokens + globals
├── types/
├── utils/
├── public/
└── tests/                  # e2e + unit
```

## Architecture rules

- Routes in `app/` are thin; logic lives in `features/`.
- Server Components by default; `"use client"` only when needed.
- Server data via TanStack Query.
- Forms via RHF + Zod.
- All HTTP via the configured axios instance in `lib/api.ts`.
- Mobile-first.

See `.cursor/agents/frontend-architect.md`.

## Useful links

- UI/UX rules: `.cursor/rules/13-ui-ux.md`
- Responsive rules: `.cursor/rules/19-responsive-design.md`
- A11y rules: `.cursor/rules/10-accessibility.md`
- 3D rules: `.cursor/rules/20-three-d-rules.md`
- Motion rules: `.cursor/rules/18-animation-usage.md`
