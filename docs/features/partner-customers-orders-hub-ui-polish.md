# Feature: Customers & Orders Hub — Visual polish

> Status: **review** (Prompts 0–5 implemented — 2026-08-08)  
> Owner: ui-ux-designer + frontend-architect  
> Last updated: 2026-08-08  
> Prompt pack: [`.cursor/prompts/partner-customers-orders-hub-ui-polish.md`](../../.cursor/prompts/partner-customers-orders-hub-ui-polish.md)  
> Parent: [partner-customers-orders-hub.md](partner-customers-orders-hub.md) (IA / APIs unchanged)

## Problem

The Customers & Orders hub ships the right jobs (chips, filters, intake, print) but feels heavy: oversized buttons, loose filter gaps, stacked panels before the queue, muddy status pills, and **Your pillars** photo cards with washed-out titles/subtitles. Counter staff need a calm, dense workplace — not a demo of large tap targets on every control.

## Persona

Laundry **counter staff + owner** on phone/tablet/laptop for 8-hour shifts — English-first, scanning queues fast.

## Why now

Hub P1–P8 is functionally **review**-complete. Visual polish is the blocker to “daily tool” quality before marking the parent feature done.

## Goals

- [x] Tight header → tabs → chips → filters → list composition
- [x] Compact control size system (no blanket `min-h-[44px]`)
- [x] Declutter Orders first viewport
- [x] Readable **Your pillars** (AA contrast)
- [x] Crisp status badges + compact row/card actions
- [ ] Light + dark, 375 / 768 / 1280 (staging manual)

## Non-goals

- No IA / tab / chip semantic / API changes
- No Shop Floor mode revival
- No redesign of Logistics / Money / Staff hubs (pillar **card** only)
- No new endpoints

---

## Decisions (HARD)

### 1) First-viewport composition (`/partner/orders?tab=orders`)

**Above the fold (375px target):**

```text
┌─────────────────────────────────────┐
│ Header: title + New order (primary) │
│         Print · Requests (quiet)    │
├─────────────────────────────────────┤
│ Tabs: Orders · Find · Requests · …  │
├─────────────────────────────────────┤
│ Slim metric row (3 compact stats)   │  ← compressed TodayChip
├─────────────────────────────────────┤
│ Find phone (inline, no fat panel)   │  ← search only; desk via tab
├─────────────────────────────────────┤
│ Recent today (optional strip)       │
│ Shortcut chips (scroll rail)        │
│ Filter toolbar                      │
│ Order queue starts…                 │
└─────────────────────────────────────┘
```

| Block | Fate |
| ----- | ---- |
| Header + tabs | Stay |
| TodayChip strip | **Compress** → slim metric row (`h-9`–`h-10`, no fat cards) |
| Find customer `PartnerPanel` | **Demote** → inline search strip; drop long description + duplicate “Full Desk / All requests” toolbar (tabs already own those jobs). Keep drawer/create flows. |
| Waiting requests panel | **Collapse** → single compact link row with count (no full list on Orders tab). Full inbox stays on Requests tab. |
| Recent customers | Keep, **tighter** chips (`h-9`) |
| Chips + filters + table | Stay; primary focus |
| InfoBanner “Your laundry only” | **Remove** from Orders strip (redundant with desk); keep on full Desk if needed |

**Block order in DOM:** metrics → find phone → waiting link → (queue: recent → scope → chips → filters → table)

### 2) Control size system (`ButtonSizeMap`)

| Role | Visual height | Notes |
| ---- | ------------- | ----- |
| Header primary (New order) | `h-9` (36) | `size="sm"`; mobile still comfortable |
| Header secondary (Print, Requests) | `h-9` | `outline`/`ghost`; icon + label |
| Shortcut chip | `h-8` → `sm:h-9` | Not `min-h-[44px]` |
| Filter input/select | `h-9` | Shared baseline |
| Table/card primary action | `h-9` | Advance / Accept |
| Table/card secondary | `h-8`–`h-9` | Ghost/outline |
| Print compact icons | `h-8 w-8` | Was `min-h-11` |
| FAB | `h-12` | Mobile only; primary |
| Touch floor | 40×40 min via padding where chrome is smaller | Primary CTAs may stay ~44 |

**Rule:** Kill blanket `min-h-[44px]` on hub outline buttons. Prefer `h-9` + `px-3`.

### 3) Chip visual language

