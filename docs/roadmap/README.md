# Roadmap

Live roadmap. Updated weekly.

## Phases

### Phase 0 — Workspace bootstrap ✅
- `.cursor` workspace + rules + agents + workflows
- Scaffolded backend + frontend + docs + infra

### Phase 1 — Foundations
- Auth (register, login, refresh, OTP)
- User profile + addresses
- Base UI shell + dark mode
- CI/CD green
- Sentry + analytics wired

### Phase 2 — Customer MVP
- Laundry discovery (search, filter, sort)
- Laundry detail with services + pricing
- Order placement (pickup window, address, total)
- Order tracking (status updates via WebSocket / polling)
- Order cancellation within window
- Reviews + ratings

### Phase 3 — Partner MVP
- Partner registration + admin approval
- Service + pricing management
- Order management (accept, update status, deliver)
- Partner dashboard with revenue + KPIs

### Phase 4 — Admin
- Laundry approval queue
- Complaints
- Dashboards (KPIs, partner health)
- Commission configuration

### Phase 5 — Subscriptions + payments
- Razorpay integration (UPI, cards, wallets) + COD
- Subscription plans ([ADR-002](../decisions/ADR-002-subscription-billing.md))
- Recurring billing
- Refunds + manual partner payouts (v1)

### Phase 6 — Polish + launch
- Marketing landing (R3F hero)
- Performance + a11y polish
- Mobile-first audit
- Pre-launch QA
- Launch

## Current focus

Phase 1 — Foundations.

See `.cursor/context/current-status.md` for the live state.

## Future / nice-to-have

- iOS / Android native apps (React Native or Expo)
- Surge pricing
- Loyalty program
- Referrals
- Live agent chat
- B2B (hostels, salons)
