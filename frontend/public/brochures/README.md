# Franchise brochures

## Drop the official PDF here

| Public URL | Local path |
| ---------- | ---------- |
| `/brochures/washhouse-franchise.pdf` | `frontend/public/brochures/washhouse-franchise.pdf` |

Marketing “Request brochure” CTAs (home franchise teaser, franchise page, hero franchise slide) download this file via `FRANCHISE_BROCHURE_PDF_HREF` in `frontend/features/marketing/franchise/franchise-constants.ts`.

### Status (2026-07-27)

The checked-in file is still a **placeholder** (~679 bytes) so the CTA keeps working in local/staging.

**Blocker:** Official WashHouse franchise brochure PDF is not in the repo yet. Replace in place:

1. Drop the real PDF at `frontend/public/brochures/washhouse-franchise.pdf` (same filename).
2. No href / constant changes required.
3. Smoke: homepage + `/franchise` “Request brochure” should download `washhouse-franchise.pdf`.

If you have the official file, send the path or attach it and we will swap it in place.