- **Radius:** `rounded-full` (ONE system for shortcut chips + recent + status badges).
- **Gap:** `gap-1.5`
- **Mobile:** horizontal scroll rail (`w-max`); **desktop (`sm+`):** wrap
- **Unselected:** `border-border/70 bg-background text-foreground hover:bg-muted/50`; icon `text-muted-foreground`
- **Selected:** `bg-primary text-primary-foreground border-primary shadow-none`
- **Print link:** same unselected chrome (not a separate CTA style)
- **Type:** `text-xs sm:text-sm font-medium`; icon `h-3.5 w-3.5`

### 4) Filter toolbar layout

- **`sm+`:** one row `flex items-center gap-2` — search `flex-1 min-w-[12rem] max-w-md h-9`; selects `h-9 w-[8.75rem]` (status slightly wider `w-36` if needed)
- **Mobile:** search full width; selects `grid grid-cols-3 gap-2` (compact native selects, no stacked full-width towers)
- Filter gap never > `gap-2`

### 5) Status badge redesign

| Status | Classes (use token pairs that pass AA) |
| ------ | -------------------------------------- |
| confirmed | `bg-warning-muted text-warning` |
| pickup_assigned | `bg-info-muted text-info` |
| picked_up | `bg-brand-50 text-brand-900 dark:bg-brand-900/50 dark:text-brand-50` |
| washing | `bg-warning-muted text-warning` |
| ironing | `bg-muted text-foreground` |
| ready | `bg-success-muted text-success` |
| out_for_delivery | `bg-primary/15 text-primary` |
| delivered | `bg-muted text-foreground` |
| cancelled | `bg-danger-muted text-danger` |

- Size: `text-[11px] font-medium`; icon `h-3 w-3`; `px-2 py-0.5`; `rounded-full`; `gap-1`
- Icon + label always (status not by color alone)

### 6) Your pillars — choose **C: split card**

- Top ~58%: image `object-cover`
- Bottom: **solid** `bg-card` text panel (guaranteed contrast)
- Title: `text-sm font-semibold text-foreground`
- Subtitle: `text-[11px] text-muted-foreground` on card bg (≥4.5:1)
- Badge: top-right over image (not over text)
- Height: consistent `min-h-[8.5rem]` mobile; grid `gap-2.5`
- Hover: shadow lift only (`hover:shadow-md`), scale ≤1.01; respect reduced motion
- Arrow in text panel, trailing

### 7) Order list density

- Desktop table + mobile cards: meta row = status + source (+ payment if present) on one line
- Primary advance: `h-9`, full-width OK on mobile card footer only
- PrintOrderActions in lists: `layout="compact"` with `h-8 w-8` buttons
- Reduce card vertical padding (`p-3` / `py-3`)

### 8) Microcopy

| Before | After |
| ------ | ----- |
| “Customers and their orders in one place.” | “Find customers, run the queue, print tags and bills.” |
| “Your pillars” description long | “Orders, logistics, people, money.” |
| Find panel long description | Drop; placeholder carries the job |
| Waiting panel title+list | “Waiting requests · N” link to Requests tab |

---

## Component → change map

| File | Change |
| ---- | ------ |
| `partner-orders-hub.tsx` | Header sizes; description; panel `space-y-3` |
| `partner-orders-shortcut-chips.tsx` | Slim chips, gap-1.5, h-8/h-9 |
| `partner-orders-filter-bar.tsx` | Toolbar layout; h-9; 3-col mobile selects |
| `partner-recent-customers-strip.tsx` | Compact chips |
| `partner-customer-scope-bar.tsx` | Tighten if oversized |
| `partner-orders-today-panel.tsx` | Slim metrics; inline find; collapse waiting |
| `partner-orders-new-order-sheet.tsx` | Header `h-9`; FAB `h-12` |
| `partner-status-badge.tsx` | Contrast + rounded-full |
| `partner-orders-table.tsx` | Action heights; meta row |
| `partner-order-card.tsx` | Compact CTAs / print |
| `print-order-actions.tsx` | Compact `h-8` (hub lists) |
| `owner-pillar-card.tsx` | Split card pattern C |
| `partner-overview-view.tsx` | Pillars section copy/gap |
| `orders-hub-tabs.tsx` | Optical weight tweak if chunky |
| `partner-orders-empty-state.tsx` | CTA size align |
| Tests under `orders-hub/` | Update structure assertions; keep testids |

---

## Acceptance (pack)

- Hub feels one system; queue visible quickly on 375px
- Pillars titles/subtitles readable light + dark
- No IA/API regressions; pagination default 10 unchanged
