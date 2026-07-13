# Bug Tracker

> Critical / production bugs go here. Trivial UI nits → linear/jira/github issues.

## Severity

| Sev | Meaning                                       | SLA              |
| --- | --------------------------------------------- | ---------------- |
| S0  | Production down / data loss / security breach | < 1 hour         |
| S1  | Major feature broken                          | < 24 hours       |
| S2  | Partial breakage, workaround exists           | < 1 week         |
| S3  | Minor / cosmetic                              | Next sprint      |

## Open

_(none yet)_

## Resolved

### BUG-2026-07-13-002 — /discover shows "0 laundries nearby" when API has data

- **Severity:** SEV2
- **Reported by:** user
- **Reported at:** 2026-07-13
- **Environment:** local
- **Symptoms:** Filters bar showed `0 laundries nearby` while `/laundries` returned items — either during fetch (loading gap) or after `applyClientFilters` removed every row when filter caps were invalid zeros.
- **Repro:** Open `/discover`; with zeroed `maxDistance` / `maxPrice` / `maxDeliveryHours` caps, all enriched laundries were excluded despite API data.
- **Root cause:** `applyClientFilters` compared pseudo-fields with unnormalized caps (`Number('')` → 0), so any positive distance/price/delivery failed every check. Loading state also cleared before enriched rows existed, flashing `0 nearby`.
- **Fix:** Added `normalizeLaundryFilters` + sentinel-aware filtering; defensive `parseLaundryListPayload`; improved `isLoading` in `useLaundryDiscovery`; unit + Playwright coverage.
- **Resolved at:** 2026-07-13
- **Postmortem:** n/a (SEV2)

### BUG-2026-07-13-001 — Hero sticky CTAs overlap carousel text on mobile

- **Severity:** SEV3
- **Reported by:** user
- **Reported at:** 2026-07-13
- **Environment:** local
- **Symptoms:** On mobile (~375px), absolutely positioned sticky CTAs (`data-marketing-sticky-cta`) cover carousel slide headline and subcopy inside `GlassSurface`.
- **Repro:** Open `/` at 375px viewport width.
- **Root cause:** Sticky CTAs were `absolute inset-x-0 bottom-0` over the carousel; slide bottom padding (`pb-24`) was insufficient for tall GlassSurface content on the first slide (brand badge + stats).
- **Fix:** Move mobile-only sticky CTAs below the carousel in normal document flow (`sm:hidden`); remove overlay padding from slides; reposition dot indicators to carousel bottom; per-slide CTAs remain on `sm+`.
- **Resolved at:** 2026-07-13
- **Postmortem:** n/a (SEV3)

## Entry template

```
### BUG-NNN — <title>
- **Severity:** S0 / S1 / S2 / S3
- **Reported by:** <user / monitor>
- **Reported at:** YYYY-MM-DD HH:MM
- **Environment:** prod / staging
- **Symptoms:** ...
- **Repro:** ...
- **Root cause:** ...
- **Fix:** <commit / PR>
- **Resolved at:** YYYY-MM-DD HH:MM
- **Postmortem:** <link> (if S0/S1)
```
