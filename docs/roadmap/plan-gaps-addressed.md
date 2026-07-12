# Plan gaps addressed (2026-05-29)

Gaps found in the original 24-week plan and how they were fixed.

| Gap | Risk | Resolution |
|-----|------|------------|
| Stripe vs Razorpay conflict | Wrong payment integration | ADR-001 + config/env use Razorpay |
| No local setup guide | You cannot run the app | [`SETUP.md`](../../SETUP.md) at repo root |
| `dlm_test` DB not documented | CI/tests fail locally | Documented in SETUP; create with `CREATE DATABASE dlm_test` |
| GST / tax not in order model | India invoicing blocked | Phase 2: add `gst_rate`, `cgst`, `sgst`, `invoice_number` on orders |
| Refresh token in localStorage | XSS token theft | Access token in memory (Zustand); refresh in httpOnly cookie — Phase 1.1 hardening |
| PWA icons missing | Install prompt broken | Add `public/icon-192.png` and `icon-512.png` before launch |
| Google OAuth stub only | Incomplete auth story | Endpoint returns 501 until `GOOGLE_CLIENT_ID` set |
| PostGIS vs haversine undecided | Discovery perf | v1: haversine + lat/lng indexes; PostGIS when >10k laundries |
| `scripts/db/init.sql` path in compose | Init script may 404 | Verify path: `scripts/db/init.sql` vs `docker/postgres/init.sql` |
| Commission 10% vs 15% | Partner confusion | Launch default **10%**; per-partner override in admin |
| WhatsApp templates | Notification delay | Apply templates in week 10; SMS fallback |
| No runbooks | Incidents slow | Add `docs/runbooks/` before staging deploy |
