# Improvement Recommendations — DLM Platform

**Date:** 2026-06-03  
**Prioritized roadmap from QA audit**

---

## P0 — Before any production pilot

1. **Provision CI test database** — Docker Postgres in GitHub Actions; run full `pytest` on every PR (fixes BUG-010).
2. **Production secrets policy** — Validate JWT ≥32 chars, Razorpay webhook secret, no `otp_debug` in prod (BUG-003, BUG-002).
3. **Payment lifecycle completion** — Handle `payment.captured`, idempotent webhooks, refund admin workflow (BUG-012).
4. **Forgot / reset password UI** — Wire to existing APIs (BUG-001).
5. **Partner settlement ledger** — Payout calculation, hold on Critical fraud (BUG-011).

---

## P1 — First 30 days post-launch

6. **Real notifications** — Backend `notifications` table + push/email for order status, disputes, fraud Critical (BUG-014).
7. **Loyalty accrual** — Points on delivered order; display in account (BUG-013).
8. **Rate limit hardening** — Fail closed on `/auth/*` when Redis down (BUG-017).
9. **Expand E2E** — Playwright: customer order E2E, partner delivery E2E, admin dispute (BUG-024).
10. **Admin export** — CSV for orders, disputes, fraud alerts (BUG-015).

---

## P2 — Scale & polish

11. **Fraud automation** — Block checkout for Critical customers; partner payout hold (FRAUD_PROTECTION_REPORT).
12. **Nightly fraud/trust batch job** — Celery scheduled re-evaluation.
13. **Performance baselines** — Lighthouse CI + k6 load tests (PERFORMANCE_REPORT).
14. **N+1 query fixes** — Batch admin trust/fraud list metrics.
15. **Order idempotency** — Prevent duplicate submissions (BUG-016).
16. **Webhook replay protection** — Store processed Razorpay event IDs.

---

## P3 — Nice to have

17. Google OAuth completion or removal (BUG-018)
18. Reorder / "Book again" flow (BUG-023)
19. Image perceptual hash for fraud photo dedup
20. Consolidate duplicate complaint type enums (BUG-021)
21. RS256 JWT for multi-service federation

---

## Quick wins already done in this audit

| Item | Impact |
| ---- | ------ |
| Fixed TypeScript build (disputes, trust card, partner order) | Unblocks CI/CD |
| Razorpay webhook reject without secret in prod | Closes payment forgery vector |
| RoleGuard on inventory-changes | Closes admin UI bypass |

---

## Suggested team allocation

| Stream | Owner | Duration |
| ------ | ----- | -------- |
| Payments + settlement | Backend + BA | 2–3 sprints |
| Auth UX + CI tests | Full stack + QA | 1 sprint |
| Notifications + loyalty | Backend + FE | 1 sprint |
| Performance + load test | DevOps + Perf | 1 sprint |
| E2E + a11y | QA | Ongoing |

---

## Target scores after P0+P1

| Dimension | Current | Target |
| --------- | ------- | ------ |
| Overall readiness | 54% | 75% |
| Security | 58 | 80 |
| Fraud protection | 78 | 85 |
| UI/UX | 72 | 82 |

**Estimated effort to production-ready:** 6–10 engineering weeks assuming 2 full-stack developers + QA.
