# Partner WashHouse Ops Visual — QA matrix

> Spec: [partner-washhouse-ops-visual.md](../features/partner-washhouse-ops-visual.md)  
> Last updated: 2026-08-09

| Area | Route | Check | Light | Dark | 375px | 1280px |
| ---- | ----- | ----- | ----- | ---- | ----- | ------ |
| Shell nav | all partner | Active item `rounded-2xl` + `bg-primary/10`; sidebar from `xl`; footer “Today · N orders” → `/partner` | ✓ | ✓ | ✓ | ✓ |
| Dashboard KPI | `/partner` | Demo labels + live analytics; full create grid + bottom panels | ✓ | ✓ | ✓ | ✓ |
| Create order | `/partner` | Single-page order-demo layout; walk-in API; no fake INV | ✓ | ✓ | ✓ | ✓ |
| Status bars | `/partner` | Numeric labels + meter roles; track readable in dark | ✓ | ✓ | ✓ | ✓ |
| Trend | `/partner` | Empty or 2-bar week compare only | ✓ | ✓ | ✓ | ✓ |
| New order | `/partner/new-order` | Two-column `xl+`; sticky summary; service dialog focus | ✓ | ✓ | ✓ | ✓ |
| Orders hub | `/partner/orders` | Tabs unchanged; chip keyboard + focus ring | ✓ | ✓ | ✓ | ✓ |
| Desk | `?tab=desk` | Snapshot cards after lookup | ✓ | ✓ | ✓ | ✓ |
| Images | hero surfaces | `services.webp` on ops hero only; catalog elsewhere | ✓ | — | ✓ | ✓ |
| Horizontal scroll | all touched | No overflow @ 360px (`min-w-0`, `overflow-x-hidden`) | ✓ | ✓ | ✓ | ✓ |

Unit: `frontend/features/partner/components/ops-visual/partner-ops-visual.test.tsx`
